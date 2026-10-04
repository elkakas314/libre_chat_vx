# HANDOFF CURRENT — LIBRECHAT VX / NOSTROMO

Corte de reconciliación: 2026-10-04.
Estado: `SOURCE_HANDOFF_READY / LIVE_NO_VERIFICADO / MATERIAL_VERIFIED=NO`.
Next action material: `BIND_LIVE_AND_REVALIDATE`.

## 1. Verdad operativa

LibreChat es un repositorio y plano independiente. Es `Conversation/UI Plane + Cockpit/HUD`; no es Kernel, Governor, Policy, ledger, Madre, Spawner ni segundo frontdoor.

Arquitectura activa única: `NOSTROMO_HYBRID`.

```text
Usuario
  -> LibreChat / NOSTROMO_CONVERSATION_CORE
       |- voz local reemplazable (~1-2 GB objetivo; modelo NO fijado)
       |- MANOJOS3 LiteLLM para razonamiento gratis cuando proceda
       '- MANOJOS3 MCP para acciones gobernadas
             -> Intent/Interflow
             -> Governor/Policy
             -> Kernel/driver
             -> readback
             -> Verifier/Receipt
```

VX13 es target futuro/paritario, con autoridad separada:
`Tentáculo Link -> Switch -> Madre -> Manifestator si procede -> Spawner/hija -> readback -> verificación Madre`.

ORÁCULO es advisory/provider; `authority=false`.

## 2. Readback del corte

- LibreChat remoto main: `ebbd17573d9f3f0e8599728a3540a3ce05ee72ca`.
- Candidato Operating Canon PR #1: `657e00dcf1c2111f722ca3a8a333fb9efda5abb5`; draft/open; runtime no verificado.
- Rama de este paquete: `handoff_current_bootstrps`, creada desde `657e00d...`.
- Upstream fijado: `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`, package observado `v0.8.8`, config `1.3.17`.
- MANOJOS3 remoto observado: `a7b2647bd7b18df474ac0a0d8f942a3469a11b7c`.
- VX13 remoto observado: `9ee9d63582832f6bad5a72b4bccf30846c85fabf`.
- ORÁCULO remoto observado: `0d9fa64068fb3e605e416339e3d331d29123fa8f`.
- Última prueba material histórica LibreChat VX: `26 PASS @ 94c632762f7afee7d9fa9d0f0c23c80d7494d2d2`.
- Tests del candidato actual: `NOT_RUN_FEATURE_BRANCH`.
- LibreChat LIVE: `NO_VERIFICADO`.
- Local host: no leído/modificado por este cierre.

Evidencia:
- `libre_chat_vx@657e00d:CURRENT.json:L1-L48`.
- `libre_chat_vx@657e00d:operating/TARGET_CANON.json:L1-L51`.
- `libre_chat_vx@657e00d:operating/GAPS_CURRENT.json:L1-L180`.
- `manojos3@a7b2647:src/manojos3/adapters/librechat.py:L7-L15`.
- `manojos3@a7b2647:src/manojos3/mcp_gateway.py:L94-L180`.

## 3. Fuentes y prioridad

`READBACK/LIVE > remote SOURCE exacto > Drive CURRENT > CURRENT.json > HANDOFF > blueprint/documentación > memoria/chat > inferencia`.

Drive canónico LibreChat: carpeta `1RtpHboZd9n6tiWLD2JzTBa452euPvsxB`.
Documentos CURRENT relevantes del 03/10:
- START HERE NOSTROMO HYBRID: `10sokDQr6eFQGSceTl0KYwfVinmF8ixTUz-XG0e8RyjQ`.
- NOSTROMO HYBRID: `1PqXk7nM8M_arbI472RU5n4T0rFQI1Yt-MH54VSapYc8`.
- M3 semantic bridge: `1gAbtU0XISM4GWuspp-6wWEZACAycWtZBqzMrEJUu6y0`.
- M3 entrypoints: `19WZ2DM3pXyIe9-mhyq_3oVXQ63QmvDBf7i720mGW1N4`.
- Operating canon/bootstrap: `18RUJkUGwF8FDD2Vi4Yq1oywh7OnF5y5GGXmUmRRKK8E`.
- VX13 Nostromo parity: `1i_sw3ZYXdu3-wFrmAxTw42PppT6wxMOK8G2jKI4onF8`.
- VX13 A-50 CURRENT consolidado: `1i-Dyj_KePeAeQl4d90ZjVQVsmE8Ca-2bGKPHM9vNZO0`.

