# DEEPSEEK — contrato del informe, correcciones, pruebas y plan de despliegue

**Rol:** arquitecto/auditor independiente de solo lectura; investigar SOURCE pública y documentación técnica, detectar contradicciones y prescribir un único diseño implementable. **No ejecutar acciones en GitHub ni fingir acceso al Lenovo.** Base congelada en `6f205d8a2a8cae833a5a0fa3ac6b30d6a641674a`. Si hay SOURCE posterior, señalarla con SHA y decidir reconciliación, pero no sobrescribir Work E3. Work material se reanudará o recreará **solo después** de revisar este informe.

## Criterios de diseño (aceptar, cuestionar y mejorar)

1. **Una conversación, una identidad y un AgentClient native** para chat, herramientas y memoria. El motor SIWC ChatGPT plan se selecciona como proveedor **dentro del mismo AgentClient** y no como chat exterior que «arranca un agente nuevo». El router semántico tiene preclasificación de intent R0 antes de LLM y validación/autorización posterior a la propuesta del modelo. El Tentáculo HUD se suscribe a eventos/receipts, no se interpone obligatoriamente en inferencia.
2. **Autonomía alta en PC propiedad del usuario:** poder consultar y actuar sobre archivos, repos, procesos, aplicaciones, UI/browser, servicios y cambios host mediante el único MCP y el plano HOST_CONTROL existente. No crear otro Kernel ni servicio controlador. El usuario quiere mínimo fricción: distinguir operaciones reversibles R0/R1 de las irreversibles/externas que requieren grant real, evitar microaprobaciones arbitrarias, soportar acuerdos persistidos con alcance y caducidad, conservar pruebas y rollback. Un modelo no puede fabricar permisos a partir de su propio texto.
3. **Modelos:** ChatGPT Plus por SIWC OAuth autorizado, quota compartida del plan; otros remotos verdaderamente 0€ con catálogo/health/latencia/privacy/TTL verificables; Ollama local opcional solo bajo demanda; paid fallback NEVER. No utilizar cookies ChatGPT, API keys privadas ajenas, proxies no autorizados, ni asumir tokens ilimitados.
4. **Contexto duradero con ventana finita:** identidad NOSTROMO breve, perfil/objetivo actual, memoria relevante y respaldada, resumen versionado, últimos mensajes con presupuesto, esquema de tools cargado SOLO para la fase actual. Historial completo siempre almacenado; retrieval con referencias/IDs de evidencia. Pruning de outputs grandes sin suprimir recibos, reserva de respuesta, métricas de latencia y RAM. Un turno «Hola» no debe inyectar 28 herramientas ni 4500 tokens de reglas redundantes.
5. **Recuperación:** persistencia Mongo, checkpoints nativos, misma conversación desktop/móvil, no doble ejecución material al reconectar. Emisión SSE incremental, cancellation y post-refresh guard; terminal `response.completed` para SIWC, errores `response.failed`, `incomplete`, EOF y límite de uso se manejan como tales. Abort del cliente no prueba rollback de operación.
6. **Capas separadas:** SOURCE público ≠ overlay instalado ≠ YAML efectivo ≠ Agent Builder Mongo ≠ servicio activo ≠ prueba E2E. `main` no contiene necesariamente E3. Preservar el upstream pinned, agente persistido, MCP LIVE `vx-clean`, Compose y datos `~/LibreChat`.

## Auditoría de referencias: leer los bytes

