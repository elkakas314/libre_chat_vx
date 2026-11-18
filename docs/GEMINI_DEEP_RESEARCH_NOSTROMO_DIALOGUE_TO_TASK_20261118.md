# GEMINI DEEP RESEARCH — AMPLIAR NOSTROMO: DIÁLOGO Y TAREAS GOBERNADAS, SIN PERDER MAGIA
**18-11-2026. Encargo ya autorizado de investigación:** Google Search + Google Drive + GitHub; entregar informe privado, código y tests. No iniciar con «Hola, puedo programar» ni volver a preguntar si hacer el parche o el Google Doc: ya se han solicitado. NO ejecutar cambios materiales en el Lenovo desde la investigación.

## Objetivo de experiencia
El usuario quiere **hablar primero con NOSTROMO sin activar el agente EJECUTOR**, hasta llegar a entendimiento: conversación natural, preguntas cuando falta algo esencial, sugerencias que mejoren el resultado, investigación pública de mejores opciones cuando aporte valor y exposición comprensible de diferencias. Al alcanzar objetivo consensuado, convertirlo en una **tarea gobernada**, ejecutada autónomamente dentro de límites y con decisiones de autorización sólo cuando realmente son necesarias; después receipts/readback/verify y vuelta al chat.
No confundir «no ejecutar agente» con «no usar LLM»: la conversación vive en LibreChat y las herramientas R0 de investigación y consulta seguras pueden usarse antes del acuerdo. No usar MCP R2, terminal, jobs ni mutate antes. Los prompts no otorgan permiso.
No recortar Tentáculo HUD, cabina, visor avanzado, gráficos, voz, móvil, artefactos, tareas ni animaciones para ahorrar recursos: lazy en vistas ocultas, experiencia rica al abrir.

## Fuentes obligatorias
Repo https://github.com/elkakas314/libre_chat_vx rama `integration/nostromo-canon-20261118-r1`, **consultar HEAD actual**. PR #54 DRAFT; issue #37.
LibreChat upstream fijado `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b` y `LibreChat-AI/agents@v4.0.1`; no inventar APIs de versiones posteriores.
Lee primero:
- `docs/NOSTROMO_CONVERSATION_TO_GOVERNED_TASK_20261118.md`
- `docs/WORK_NOSTROMO_GEMINI_P0_EXECUTION_20261118.md`
- `docs/GEMINI_DEEP_RESEARCH_NOSTROMO_VISOR_MAGIC_LOW_CONSUMPTION_20261118.md`
- `docs/NOSTROMO_COCKPIT_ADVANCED_VIEWER_WORK_GATE_20261118.md`
- `docs/NOSTROMO_FEATURE_MATRIX_CURRENT.md`
- `docs/NOSTROMO_GEMINI_P0_SOURCE_AUDIT_20261118.md`.
Inspecciona código concreto `src/intent/{intentInterpreter,nostromoDecisionBridge}.ts`, `src/llm/nostromoHybrid.ts`, `src/research/researchPolicy.ts`, `src/presentation/presentationPlanner.ts`, `src/cockpit/{controlDraft,controlDeck,decisionInbox,authorizationCard,actionLifecycle,targetRun,currentFocus,windowRouter}.ts`, `src/ui/{NostromoCockpit,DecisionInboxView,ControlDeckView,PlanGraphView,ActiveFlowView}.tsx`, `overlay/upstream/VXCockpitBridge.tsx`, `deployment/nostromo-mcp`, `tests/nostromo-decision-bridge.test.ts` y tests de visualización.
Drive privado autenticado:
Maestro https://docs.google.com/document/d/1OwadKf4vBKJyRx5Pe3QB2HgjqJlSe2xb52TT7nK3Scc/edit
CURRENT https://docs.google.com/document/d/1cX4ld93Db6dPFv-F5iAiyXu2QhR5U8vuWZJPMSCQhE0/edit
Handoff https://docs.google.com/document/d/1lrhx64J3hW7iW_qeGOw_fJw67rp_M-2EY_65Go2tMPY/edit
Delta https://docs.google.com/document/d/1oOiFTIrMD5Lnd05frGZ3HuZf3LgZHBEnAdhkoZvOwFA/edit
Contrasta con documentación oficial de Agent Builder, ToolApproval, deferred tools/ToolSearch, Skills, MCP, context pruning, memory, Files/RAG, Artifacts, background tasks, resumable streams, PWA. No copies Drive privado al repo público.

