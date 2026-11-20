# NOSTROMO — CONVERSACIÓN → ENTENDIMIENTO → ACUERDO → TAREA GOBERNADA
**Contrato 2026-11-18. SOURCE diseñado y puente protegido; wiring en LibreChat nativo / HOST E2E PENDIENTE.**
**Prioridad del usuario:** conversación natural primero, sin interacción con agente EJECUTOR hasta comprender lo que desea. El diálogo puede proponer mejoras, comparar alternativas y realizar investigación web pública R0 cuando sea pertinente. Una vez definido y aceptado el objetivo se entrega a tarea gobernada. Sólo decisiones de autoridad genuinas interrumpen la ejecución.

## Fases y autoridad
```
CHAT (sólo conversación, contexto, memoria breve, preguntas pertinentes)
  → DISCOVER (Web Search/Files/R0 seguros, fuentes y alternativas, SIN mutación)
  → GOAL_DRAFT (objetivo/alcance/target/restricciones/criterios de aceptación)
  → PLAN_PREVIEW (pasos, alternativas, riesgos, coste, verificación y rollback)
  → GOAL_AGREED (usuario acuerda plan versionado en sesión autenticada)
  → GOVERNED_TASK (handoff a cola/agente ejecutor existente, no nueva DB)
  → R0_AUTO (trabajo seguro dentro del alcance) / R2_DECISION (autoridad real)
  → EXECUTION (idempotencia, receipts)
  → READBACK → VERIFIED | FAILED | UNKNOWN_OUTCOME
  → CONVERSATION (resultado legible, continuidad y propuesta de mejora)
```
No iniciar MCP terminal/agent ejecutor/jobs ni mutar target en CHAT/DISCOVER/PLAN. **La conversación usa LLM** (que puede residir en agente nativo LibreChat en modo conversacional) y puede acceder a Web Search informativo u otros R0 autorizados; «sin agente» no implica apagar la inteligencia. No cargar tools de ejecución en la ventana 6144 del modelo local antes del handoff.

## Reglas de entendimiento
- Preguntar sólo lo que impide tomar una decisión válida; contextualizar con historial/foco/memorias, no hacer interrogatorios ni repetir preguntas. Ante una tarea incompleta, sugerir opciones razonadas y, cuando ayude, contrastar fuentes web públicas y opciones cero coste.
- Mostrar propuesta de objetivo con éxito mensurable, recursos/permiso, destino, restricciones y criterios de no-regresión. No enviar «haz X» al ejecutor por detección de verbo y target.
- Aceptación del usuario «dale / hazlo» es válida si se refiere inequívocamente al plan VIGENTE; host autenticado registra `agreementRef` + `sessionRef` + `planHash`. Si cambia sustancialmente objetivo, restricciones o permisos, invalidar planHash y actualizar acuerdo; no aprobar a ciegas.
- Acuerdo sobre objetivo no es autorización material. A partir del handoff, el target puede realizar R0 seguro; para R2/irreversible/pago/secretos/seguridad requiere gate nativo/owner, con `DecisionInbox` y feedback concreto. No se pide permiso por cada lectura que ya esté permitida.
- Una tarea no es PASS por botón/HTTP 200/tool call/commit. Se cierra por efecto material + readback + receipt + verify. `UNKNOWN_OUTCOME` no se reintenta automáticamente.
- Preservar conversación y tarea persistentes (Mongo/Agent Builder/checkpointer/runtime jobs nativos; no segunda orquestación), identidad de usuario, permisos, no duplicar envíos en reload/móvil.
- Tentáculo HUD/visor avanzado aparecen cuando aportan valor: alternativas, plan editable, decisión pendiente, grafo, progreso, evidencias; widgets sin autoridad. Bajo consumo por demanda, sin sacrificar diseño, gráficos o funciones.

## Contrato del handoff
Schema mínimo de diseño (no asumir endpoint o tabla ya existente):
`objectiveRef`, `conversationRef`, `agreementRef` (servidor autenticado), `planHash`, `planVersion`, `targetId`, `scope`, `constraints`, `acceptanceCriteria`, `steps`, `risk`, `requiredCapabilities`, `readbackPlan`, `rollbackPlan`, `idempotencyKey`, `status`. Nunca incluir tokens, prompts privados ni resultados sensibles en receipts públicos.
El modelo genera el borrador; el host verifica registro del acuerdo; el gobernante del destino conserva autoridad para ejecutar. Si el host no puede verificar agreement o plan, el handoff es NO_READY sin bloquear investigación/conversación.

