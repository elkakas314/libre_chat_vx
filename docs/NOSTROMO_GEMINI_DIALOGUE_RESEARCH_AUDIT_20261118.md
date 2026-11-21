# NOSTROMO — AUDITORÍA DEL DEEP RESEARCH DE GEMINI: DIÁLOGO, TAREAS Y CABINA
**Fecha:** 2026-11-18. **Procedencia:** informe aportado por el usuario y Google Doc verificado (NO reproducir contenido privado/URL en GitHub). **Naturaleza:** EXTERNAL/RESEARCH, NO código instalado ni pruebas HOST.
**Base:** `elkakas314/libre_chat_vx`, rama `integration/nostromo-canon-20261118-r1`; PR #54 DRAFT; LibreChat fijado `f10b1d91f1eee3a2c82d5247bf620351486b7c1b`, SDK agents `v4.0.1`.

## Dictamen
**CONSERVAR LA IDEA DE FASES, RECHAZAR AMBOS DIFFS APORTADOS.** Las ocho fases describen la intención, no una máquina operativa implementada; no hay evidencia de tests, wiring del backend nativo, aprobación firmada ni canario Lenovo. El Doc contiene el mismo material pegado en el chat y no acredita las referencias técnicas por ruta/commit.

| Hallazgo Gemini | Evidencia concreta | Decisión |
| --- | --- | --- |
| DIALOGUE → RESEARCH → PROPOSAL → PLANNING → AWAITING_AGREEMENT → EXECUTION → DECISION_REQUIRED → VERIFICATION | Especificación útil. Pero las decisiones **no** son un paso lineal obligatorio posterior a ejecutar; son una pausa/evento dentro de ejecución. La investigación puede intercalarse con la conversación. | ADAPTAR a estados y eventos nativos, sin duplicar scheduler; prueba de idempotencia/reanudación. |
| `UiIntent: "PROPOSAL_VIEW"` | No figura como contrato demostrado en el código auditado; `src/presentation/presentationPlanner.ts` tiene `CHAT, RESOURCE_TREE, TIMELINE, COMPARISON_TABLE, MERMAID_DIAGRAM, STATUS_SUMMARY, EVIDENCE_VIEW, INTERACTIVE_ARTIFACT`. | Proyectar propuesta en nativo/Artifact o registrar gap exacto; no crear enum ficticio. |
| Dibujar `ActiveFlow` en PLANNING | `src/cockpit/activeFlow.ts` muestra sólo aristas con `executionEvidenceRef`. `src/cockpit/planGraph.ts` separa `PLAN_CREATED, EXECUTION_SCHEDULED, MATERIAL_VERIFIED`. | PlanGraph en planning, ActiveFlow sólo para evidencia de ejecución observada. |
| `client/src/components/Chat/Input/Nav.tsx` | Ruta no encontrada en repo ni en upstream fijado bajo path exacto. | NO_EDITAR, localizar componente nativo real antes de parche. |
| `client/src/components/Nav/SettingsTabs/NostromoStatusRail.tsx` | Ruta no encontrada. `src/ui/StatusRailView.tsx` SOURCE NOSTROMO sí existe. | NO_EDITAR ruta inventada. |
| `client/src/components/Chat/Menus/VXCockpitBridge.tsx` | Ruta no encontrada. Existente: `overlay/upstream/VXCockpitBridge.tsx`, bajo panel nativo, no otro chat. | Reutilizar bridge existente y overlay reversible. |
| `client/src/components/Artifacts/ArtifactDock.tsx` | Ruta exacta no encontrada. `src/ui/ArtifactDockView.tsx` y `src/cockpit/artifactDock.ts` sí existen. | Localizar viewers nativos upstream antes de extender; comprobar callback real. |
| `packages/agents/src/tools/deferralFilter.ts` | No existe en repo ni como ruta confirmada de SDK; la función sugerida reemplaza parámetros con `properties: {}`, limita arbitrariamente las directas a tres y cita `nostromo_catalogo` inexistente. | **RECHAZAR** por degradar invocación/discovery y no demostrar ahorro real; parche exacto ya existente `deployment/librechat-agents/deferred-instance-filter.mjs` requiere R0 sobre paquete instalado. |
| `onGrantAgreement(planId || 'default-hash')` | Riesgo grave: una UI con planId ausente puede aparentar consentimiento; además planId no equivale a hash. No consulta sesión autenticada, revisión vigente ni autoridad. | **RECHAZAR**. No hay fallback, click nunca concede grant. Backend debe derivar consentimiento autenticado vinculado a plan/revisión/destino. |
| `React.lazy(()=>import(...NostromoStatusRail))` | No existe path, no demuestra export default, rutas reales difieren; suspender en capa equivocada rompe integración. | Primero localizar módulo, export real, rol Suspense, presupuesto inicial y tests visuales. |
| “desmontar libera COMPLETAMENTE la RAM inmediatamente” | React desmonta nodos/efectos limpiados; GC JS, referencias/cachés y memoria de bibliotecas no se liberan necesariamente al instante. | Medir memoria real antes/después; no prometer liberación inmediata ni desactivar capacidades. |
| `git fetch && checkout && pull` como protocolo host | Puede pisar/sustituir checkout con dirty/untracked y mezclar upstream vs overlay. | R0 de worktrees, backup conservador, HEAD/CAS, FF-only donde aplique, nunca reset/force. |
| `npm run build:data-provider` | No existe como script del `package.json` NOSTROMO observado. Podría pertenecer a otro workspace; verificar el `package.json` del checkout de destino antes de usarlo. | No dar PASS por comando supuesto. |
| `npm run nostromo:check` + `gh pr status` + `Mongo unfinished/error:false` | El comando NOSTROMO es un preflight read-only, `gh pr status` no certifica HOST, flags Mongo aislados no prueban respuesta del agente persistida y visible tras reload. | Test con conversación y llamada MCP reales, receipt, estado fin, readback sanitizado y reload. |

