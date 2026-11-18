# WORK — NOSTROMO, OBJETIVO FINAL INTEGRADO GEMINI × SOURCE × HOST
**Encargo autosuficiente para continuar el MISMO Work del Lenovo; no crear otro escritor. Fecha: 18-11-2026.**
**Repositorio público:** https://github.com/elkakas314/libre_chat_vx
**Rama de integración:** `integration/nostromo-canon-20261118-r1`. **PR #54 DRAFT:** https://github.com/elkakas314/libre_chat_vx/pull/54
**Receipts:** https://github.com/elkakas314/libre_chat_vx/issues/37
**Upstream fijado:** `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`, agente SDK `@librechat/agents@v4.0.1`.
**HEAD de arranque anterior a este documento:** `8b464b66cbdff3d1ab2e7d02e168fbd9aa5293db`; consulta **HEAD vigente** por GitHub CLI antes de cualquier cambio.

## OBJETIVO MATERIAL NO NEGOCIABLE
LibreChat VX NOSTROMO es producto completo, con una identidad conversacional fluida en español y un agente principal nativo. El agente entiende lenguaje natural, decide herramientas/contexto, selecciona LLM gratuito/local apto (GPU Qwen 4B a demanda, sin pago involuntario), ejecuta mediante el único MCP stdio `nostromo-autonomo` bajo política local, y devuelve trabajo realmente verificado con readback/receipt. **Cerrar primero P0: saludo sin atascarse, contexto que cabe, MCP R0 usable y persistencia tras recarga.** Luego router LLM/intención, tareas, web/scraping público, gestor, Tentáculo HUD, Artifacts, Files/RAG, eventos, móvil PWA/voz y recuperación. Sin levantar otro MCP/Worker/frontend/Kernel/router/DB ni alterar MANOJOS3, VX13 u ORÁCULO.
**No basta instalar.** Exigir resultado final observable, estado persistido y pruebas negativas R2 sin autorización. Preferir ejecución autónoma en bloques, no repetir auditorías generales ya cerradas y no preguntar por detalles recuperables.

## LEER ANTES DE MODIFICAR (nueva fuente consolidada)
1. `docs/observaciones-externas/GEMINI_DEEP_RESEARCH_NOSTROMO_RECEIVED_20261118.md` — informe usuario/Gemini, claims NO verificados.
2. `docs/NOSTROMO_GEMINI_P0_SOURCE_AUDIT_20261118.md` — revisión de incompatibilidades, nombres reales, hipótesis P0 y criterios.
3. `docs/WORK_NOSTROMO_E2E_HOST_CLOSURE_20261118.md` — contrato extenso anterior, seguir si no contradice nuevo.
4. `docs/NOSTROMO_AGENTS_PLUGIN_CONFIGURATION_AUDIT_20261118.md` — catálogo Skills 14 físicas/12 stage1/10 stage2.
5. `deployment/librechat-agents/deferred-instance-filter.mjs` y su test de fixtures; `scripts/audit-tool-context.mjs`; `deployment/nostromo-mcp/{tools,server,async-jobs}.mjs`.
6. `agents/nostromo-autonomo/agent.candidate.json`, `config/librechat-vx.example.yaml`, `src/intent/*`, `src/llm/*` y GitHub issue #37.
7. Si la sesión Work conserva contexto: objetivo existente `/home/elkakas314/.codex/attachments/4cbb2c50-1635-4464-bf1c-3f709c8a003e/goal-objective.md` cuando esté accesible. No afirmar leído si no se ha leído.