## Mapeo al SOURCE existente
`src/intent/intentInterpreter.ts` identifica intención; `src/intent/nostromoDecisionBridge.ts` proyecta inferencia y sólo después handoff; `src/llm/nostromoHybrid.ts` distingue `REMOTE_INFERENCE` vs `TARGET_OBJECTIVE`; `src/research/researchPolicy.ts` da camino de investigación; `src/cockpit/{controlDraft,controlDeck,decisionInbox,authorizationCard,actionLifecycle,targetRun}.ts` proyectan prevención/decisiones/estado, SIN grants; `src/ui` y `overlay/upstream/VXCockpitBridge.tsx` UI nativa. No crear nuevo kernel, scheduler, MCP, LLM-router ni frontend.
**Fix SOURCE:** antes `wantsExternalChange+targetHint` hacía `requiresMaterialExecution:true` sin acuerdo. Ahora el puente exige `agreedTaskHandoff` con source `HOST_AUTHENTICATED_USER_AGREEMENT`, target coincidente, objectiveRef/sessionRef no vacíos y planHash SHA256; si no: `requiresGoalAgreement:true`, `requiresMaterialExecution:false`, `targetActionRequested:false`. Esto **sólo comprueba estructura**: no autentica procedencia; NO debe construirse con salida del modelo ni tool no confiable. Work tiene que cablear readback host realmente y mantener gate material independiente. Sus tests son SOURCE, no LIVE.

## Canarios E2E para Work
1. «Quiero mejorar el módulo de música sin que gaste memoria»: pregunta de aclaración sólo si necesaria, sugiere opciones y puede investigar R0 fuentes; **cero tools materiales, cero jobs, no ejecutor despertado**.
2. Tras un PLAN V1 claro «dale»: el HOST autentica aceptación, registra hash/versión, crea **una** tarea gobernada con destino, no doble envío.
3. Cambio de objetivo después del acuerdo → plan V2 invalida V1; no execute con hash obsoleto. «Dale» sin referencia a plan vigente no otorga permiso.
4. Investigación R0 no exige ToolApproval R2; acción R2 sin grant sale en DecisionInbox con autoridad real, rechazo sin side effect.
5. Herramienta/tarea final produce receipt+readback en propio flujo, VERIFICATION; reabrir conversación/móvil recupera el mismo estado sin replay.
6. «Hola» y conversación con cabina cerrada/abierta no sufren context overflow, polling ni caída de rendimiento. Medir CPU/RAM/swap, TTFT, schemas bound y UX sin reducir «magia».
**Estado de aceptación:** SOURCE_PATCH / HOST_NOT_VERIFIED; PR #54 DRAFT hasta E2E.

## Corrección del informe Gemini 18/11/2026 (aprobada como diseño, no como ejecución)
El estudio sugiere ocho estados, pero RESEARCH puede ser subfase iterativa y `DECISION_REQUIRED` es pausa durante ejecución. `PROPOSAL_VIEW` no es enum SOURCE demostrado: `presentationPlanner` ya dispone de `COMPARISON_TABLE`, `INTERACTIVE_ARTIFACT`, `MERMAID_DIAGRAM`. `PlanGraph` muestra futuro; `ActiveFlow` sólo aristas con evidencia real. No crear `NostromoStatusRail` ni otro `VXCockpitBridge` bajo rutas inexistentes. Prohibido `onGrantAgreement(planId || 'default-hash')` y filtros de herramienta con `parameters:{}`. Ver auditoría completa `docs/NOSTROMO_GEMINI_DIALOGUE_RESEARCH_AUDIT_20261118.md`.

## Actualización contractual 2026-11-20 — separación conversación / ejecución

Ver [canon de ejecución contractual](NOSTROMO_CONTRACT_FIRST_EXECUTION_CANON_20261120.md) y esquema `contracts/nostromo-objective-handoff.schema.json`. **SOURCE/DOCUMENTED; no instalado, no sustituye el contrato 18/11.** Resolver obligatoriamente capacidades, usuario/acuerdo desde el host y autoridad del target; Qwen3 no es paso obligatorio para operaciones deterministas. Se preservan el bridge, router, MCP, jobs, Mongo, UI y Tool Search existentes. No crear otra base ni motor.