## Flujo corregido, integrado con arquitectura nativa
```
CONVERSATION (LLM, memoria breve, sin agente ejecutor)
  <-> RESEARCH_R0 (web/archivos/lecturas permitidas, sin mutación)
  -> PROPOSAL (alternativas, riesgos, coste, no objetivos)
  -> PLAN_PREVIEW (PlanGraph, target concreto, acceptance, rollback, planVersion+hash)
  -> AWAITING_AGREEMENT (usuario acepta, modifica o posterga)
  -> AGREED (host autenticado confirma plan vigente y registra acuerdo/ref)
  -> GOVERNED_HANDOFF (tarea de mecanismo EXISTENTE, dedupe/idempotencia)
  -> RUNNING (R0 seguro en alcance; R2→DECISION_REQUIRED→RUNNING)
  -> VERIFY (receipts/readback, estado de ejecución real)
  -> COMPLETED | FAILED | UNKNOWN_OUTCOME → CONVERSATION
```
La propuesta se puede revisar cuantas veces haga falta; no es obligatorio pasar linealmente por cada fase. Las decisiones se abren sólo por límites materiales/humanos reales. Modificar alcance invalida hash/consentimiento anterior. `UNKNOWN_OUTCOME` prohíbe repetir efectos no idempotentes sin readback.

## Qué está hecho y qué falta
- SOURCE: `src/intent/nostromoDecisionBridge.ts` corregido en commit `7dd61bcbfd3e4f6ca7e69316e060f375b0626b10` para exigir un `agreedTaskHandoff` antes de proyectar `requiresMaterialExecution`. **Se comprueba forma, NO procedencia autenticada**. Los tests TS asociados cubren ausencia e inputs inválidos en la lógica pura. SOURCE `src/research/researchPolicy.ts` distingue WEB_SEARCH/FILE_SEARCH/TARGET_READ; no atribuye ejecución LIVE de Google Search.
- SOURCE: `overlay/upstream/VXCockpitBridge.tsx` muestra datos de conversación cargada y snapshots `nostromoHubSourceSnapshot()`/`projectTentaculoHud([])`. Sin binding LIVE del estado de tareas, acuerdo, permisos ni visor avanzado completo. `src/ui/NostromoCockpit.tsx` no demostrado montado en el host.
- FALTA: authentic plan agreement + planRevision/hash readback desde la sesión LibreChat, persistencia durable, task enqueue idempotente, checkpointer/resume, agent/tool execution sólo tras acuerdo, ActionLifecycle/Mongo/DecisionInbox, E2E host y móvil; no crear capa paralela. FALTA P0 de contexto de @librechat/agents en Lenovo.
- NO APROBADO: dos pseudoparches de Gemini; no importar ni aplicar su `default-hash`, tool params vacíos ni rutas inexistentes.

## Canario end-to-end definitivo
1. «Quiero mejorar la cabina y ahorrar recursos»: NOSTROMO conversa, pregunta si falta dato clave, investiga web R0 cuando ayude y propone opciones sin job material. No seleccionar ni bind tools terminal/ejecutor.
2. «Dale» después de plan V1 registrado: una aceptación desde canal autenticado, hash de plan real, **una** tarea gobernada, sin ToolApproval material implícito.
3. «Cambia opción 1 por opción 2»: revoca acuerdo de V1; ningún executor acepta handoff desfasado.
4. R2 denegada: decisión en Cabina del dueño real; ninguna acción peligrosa; R0 independiente sigue disponible si seguro.
5. Archivo/artefacto real: PlanGraph plan vs ActiveFlow con evidencia; abrir/compare/export sólo con ACL y callbacks verificables. Móvil mantiene sesión y eventos sin replay.
6. Verificar contexto 6144 en saludo, plan y ejecución, TTFT, VRAM/CPU/swap/heap, latencia del visor abierto/cerrado. Bajo consumo sin perder funciones; adjuntar receipts sanitizados, commit y CI exact HEAD.

## Work
Aplicar las instrucciones ampliadas en `docs/WORK_NOSTROMO_GEMINI_P0_EXECUTION_20261118.md` y `docs/NOSTROMO_CONVERSATION_TO_GOVERNED_TASK_20261118.md`. GH CLI/PAT fine-grained ya autorizado sólo si disponible, no exponer. Publicar sólo a integración fast-forward, main y PR #54 protegidos hasta VERIFIED. No esperar otra respuesta de Gemini para comenzar pruebas independientes.