## Audita y corrige TU respuesta anterior
La respuesta anterior preguntó si hacer el informe y parche cuando ya estaban encargados: sustituir esa inercia por investigación efectiva.
El ejemplo `lazy(()=>import('./cockpit/TentaculoCockpit'))` y `lazy(()=>import('./viewer/AdvancedViewer'))` usa rutas no verificadas; presupone default exports y un chat React ficticio, no integración nativa. React desmontado NO implica liberar RAM «inmediatamente» (GC es no determinista); medir retención de efectos/suscripciones/bundle y usar componentes reales y código compatible. No crear otro chat/visor.
En SOURCE se detectó que el bridge de intención podía marcar material execution sólo por detectar target; fix reciente exige acuerdo nativo con `agreedTaskHandoff`, pero esa estructura NO concede autoridad ni está demostrada consumida por backend. Investiga cableado mínimo REAL sin segundo orquestador.

## Resuelve estas cuestiones de ingeniería
1. ¿Cómo organizar fases CHAT → INVESTIGATE R0 → GOAL_DRAFT → PLAN_PREVIEW → AGREED → HANDOFF → GOVERNED_TASK → VERIFY, con eventos/refs/estados persistentes nativos, sin doble DB/Worker?
2. ¿Cómo conversa el LLM con mínima huella de tools sin despertar el ejecutor ni perder investigación web? Comparar TTFT de conversación vs herramienta 6144 Qwen4B, usar deferred tools y memoria/compactación por uso.
3. ¿Cómo deducir acuerdo inequívoco de «dale» cuando ya hay plan, sin micro-aprobaciones ni autorizar a través de LLM? Host autenticado, planHash, validity, target, scope, idempotencia y revalidación.
4. ¿Cómo se hacen sugerencias relevantes, comparación de opciones y búsquedas con fuentes verificables sin acciones materiales? No preguntar por decisiones menores.
5. ¿Cómo convertir objetivo en tarea bajo ToolApproval/grant real del destino y reanudar ejecución tras decisiones, sin prometer retroceso de una mutación irreversible?
6. ¿Cómo mostrar progreso, plan vs ejecutado, decisiones, versiones, receipts, gráficos y documentos en cabina/visor sin duplicar UI, sin dar autoridad a botones y sin sobrecargar el Lenovo?
7. ¿Qué hooks exactos del upstream pinned permiten persistencia/resume/agent tooling y cuáles no existen? Evitar falsos «CONFIGURED/LIVE».
8. Prueba adversarial: modelo inventa acuerdo/planHash; usuario cambia plan; R2 sin grant; duplicado por reload; tools erróneos; UNKNOWN_OUTCOME; falta de red o cuotas; conversación sin esquema MCP; acciones R0 no bloqueadas por permisos materiales.
9. Un E2E de usuario ejemplo: «Mejora la cabina, busca mejores opciones y ahorra consumo» → diálogo → web compare → plan → «dale» → gh CLI fine-grained token ya autorizado → commit/CI/readback sin revelar secretos → recepción de resultado. Investigación no ejecuta dicho write.
10. Qué debe incorporarse a `docs/WORK_NOSTROMO_GEMINI_P0_EXECUTION_20261118.md` para Work y a tests de código con cambios estrechos.

## Entregables sin pedir más confirmación
D1: Google Doc privado «NOSTROMO — DIÁLOGO A TAREA GOBERNADA — VISOR Y BAJO CONSUMO» con HEAD/source/Drive/web oficiales.
D2: máquina de estados y contrato de handoff con propósito, planHash, revocación, autorización, persistencia y recibos.
D3: matriz de módulos y estados `SOURCE/INSTALLED/CONFIGURED/LIVE/VERIFIED`, diagnóstico de redundancias, costos/CPU/VRAM/latencia.
D4: 2–4 diffs completos reales sobre rutas existentes con pruebas positivas/negativas y rollback; si no se ejecutaron, NOT_RUN. Priorizar integración del bridge existente en backend, no otra capa.
D5: plan de implementación HOST para Work del Lenovo (gh CLI, token fine-grained ya autorizado sin exposición, backup, pruebas, CANARIO, receipt issue #37, fast-forward sin force).
D6: no regresión visual/funcional ni pérdida de «magia»; lazy import sólo si existe ruta/export real y hay ventaja medida.
**Empieza ahora la investigación sin preguntas introductorias ni sustitutos genéricos. Si Drive falla, marca UNREADABLE y continúa.**