## GH CLI + FINE-GRAINED PAT (AUTORIZACIÓN EXISTENTE, NUNCA MOSTRAR TOKEN)
**Orden: comprobar → usar → publicar → verificar.** Este chat ya publicó cambios en GitHub mediante conector autenticado. El Work del Lenovo debe reutilizar **sus credenciales ya autorizadas** si existen; NO solicitar copiar ningún token en un chat o issue.
```bash
# R0 / sin set -x; no imprimir .env, gh auth token ni variables de secretos.
set +x
command -v gh && gh --version
gh auth status
gh repo view elkakas314/libre_chat_vx --json nameWithOwner,defaultBranchRef
gh api repos/elkakas314/libre_chat_vx/git/ref/heads/integration/nostromo-canon-20261118-r1 --jq '.object.sha'
# En cada checkout real, NO adivinar:
git rev-parse --show-toplevel
git rev-parse HEAD
git status --porcelain=v1 -uall
git remote get-url origin | sed -E 's#(://)[^/@]+@#\1[REDACTED]@#'
```
- `GH_TOKEN` es una variable de entorno admitida oficialmente por `gh` para fine-grained PAT; úsala **sólo si YA está presente en un gestor seguro**, sin imprimir su valor, persistirla en shell history, Git URL, configuración, log, commit ni chat. No invocar `gh auth token` ni `env` completo.
- Permisos mínimos cuando los necesite: `Metadata:read` (inherente), `Contents:read/write` para push, `Pull requests:read/write` para PR, `Issues:read/write` para receipts; `Actions:read` si se audita CI. Nunca scopes admin, secrets/deletion ni force-push. `GITHUB_SKILLS_TOKEN` del sync nativo sigue siendo **read-only**, no reutilizarlo como escritura del Work.
- `gh auth setup-git` configura Git credential helper y puede cambiar config persistente; úsalo **sólo después de observar el helper actual**, respaldo reversible y evitar choque de identidades. Si el helper ya funciona, no lo ejecutes.
- Sin permiso GH, seguir E2E LOCAL R0, producir diffs y receipts privados; no inventar GitHub publicado.
- Antes de push: lectura del HEAD actual remoto, `git status`, comprobar que la rama es integration y fast-forward; hacer backup de trabajo único, evitar checkout/reset sobre dirty. Commits pequeños, `git push origin HEAD:refs/heads/integration/nostromo-canon-20261118-r1` normal **sólo si fast-forward verificado**, relectura `gh api ...git/ref` y GitHub CI exact SHA. Sin force, no main y no merge PR #54 sin host gates.
- Si git/gh remoto usa URL con credenciales embebidas, **no** mostrarla. No modificar token desde el LLM ni crear uno por script.

## EJECUTA DE VERDAD, NO SÓLO REDACTES GUÍA
### W0 — Física y conservación
Determinación R0 del árbol y servicios reales. Candidatos reportados: `/home/elkakas314/librechat/upstream` (LibreChat + Mongo/Ollama), `/home/elkakas314/libre_chat_vx-clean` (único MCP/source); `/home/elkakas314/librechat/vx` histórico. No asumir que existen ni moverlos; comparar rutas, dueños, symlinks, HEAD/status/diff, servicio systemd real `systemctl --user list-units --all --type=service` y `systemctl list-units --all --type=service`. `vx-backend.service` y `ExecStartPre` son hipótesis de Gemini, NO estados verificados. No arrancar/reiniciar ni `mongosh` con contenido del chat como primer probe.
```bash
# Reutilizar probes R0 existentes, desde el checkout REAL reconocido:
node scripts/nostromo-backend-preflight.mjs
node scripts/nostromo-preflight.mjs --help
node scripts/audit-tool-context.mjs --input /RUTA_PRIVADA/SNAPSHOT_SANITIZADO.json
node --test deployment/librechat-agents/deferred-instance-filter.test.mjs
node --test scripts/tests/audit-tool-context.test.mjs scripts/tests/nostromo-skills-inventory.test.mjs
```
`npm run nostromo:check` es preflight, NO una prueba E2E ni «tres tests» como afirma Gemini. Para MCP offline ejecutar los tests ya existentes en `deployment/nostromo-mcp` con dependencias instaladas previamente, sin `npm install` innecesario.

### W1 — Resolver P0 en @librechat/agents 4.0.1
Usar `@librechat/agents` REAL cargado por el backend (ruta instalada src/dist/cjs/dist/esm). Validar `package.json` nombre/version, preimágenes, SHAs y module loader. **Rechazar** `packages/agents/src/tools/deferralFilter.ts` de Gemini: esquemas `parameters:{}`, tres direct arbitrarias, `nostromo_catalogo` no existe.
Existe `deployment/librechat-agents/deferred-instance-filter.mjs` con patch exacto que busca rama de `getToolsForBinding` para instancias y su test; NO aplicar por defecto. Contrastar `tool_options.*.defer_loading` PERSISTIDO, cap `deferred_tools` real, `toolRegistry`, `getActiveToolDefinitions`, `getEventDrivenToolsForBinding`, `calculateInstructionTokens`, `toolSchemaTokens` cached, `getToolsForBinding`, herramientas nativas extras, history, maxContextTokens. Comparar 11 MCP seleccionadas (8 defer/3 directas) vs 13 schemas de preflight y ~3152+5302>6144 sin reserva. La cifra NO prueba causalidad. Saneamiento: sólo conteos, tiempos, estados, hashes/versión y paths públicos; nunca tools raw prompts o secretos.
Cuando el defecto concreto quede probado: cambio **mínimo** del paquete o configuración real, backup exacto de src+CJS+ESM preimagen, unit test, canario, rollback probado y verify. No aumentar num_ctx ciegamente, no eliminar toolDefinitions ni insertar schemas vacíos. Mantener descubrimiento MCP real. Si no hay fallo de definición, aislar provider/preflight.
**Memoria y contexto:** reutilizar `summarization` y `contextPruning` de LibreChat para historial; memoria pequeña referenciada y sólo si ayuda; **no** añadir extracción automática por turno ni nuevo SQLite/VectorDB para esconder exceso inicial.