**Repositorios/pins:**
- NOSTROMO `elkakas314/libre_chat_vx@6f205d8a2a8cae833a5a0fa3ac6b30d6a641674a` y PR #54.
- LibreChat `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`.
- Agents SDK instalado `@librechat/agents@4.0.1`; validar exports reales `node_modules/@librechat/agents/package.json` / `exports` y código upstream, **NO asumir import `@librechat/agents/llm/openai`**.
- Issues [#37 receipts](https://github.com/elkakas314/libre_chat_vx/issues/37), [#55 SIWC](https://github.com/elkakas314/libre_chat_vx/issues/55), [#56 árbol](https://github.com/elkakas314/libre_chat_vx/issues/56).
- Documentos específicos SRC: `deployment/librechat-agents/agentclient-siwc-binding.mjs`, `ci/fixtures/siwc-agentclient-sdk.stub.test.cjs`, `src/llm/siwcOpenAiFetch.ts`, `src/llm/siwcConnectionService.ts`, `src/librechat/nativeInferenceRouteAdapter.ts`, `src/intent/nostromoDecisionBridge.ts`, `src/conversation/clientCompaction.ts`, `overlay/upstream/VXCockpitBridge.tsx`.
- Contratos canónicos: `SPEC.json`, `TOPOLOGY.json`, `docs/NOSTROMO_FEATURE_MATRIX_CURRENT.md`, `docs/REQUIREMENT_LOCATION_MATRIX_CURRENT.md`, `overlay/UPSTREAM_INTEGRATION_MAP.json`.
- Docs oficiales OpenAI SIWC, LibreChat Agents/memory/summarization, GitHub gh auth, MCP SDK; verificar versión/fecha. SIWC `tool_search`/hosted MCP **no soportados**, herramientas locales deben mapear function/custom admitidas.

## Problemas detectados, hipótesis a verificar — NO tratar como causa probada

| Incidencia | Evidencia observada | Diagnóstico requerido de DeepSeek |
|---|---|---|
| Qwen preflight / contexto 2048/6144 | tool schemas + instrucciones exceden ventana; turnos «Hola» 92%; respuestas vacías y CPU/VRAM elevadas | localizar composición de mensajes/herramientas en upstream, ruta API usada, separar overflow vs SSE/endpoint vs tool schema |
| SIWC AgentClient hook | work creó parche en `initialize.js` con hash upstream, usa `createSiwcAgentClientRunAgent`, `configuration.fetch`; sin despliegue | verificar que se ejecuta ANTES de construir cliente/model/provider, que provider válido y esquema de Responses compatible, que usuario/memoria/permisos no cambian |
| CI nativa del commit 6f205d8 | último run canary terminó FAILURE; source-check seguía ejecutándose al corte | leer log del run exacto; si test SDK importa ruta no exportada, reemplazar por la export real con fixture no degradado; si hay otro fallo, no asumir causa |
| Ruta SIWC en builder | `siwcOpenAiFetch` exige `store=false/stream=true`; tools `namespace`; dependencias auth por usuario | comprobar requests que realmente emite Agents 4.0.1/LangChain; tool_call/function_call_id, streaming incremental, maxRetries/abort/account isolation |
| Estado `model` y tools | Builder persistido Qwen3; adaptador SOURCE no prueba binding | propuesta runtime ephemeral por petición (no guardar mutation en builder), snapshot y rollback; evitar forzar `INVESTIGAR` por solo tener tools |
| Memoria | YAML leído no contiene memory; .env override desconocido | configuración nativa efectiva, habilitar User Memory sin extractor pagado; compactación no perder historia y no cargar Ollama |
| Visual | overlay Bridge simplificado y cockpit completo SOURCE distinto; CI head heading obsoleto corregido | declarar qué componentes nativos se reusan, cómo se monta HUD evento real, no segundo visor/segunda app |
| Raíces host | `~/LibreChat` Compose datos activos, `~/libre_chat_vx-clean` MCP, `~/upstream` distinto | inventario semdiff, consumidor, mounts, git dirty, scripts; migración sin destruir datos |
| Autonomía | host grant R2 no acreditado, controlador externo, token GitHub fine-grained | proponer permisos amplios gobernados y contratos de operación; no sustituir autorización host por git token |

## Salida obligatoria: un informe completo listo para implementar

El informe debe estar en **español**; comandos/código en idioma original. Se permiten varias secciones, pero que se pueda usar como **una misión Work autosuficiente** sin descubrimiento duplicado. Entrega como mínimo:

**I. Resumen ejecutivo** — Decisión de arquitectura, estado actual vs objetivo, **máximo 10 bloqueos verdaderos** clasificados `INTERNAL_REPAIRABLE/CONFIG_GAP/EXTERNAL_BOUNDARY/SECURITY_BOUNDARY/UNAVAILABLE_TOOL`, primer cambio material que desbloquearía conversación. Riesgos y exactitud (qué es fuente vs inferencia).

**II. Diagrama canónico** — Mermaid `flowchart` y `sequenceDiagram`, al menos flujos: saludo texto, petición lectura MCP, encargo material con permisos, interrupción/reanudación, cambio/cuota SIWC, memoria/compactación, HUD. Diferenciar función UX de objetos de ejecución (AgentClient existe desde inicio, ChatGPT no invoca por sí solo Host Control).

**III. Matriz canónico vs real** — todas las familias de 39 features, 120 requisitos (pueden agruparse con IDs conservados), 119 capacidades Drive solo si bytes públicos verificables, nativas LibreChat reutilizadas; `source_path / installed_assumed / expected_live / evidence / gap / owner`. Si no hay host readback etiquetar UNKNOWN, no inventar.

**IV. «Placement» de cada familia** — árbol lógico final; mapa exacto de módulos y puntos hook upstream + repo VX, propietario de memoria, config YAML, tokens OAuth, ToolApproval, MCP, jobs, receipts, estado/UI y datos Docker. Indicar lo que se **debe conservar tal cual**, **reusar**, **reparar**, **mover con semdiff**, **deprecar/quarantine**, y lo que **no** debe escribirse.

**V. Contratos tipados y datos** — ejemplos completos, coherentes, de `TurnIntent`, `InferenceSelection`, `SiwcOAuthAccountBinding`, `ToolCandidate`, `ToolInvocation`, `GoalAgreement`, `GovernedHostAction`, `Receipt`, `HudEvent`, `ContextBudget`, `MemoryCheckpoint`; estados/errores/idempotency key; no inventar endpoint real. Versionado e interoperabilidad.

**VI. Correcciones concretas como propuestas de diff** — por cada modificación `path`, `base SHA/blob`, símbolo/función y ancla exactos, antes/después o patch unificado completo, regresión afectada, prueba requerida, rollback. Priorizar cambios sobre módulos ya existentes, no crear `nativeRouteRouter2.ts`. Si DeepSeek no puede corroborar el archivo, decirlo y no fabricar patch.

**VII. Plan de implementación atómico e idempotente para Work** — etapas `P0...Pn`, cada una con `input refs, preconditions, reads, write-set, test commands, success receipts, stop/grant, rollback, dependency`. Una fase útil por commit/PR; un solo escritor; fast-forward, CAS, staging/worktree aislado; CI exact HEAD y host deployment gobernado. No detener progreso global ante bloqueo parcial (mantener otros bloques elegibles).

**VIII. Reutilización/limpieza del Lenovo** — clasificación exacta por raíz y datos `KEEP_ACTIVE/KEEP_DATA/KEEP_SOURCE/UNKNOWN_PRESERVE`; R0 incremental sin exploración de 50GB; plan de rescate `~/libre_chat_vx-clean`, comparación de `~/upstream`, Compose en `~/LibreChat`, deprecación y cuarentena reversible, restauración probada. No asumir que DeepSeek conoce los bytes del Lenovo.

**IX. Observabilidad y recursos** — presupuestos medibles por tokens/costes local-model, RAM swap CPU PSI GPU; `TTFT`, streaming, solicitudes tools y tiempos, modo degradado que no bloquea toda la cabina; sin cifras inventadas ni altos consumos en reposo.

**X. Reinicio PC por actualizaciones y continuidad de misión** — checkpoint Git/DB/handoff, si hay reboot-required vs apt upgrades pendientes, comprobación acceso tras login/boot/Tailscale, permisos host exactos, suspensión ordenada y readback boot ID nuevo. No confundir intención usuario con grant técnico ni garantizar reanudación automática.

**XI. Plan de aceptación final** — pruebas a tres niveles: SOURCE unit, CI upstream montado con mock, HOST autenticado LibreChat + SIWC consentido + Mongo + real MCP tool; negativo quota, unsupported SIWC tool/field, token refresh/revoke, 0 material sin permiso, cancellation/unknown outcome. «PASS» solo por receipt comprobable.

**XII. Hand-off final** — propuesta de `WORK_OBJECTIVE.md` autosuficiente (misión nueva vs continuar E3, con criterio de decisión basado en su estado), `CURRENT` consolidado, plan de commits y next eligible actions; nada de reescribir historia, no llamar nuevo Work sin decidir.

## Secuencia candidata (DeepSeek debe validarla/optimizarla)

1. READ ONLY: HEAD exacto, diff, upstream/SDK exports y CI failure root-cause; clasificar docs obsoletas.
2. Repair SOURCE P0: build/reconciliación CI SIWC AgentClient + auth user-bound + Responses SSE; 0 API facturable y tests multiusuario.
3. Configure context: budget fijo + reserve output, tool selection por fase, native compaction/memory, persistencia de historia; sin inferencia Ollama extensa.
4. Integrar runtime actual **sin sobrescribir cambios**: preimagen, staging, compare SHA, deploy R2 autorizado; registrar consent ChatGPT oficial (la única acción humana de cuenta).
5. Primer E2E: SIWC chat natural 2 turnos, respuesta SSE, save/reload en Mongo, TTFT/VRAM, no Qwen; luego llamada R0 `nostromo_estado` con evidencia.
6. Plan → permisos → tools materiales → readback y rollback con action registry existente; autonomía alta pero sin permisionado por LLM.
7. Montar Tentáculo HUD completo con eventos LIVE, visores nativos, PWA, voz separada de SIWC; validar móvil y acceso privado.
8. Inventario delta host/Compose/datos, cutover a fuente Git única con rollback, cuarentena de material redundante **solo acreditado**, no borrar datos activos.
9. Preparar/efectuar reboot seguro por actualizaciones según grant y recuperación real, coordinar el checkpoint donde menor riesgo.
10. Cerrar PR #54 solo si gates de CI exact HEAD + HOST LIVE E2E y persistencia validados.

## Plantilla CLI de trabajo futuro (solo Git, no reinicia ni instala)

```bash
set -euo pipefail
set +x
REPO='elkakas314/libre_chat_vx'
BRANCH='integration/nostromo-canon-20261118-r1'
gh auth status
REMOTE_SHA="$(gh api "repos/$REPO/git/ref/heads/$BRANCH" --jq '.object.sha')"
printf 'REMOTE_HEAD=%s\n' "$REMOTE_SHA"
# Work elige el checkout/worktree ya acreditado; no asumir que ~/librechat/vx existe.
# En checkout seguro: git rev-parse HEAD; git status --porcelain=v1 -uall; git diff --check.
# Si dirty, preservar cambios y NO reset/clean; usar worktree independiente desde SHA.
# commits pequeños, git push normal fast-forward, no force-push; comprobar CI SHA exacto.
# No usar fine-grained PAT como grant de ejecución, de host ni de SIWC.
```

**La vía GitHub fine-grained PAT o `gh` autenticado** sirve para `git fetch/push` y PRs conforme a permisos. La instalación local se hace bajo el plano host autorizado y hashes comparados, no por copiar directamente un árbol remoto al directorio productivo.

## Lo que no debe hacer DeepSeek

- No escribir solución nueva desde cero ni proponer segundo router/Kernel/DB.
- No asumir que ChatGPT OAuth elimina el límite de contexto; resolver el preflight.
- No transformar SIWC en API ChatCompletions facturable.
- No inventar cuentas autorizadas, modelos, cuotas, grants, HEAD, tool calls ni PASS.
- No aconsejar borrar `~/LibreChat`, resetear Mongo, `rm -rf`, `docker system prune --volumes`, `git reset --hard`, `git clean -fdx` o force push.
- No mezclar MANOJOS3, MANOJOS producto, VX13 y ORÁCULO con el kernel de NOSTROMO.
- No entregar «mejora arquitectura» sin rutas, contratos, tests, aceptación, migración, rollback ni orden para un único Work.
- No copiar código de DevKit SIWC sin comprobar licencia.