El ZIP 2026-10-02 es coherente internamente (17 archivos; hashes verificados) pero queda por debajo del SOURCE/Drive del 03/10.

## 4. Autoridad y targets

`TargetScope={AUTO,BOTH,MANOJOS3,VX13}` es alcance de vista/conversación.
`ConcreteTargetId={MANOJOS3,VX13}` identifica un sistema material.

- `AUTO/BOTH`: lectura/proyección; mutación prohibida.
- MANOJOS3: admisión Governor, policy Policy, ejecución Kernel, verificación Verifier.
- VX13: policy/verificación Madre; ejecución Spawner/hija.
- LibreChat: `authority=false`.
- MCP, LLM, ToolApproval, Artifact, subagent, BackgroundTask, focus y HUD no conceden autoridad.

## 5. UX Nostromo y superficies

Una voz; no modos manuales. `windowRouter.ts` deriva foco; `NostromoCockpit.tsx` compone ventanas.

Superficies nativas a reutilizar:
- SIDE_PANEL: wrapper; prioridad Artifact > Subagent > Nostromo.
- ARTIFACTS: presentación; sin efecto directo.
- TOOL_APPROVAL: event bridge; aprobación UI != autorización de target.
- MCP_UI: renderer sandbox; TrustedSurfaceHost añade gates.
- TOOLS_DROPDOWN: proyección; permiso LibreChat AND capability/binding del target.
- FILES: wrapper; edit/delete/move siguen gobernados.
- SUBAGENTS: tareas cognitivas, nunca executor/hija.
- BACKGROUND_TASKS: proyección de tarea, nunca prueba de TargetRun.
- RESUMABLE_STREAMS: reanuda UI/conversación, nunca replay de efectos.

Vistas VX presentes en SOURCE: ArtifactDockView, InteractiveArtifactView, ModuleIndexView, NativeSurfaceStatusView, FilesPanelView, BrowserPanelView, AudioPanelView, BuildPanelView, BackgroundTasksView, TargetRunView, InterflowLensView, CapabilityLensView, DecisionInboxView, ContextInspectorView, MinimalTruthView, TentacleHud y NostromoHybridView.

## 6. Flujo de datos

1. Conversation: texto -> voz Nostromo -> reasoner opcional -> respuesta.
2. Objective/action: objetivo natural -> MCP M3 -> gobernanza -> readback/receipt.
3. Projection/HUD: status/capabilities/skills/run/auth/receipt/readback -> read models -> HUD.
4. Native LibreChat: eventos nativos -> surfaces.
5. Evidence: receipts/readbacks/artifacts -> ArtifactDock/evidence views.

Baseline de consumo: event-driven + lazy + ViewInterest + backpressure/coalescing + snapshot/resync. Polling periódico sólo fallback bounded.

## 7. Riesgo

- VERDE: R0/read/proyección; no efecto.
- AMARILLO: plan/dry-run/preparación; sin mutación material.
- ROJO: mutación/deploy/restart/delete/move/patch. Debe atravesar la autoridad del target y cerrar con readback + verifier + receipt.

Timeout después de posible efecto => `UNKNOWN_OUTCOME` => readback/reconcile antes de retry.

## 8. Estado por capas