### W2 — Canarios HOST E2E y latencia
A. «Hola»: Agent Builder persistido real con proveedor Qwen3-4B (modelo por readback, no asumir variante) devuelve texto final; medir TTFT/tiempo total/errores, persistencia Mongo y reload.
B. «Consulta `nostromo_estado` y resume el resultado»: el agente invoca **`nostromo_estado`**, MCP stdio responde con identidad/estado propios, el agente redacta resultado final; persistencia tras reload con la misma conversación.
C. Negativa controlada de R2 sin permiso; R0 test de `nostromo_herramientas` y `nostromo_auditoria_r0` cuando realmente habilitados. `nostromo_estado` **NO** es health total del Lenovo.
D. Verificar Mongo SIN publicar mensajes: usar cliente/autenticación real, observar **campos/tipos/status/longitudes de salida** asociados al turno; NUNCA `db.messages.find(...).pretty()` con texto crudo. Confirmar que no hay respuesta huérfana, doble tool call ni replay material.
E. Medir recursos CPU/RAM/swap, `ollama ps` o `GET /api/ps`, drivers/VRAM reales si existen, `num_ctx` efectivo, temperatura, frío/caliente, consumo idle y cooldown de Ollama. El «menos de 60 s» de Gemini es **objetivo aspiracional**; registrar línea base y mejora sin inventar umbral PASS físico.
F. No declarar FULL PASS si sólo se obtiene un HTTP 200, salida MCP o unittest.

### W3 — Producto completo y flujos correctos
Conectar el `src/intent/nostromoDecisionBridge.ts` y `src/llm/inferenceGateway.ts` al **runtime nativo**, si aún son SOURCE-only, sin otro router. Exigir capacidad, contexto, salud, cuota, evidencia live y cero coste; el modelo local 4B no debe ejecutar tareas largas con ventana insuficiente y es opcional/on-demand. SIWC OAuth sólo consentimiento humano explícito, sin API key facturable y cuota compartida.
Un solo MCP con catálogo SOURCE de 12 tools (ver `deployment/nostromo-mcp/tools.mjs`); `nostromo_terminal_ejecutar` incompatible simultáneamente con el trío async. Respeta grants de host R2 separados del agente. Reutilizar scheduler y jobs existentes, no duplicarlos; recuperación UNKNOWN_OUTCOME no se reintenta. Web Search y scraping público, browser cuando requiera interacción, Files/RAG, Artifacts, HUD Tentáculo, tareas, Agent Events, móvil y PWA sobre mismo backend/Mongo. Cada módulo con SOURCE/CONFIGURED/LIVE/VERIFIED, tests de continuidad.
Skill Sync reconciliado: 14 físicas, stage 1 12 rutas explícitas, stage 2 diez; no activar sin admin readback del sourceId/tenant/ACL y rollback.

### W4 — CLOSEOUT VERIFICABLE
1. Por cada cambio `CHANGE → TEST → READBACK → VERIFY`, hashes, HEAD/diff, prueba, rollback.
2. Publicar en `integration/nostromo-canon-20261118-r1` con `gh`/Git únicamente autorizado y fast-forward. Adjuntar resultados saneados a issue #37; no secretos ni texto privado de Mongo.
3. CI real exact SHA, PR #54 DRAFT hasta E2E host. Estado de cada bloque **SOURCE / INSTALLED / CONFIGURED / LIVE / VERIFIED**.
4. Dejar `CURRENT`, handoff y receipts legibles con fecha, comandos/salidas redacted, permisos, servicios/modelo efectivos, pruebas conversacionales/MCP/móvil, riesgos y próximo paso. No destruir datos únicos ni duplicar tareas.
5. Si consentimiento/política externa bloquea una acción, marcar EXTERNAL_BOUNDARY o SECURITY_BOUNDARY y continuar tareas independientes; no preguntar «¿continúo?» si se puede seguir.

**ARRANQUE INMEDIATO:** readback material del Lenovo + GH CLI auth/scope + estado del Agent Builder/MCP; luego un solo canario real «Hola», P0 de schema si falla, canario MCP y persistencia. Documenta lo que ejecutas, no sólo un plan.

## W5 — CABINA Y VISOR AVANZADO: CIERRE MATERIAL OBLIGATORIO
Consultar y ejecutar **`docs/NOSTROMO_COCKPIT_ADVANCED_VIEWER_WORK_GATE_20261118.md`**. Este encargo amplía W3 y NO se satisface con mencionar HUD ni con un screenshot de fixture. Source actual del puente `overlay/upstream/VXCockpitBridge.tsx` sólo proyecta actividad cargada + inventario `nostromoHubSourceSnapshot()` + `projectTentaculoHud([])` sin wiring de estados reales; `src/ui/NostromoCockpit.tsx` ofrece composición avanzada pero su montaje real está NO_VERIFICADO. Instala/integra/repara sobre panel nativo el cockpit/visor, sin nueva app; exige vista de archivos/Artifacts con renderers nativos, inspector contextual, estados con provenance, tareas/PlanGraph/ActiveFlow, repositorio, navegador, audio, Hub/HUD, DecisionInbox, módulos externos sólo lectura cuando sin grant. Botones `OPEN/PIN/COMPARE/TIMELINE/EXPORT` deben funcionar con callbacks/ACL o mostrar UNAVAILABLE. Verificar escritorio real, móvil/PWA mismo historial, foco/teclado/táctil, overlay OFF, performance y ausencia de datos falsos. Cambios a la UI requieren test visual real y E2E host; mantener PR DRAFT si sólo hay contratos SOURCE. No sacrificar P0 agent/MCP por apariencia.

## W6 — BAJO CONSUMO SIN PERDER MAGIA: REGRESSION GATE OBLIGATORIO
Existe el encargo específico `docs/GEMINI_DEEP_RESEARCH_NOSTROMO_VISOR_MAGIC_LOW_CONSUMPTION_20261118.md` (Gemini con Drive/Google Search, si llega su respuesta). **No esperar su resultado para continuar tareas independientes.** La cabina, visor avanzado, gráficos, archivos, Artifacts, HUD, animaciones útiles, móvil y tareas son requisitos materiales; NO reducir capacidades para obtener números menores. Reutilizar renderers nativos, aplicar lazy-loading/virtualización/subscripciones on-demand, TTL, backpressure, cache por ACL y descarte al ocultar, sólo después de medir. Un componente pesado debe reabrirse completamente y mantener estado/foco. Verificar CPU/RAM/heap/UI fluid, panel abierto/cerrado, scroll/bundle chunks, TTFT «Hola» y experiencia móvil antes/después; el éxito necesita NO regresión funcional, NO autoridad material desde visor, y métricas reales. El bajo consumo es coste de recursos INACTIVOS, no pérdida de magia ACTIVA. Documento técnico central de V0–V5: `docs/NOSTROMO_COCKPIT_ADVANCED_VIEWER_WORK_GATE_20261118.md`.

## W7 — PRECEDENCIA: CONVERSACIÓN Y ENTENDIMIENTO ANTES DE EJECUTOR
**Contrato obligatorio:** `docs/NOSTROMO_CONVERSATION_TO_GOVERNED_TASK_20261118.md`; `docs/GEMINI_DEEP_RESEARCH_NOSTROMO_DIALOGUE_TO_TASK_20261118.md`. El usuario exige conversar, clarificar, sugerir mejoras y buscar alternativas públicas R0 ANTES de lanzar MCP material/ejecutor/tasks. No activar por solo `wantsExternalChange+target`. SOURCE `src/intent/nostromoDecisionBridge.ts` ahora exige `agreedTaskHandoff` nativo con planHash/target/session; eso NO autentica ni constituye grant. Work debe wirear aceptación a sesión nativa y tareas/ToolApproval existentes, probar no ejecución previa, cambio de plan, «dale» tras plan, R0 antes de acuerdo, R2 denegada, recuperabilidad y receipts. En el chat sigue habiendo LLM; «sin agente» significa sin ejecutor material hasta objetivo acordado. Mantener visor/cabina contextuales sin coste permanente y NO esperar informe Gemini para avanzar en host. Si código de host ya resuelve parte, no duplicar. 