| Área | SOURCE | LIVE/VERIFIED |
|---|---|---|
| Operating Canon/reconciler | IMPLEMENTED en candidato | NO_VERIFICADO |
| Nostromo Hybrid | IMPLEMENTED + Drive | modelo/deployment NO_VERIFICADO |
| Native surface bindings | IMPLEMENTED_SOURCE | overlay NO revalidado |
| Mobile/recovery | IMPLEMENTED_SOURCE | E2E NO_VERIFICADO |
| M3 semantic projection | IMPLEMENTED_SOURCE | binding PREPARED_UNCONFIGURED |
| M3 LibreChat adapter | INSTALLED fail-closed | UNCONFIGURED hasta binding real |
| M3 LiteLLM | contrato/source | aliases servidos requieren readback LIVE |
| VX13 parity | DOCUMENTED/CURRENT | binding UNCONFIGURED |
| ORÁCULO | DOCUMENTED/SOURCE advisory | integración LibreChat NO_VERIFICADA |

## 9. Secuencia de construcción

1. Revalidar identidad, branch, hashes y source drift.
2. `npm install && npm test` en este repo.
3. Preparar upstream limpio al pin exacto.
4. `npm run verify:upstream`.
5. Instalar overlay reversible con `npm run overlay:install`; confirmar `mutationEnabled:false`.
6. Ejecutar build/tests oficiales necesarios del upstream tras overlay.
7. Configurar red real para `MANOJOS3_MCP_URL` y `MANOJOS3_LLM_BASE_URL`; nunca copiar loopback a ciegas dentro de Docker.
8. Bootstrap M3 read-only: status/self/capabilities/skills; attach sólo si procede.
9. R0 gobernado con readback + receipt.
10. Verificar modelo local elegido mediante benchmark de deployment.
11. Verificar aliases LiteLLM exactos y `paid_fallback=false`.
12. Verificar conversación + HUD + native surfaces + mobile/resume.
13. Sólo después ejecutar el primer R2 mínimo por MANOJOS3.
14. VX13 se enlaza después con la misma shell y autoridad separada.
15. ORÁCULO permanece advisory; no ejecutar por consejo.

## 10. Rollback

`npm run overlay:uninstall` restaura archivos upstream conocidos y retira package/bridge/marker del overlay.
No force-push. No cambios a repos MANOJOS3/VX13/ORÁCULO desde este pack.
No secretos en repo, Drive, receipts o logs.

## 11. Bloqueos reales

- `LC-CURRENT-HEAD-TESTS`: STALE_PROOF / requiere ejecución local.
- `LC-M3-R0-BINDING`: bloqueado por tests/source + binding live.
- `LC-M3-LLM-LIVE-READBACK`: necesita aliases/canary live.
- `LC-UPSTREAM-OVERLAY-REVALIDATE`: NOT_TESTED en source actual.
- `LC-VX13-BINDING`: GATE_EXTERNAL.
- `LC-FIRST-R2`: depende R0 + overlay.
- `LC-LOW-POWER-MEASURE`: GATE_HUMAN/host.
- Candidato de modelo local: `DEPLOYMENT_BENCHMARK_REQUIRED`.
- Conector Hugging Face de esta sesión anunció herramientas pero devolvió Tool not found; no se falsifica benchmark.

## 12. Criterio de cierre

`SOURCE_COMPLETE` exige source publicado + remote readback + Drive continuity + proofs indexados.
`MATERIAL_COMPLETE` exige target concreto + binding fresco + ruta gobernada + readback + verificación + receipt.

No declarar LibreChat funcional completo hasta cerrar esos gates.

## 13. Capacidades oficiales LibreChat incorporadas al diseño — 2026-10-05

Estas capacidades se incorporan como superficies nativas o contratos de integración; no convierten LibreChat en autoridad material:

- **Tool Search / herramientas diferidas**: cargar herramientas bajo demanda para no inflar el contexto; MANOJOS3 sigue siendo el owner de acciones gobernadas.
- **Skills nativas**: reutilizar skills tipo `SKILL.md` y recursos auxiliares sin inventar un registry paralelo.
- **Control de agente en ejecución**: permitir interrumpir, corregir o aportar contexto mientras una tarea cognitiva está en marcha.
- **Conversation Trace + Context Usage + compactación**: exponer trazas y consumo de contexto y permitir compactar conversaciones largas sin perder continuidad operativa.
- **Adjuntos inteligentes / File Context / RAG**: elegir entre contexto completo, recuperación o herramienta de código según el archivo y la tarea.
- **MCP activables desde la UI + OAuth por usuario + sesiones request-scoped**: conectar herramientas sin hacerlas autoridad y reducir credenciales globales.
- **Agent Management API**: administrar agentes/skills/configuración desde automatización gobernada.
- **Tool intents visibles**: mostrar en lenguaje humano qué pretende hacer una herramienta antes/durante la ejecución.
- **Artifacts React/HTML/Mermaid**: usar superficies nativas para HUD, grafos, receipts y paneles sin crear un segundo frontend.
- **Background tools / Scheduled Chats**: permitidos como scheduling/presentación; cualquier efecto material debe reenviarse al target gobernado.
- **Programmatic Tool Calling / workspaces de código**: sólo detrás de los gates de MANOJOS3; nunca como segundo HOST_CONTROL ni executor paralelo.
- **Subagentes**: cognición aislada; nunca equivalen a Kernel workers, Spawner/hijas ni receipts materiales.

Fuentes oficiales revisadas: LibreChat Compatibility Matrix, Custom Endpoints, Model Specs, Agents/Skills/MCP/Composer y changelog 0.8.8-rc3.

## 14. NOSTROMO Provider Mesh — no dependencia rígida de IA local

Se mantiene una sola arquitectura: `NOSTROMO_HYBRID`. Se añade una capa de selección de proveedor, no un sistema paralelo.

Principios:
- La voz/modelo local pasa a ser **opcional y reemplazable**, útil para baja latencia, privacidad o degradado, pero no requisito para conversar.
- El razonamiento usa **aliases semánticos** (`general`, `reasoning`, `coding`, `fast`, `long-context`) y el proveedor real se resuelve por disponibilidad LIVE.
- MANOJOS3 LiteLLM permanece como plano preferente de routing de razonamiento porque mantiene una política única y permite cambiar de proveedor sin cambiar la UX.
- LibreChat puede exponer **Custom Endpoints** OpenAI-compatible o Anthropic-compatible para conversación directa cuando interese; esto no concede autoridad sobre acciones.
- Los Custom Endpoints permiten conectar servicios remotos o locales (por ejemplo OpenRouter, Groq, Mistral, Ollama, vLLM, DeepSeek u otros compatibles); cada binding debe verificarse LIVE antes de declararlo usable.
- **Model Specs** presenta nombres estables al usuario y oculta la rotación de proveedores/modelos.
- Las claves pueden ser por entorno o `user_provided`; no se guardan secretos en repo/Drive.
- `paid_fallback_allowed=false` se conserva: no habrá salto automático a una API de pago.
- La política recomendada es **REMOTE_FREE_CAPABLE + LOCAL_OPTIONAL**: remoto gratuito/coste cero si está disponible, local si conviene o como degradado, sin dependencia dura de ninguno.
- Si cambia un proveedor, la conversación puede continuar; la ruta de acciones sigue siendo MANOJOS3 MCP o VX13 y no depende del modelo elegido.
- Ningún endpoint/modelo se marca PASS por documentación: disponibilidad, límites, tool calling, visión y latencia requieren readback/benchmark.

### Selección por clase de trabajo

```text
chat/voz/personalidad -> local opcional o proveedor remoto ligero
razonamiento general -> alias general
razonamiento difícil -> alias reasoning
código -> alias coding
contexto grande -> alias long-context
respuesta rápida -> alias fast
acciones materiales -> SIEMPRE target gobernado (M3/VX13), nunca el LLM
```

### Gates añadidos

- `LC-PROVIDER-MESH-CONFIG`: Model Specs + endpoints/aliases definidos sin secretos.
- `LC-PROVIDER-MESH-LIVE`: al menos dos rutas de razonamiento verificadas, de las cuales una puede ser no local.
- `LC-PROVIDER-FAILOVER`: caída de un proveedor no cambia autoridad ni duplica una acción.
- `LC-MODEL-CAPABILITY-READBACK`: tools/vision/context se comprueban por modelo, no por nombre del endpoint.
- `LC-NO-PAID-AUTO-FALLBACK`: prueba negativa de que no existe fallback automático de pago.

