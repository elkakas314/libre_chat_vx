# GEMINI DEEP RESEARCH — NOSTROMO: CABINA, VISOR AVANZADO Y «MAGIA» A BAJO CONSUMO
**18-11-2026. Encargo para Gemini con Google Drive + Google Search/Web; informe privado con código, análisis y evidencia.**
**Objetivo:** mejorar el producto completo sin degradarlo para ahorrar recursos. El bajo consumo es una restricción de arquitectura, NO una autorización para desactivar funciones, empeorar la UX, simplificar vistas permanentes ni esconder complejidad real.

## FUENTES Y BASE
Repositorio público: https://github.com/elkakas314/libre_chat_vx
Rama SOURCE: integration/nostromo-canon-20261118-r1; consulta HEAD real al empezar, no supongas SHAs antiguos. Pull request #54 DRAFT, receipts issue #37.
UPSTREAM exacto: LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b; SDK de agentes @librechat/agents@v4.0.1 (LibreChat-AI/agents).
Lee estos documentos GitHub antes de sugerir nada:
- docs/NOSTROMO_COCKPIT_ADVANCED_VIEWER_WORK_GATE_20261118.md
- docs/NOSTROMO_FEATURE_MATRIX_CURRENT.md
- docs/NOSTROMO_E2_M4_VISUAL_SOURCE_20261111.md
- docs/GITHUB_FIRST_VISUAL_VALIDATION.md
- docs/NOSTROMO_GEMINI_P0_SOURCE_AUDIT_20261118.md
- docs/WORK_NOSTROMO_GEMINI_P0_EXECUTION_20261118.md
Inspecciona archivos reales, no extrapoles solo a partir de los docs: overlay/upstream/VXCockpitBridge.tsx, VXCockpit.css, src/ui/NostromoCockpit.tsx, ContextInspectorView.tsx, ArtifactDockView.tsx, InteractiveArtifactView.tsx, ResourceTreeView.tsx, PlanGraphView.tsx, ActiveFlowView.tsx, TentaculoHub.tsx, TentaculoHud.tsx, BackgroundTasksView.tsx, src/cockpit/windowRouter.ts, layoutContract.ts, rendererManifest.ts, projectionBackpressure.ts, currentFocus.ts, src/hud/nostromoHub.ts, tentaculoHud.ts; tests/visual y scripts/reconcile-native-visual.mjs.
Google Drive PRIVADO, consultando la conexión autorizada:
1. Maestro: https://docs.google.com/document/d/1OwadKf4vBKJyRx5Pe3QB2HgjqJlSe2xb52TT7nK3Scc/edit
2. CURRENT: https://docs.google.com/document/d/1cX4ld93Db6dPFv-F5iAiyXu2QhR5U8vuWZJPMSCQhE0/edit
3. Handoff: https://docs.google.com/document/d/1lrhx64J3hW7iW_qeGOw_fJw67rp_M-2EY_65Go2tMPY/edit
4. Delta GitHub/Drive/HOST: https://docs.google.com/document/d/1oOiFTIrMD5Lnd05frGZ3HuZf3LgZHBEnAdhkoZvOwFA/edit
Elige fuentes Google Search y Drive en Deep Research; revisa el plan de investigación antes de ejecutarlo. Si un enlace no funciona, márquese UNREADABLE, sin inventar contenido. Nunca publicar contenido privado de Drive en GitHub.

## LA VISIÓN — CONSERVAR LA MAGIA
NOSTROMO no es un chatbot plano. Es una experiencia fluida dentro de LibreChat: diálogo natural + un agente autónomo, visor contextual inteligente, Tentáculo HUD/Hub, gráficos de flujos reales, cabina de estado, árbol de recursos, evidencias/receipts, planes, tareas, gestor, artefactos interactivos, Files/RAG, investigación web, navegador, audio/SHUB, conexiones con sistemas externos, móvil/PWA/voz y animaciones útiles.
La cabina debe aparecer cuando aporta valor y desaparecer sin penalizar la conversación. El visor avanzado debe representar contenido real (PDF, imágenes, audio, código, documentos, tablas, gráficos y Artifacts) apoyándose en los viewers **nativos** de la versión LibreChat fijada si los tiene. No inventar otro navegador, frontend ni viewer duplicado. No convertir mockups, tarjetas SOURCE o pantallas de ejemplo en estados LIVE.

## VERDAD MATERIAL DESCUBIERTA
El bridge visual actual overlay/upstream/VXCockpitBridge.tsx monta interfaz contextual en un panel nativo y muestra actividad de conversación; el TentaculoHub usa nostromoHubSourceSnapshot() de inventario SOURCE, y el TentaculoHud usa projectTentaculoHud([]) sin feed real. NostromoCockpit.tsx contiene la composición extendida pero su montaje y autenticación LIVE no están verificados. ContextInspectorView sólo enseña foco/referencias: no es visor PDF ni inspector de presupuesto de tokens. ArtifactDockView declara OPEN/PIN/COMPARE/TIMELINE/EXPORT pero faltan callbacks reales/ACL para acreditar efecto. Workspace GitHub CI fixture no prueba frontend host LIVE.
Por tanto prioriza wiring nativo real + tests, no nuevo diseño cosmético.

## INVESTIGACIÓN A — CAPACIDADES NATIVAS Y EXTENSIONES
Consulta la documentación técnica **oficial** vigente de LibreChat para Agents, Artifacts, Files/RAG, side panel, MCP, tool approval, Skills, subagents, resumable streams, audio, PWA y visores. Para cada feature contrasta con el commit upstream fijado: DOCUMENTED_IN_LATEST no significa INSTALLED_IN_PINNED. Explora las superficies existentes y los límites para insertar Vista Contextual y presentar datos sin cambiar la ruta del chat ni romper autenticación/ACL.
Distingue overlays, plugins experimentales, nativos, React SOURCE, renderizadores realmente montados y composiciones planificadas.

## INVESTIGACIÓN B — BAJO CONSUMO SIN PÉRDIDA DE MAGIA
Prioriza Lenovo Z50-70, CPU limitada, RAM, swap y GPU antigua. El modelo Qwen 4B de Ollama puede estar cargado bajo demanda, no es requisito que siempre esté en VRAM.
Diseña adaptaciones **reversibles** y automáticas de calidad: lazy-load por panel y tipo de archivo, suspense o skeleton ligero; retención de estado/foco; virtualización de árboles/listas; carga progresiva de previews; paginación de evidencias; throttling de actualizaciones; deduplicación de eventos; separación de tareas visuales pesadas del hilo principal cuando sea necesario; evitar render de grandes grafos fuera de pantalla; cerrar suscripciones al ocultar panel; limitar polling; reutilizar cachés y recursos con TTL/ACL/frescura y readback; minimizar prompt/schema tokens sin perder acceso a capacidades; descargar modelo tras inactividad. Evalúa si React.memo, useDeferredValue, startTransition, IntersectionObserver, requestIdleCallback, Web Workers o virtualization EXISTENTES ayudan realmente antes de añadir dependencias. No introducir workers permanentes, dependencias pesadas, segunda DB, schedulers o polling agresivo.
**No reducir la magia:** al abrir una vista se recupera el estado completo; una opción lenta puede presentar progreso/suspensión con reanudación; ninguna capacidad desaparece por defecto. Controlar calidad adaptativa según recursos medidos y preferencias, no valores falsos. Los gestos, gráficos y animaciones deben seguir siendo útiles y respetar prefers-reduced-motion. Las acciones materiales siguen sujetas a ToolApproval/autoridad externa. Sin datos autenticados mostrar UNKNOWN, nunca READY ficticio.

## INVESTIGACIÓN C — VISOR AVANZADO REAL Y CABINA
Construye una matriz de cada vista: fuente, UI, binding backend, renderer nativo reutilizable, datos, permisos, coste CPU/RAM/VRAM, tamaño de bundle, comportamiento móvil y readback.
Flujos de aceptación: conversación→abrir cabina→inspector→artefacto real→preview→PIN/COMPARE sólo con callback/ACL→volver al chat; tarea→PlanGraph vs ActiveFlow→receipt; MCP R0→Estado LIVE→StatusRail; selección de destino externo con permisos propios; árboles de Files/Drive lazy; navegador público untrusted; visor en pantalla pequeña como bottom sheet, mismo historial y persistencia. Trabaja al menos un flujo E2E de ejemplo con data-flow exacto, sin inventar endpoints.

## INVESTIGACIÓN D — EXPERIMENTOS Y MÉTRICAS
Propón tests de bundle/JS chunks, memoria heap/PSS, CPU idle/abierto, FPS/jank/long tasks, TTI/tiempo abrir visor, latencia de respuesta «Hola» con visor abierto/cerrado, número de renders, consultas/suscripciones/MB de datos y carga de modelo cold/warm. Especifica comandos reproducibles para Playwright/Chromium o browser test ya existente; no inventes porcentajes ni PASS.
Define bases *antes/después* para desktop y móvil con evidencia por revisión, y umbrales de **no regresión funcional**. No exigir cifras imposibles sin medición. Evita benchmark artificial con mock que se rotule HOST VERIFIED. Propón degradación gradual y restauración completa cuando haya recursos, no apagar módulos.

## ENTREGABLES (EJECUTA LA INVESTIGACIÓN, NO SÓLO PLAN)
D1: Google Doc privado «NOSTROMO • VISOR AVANZADO Y CABINA MÁGICA • BAJO CONSUMO • 2026-11-18», con resumen ejecutivo, documentación oficial enlazada, funcionalidades verificadas por SHA/archivo/línea, matriz nativo vs overlay, mapa de componentes y contratos de wiring.
D2: Top 10 gaps concretos ordenados P0-P3, con causa, prueba que falta, coste y solución reversible.
D3: 2–4 **parches reales** tipo diff --git, sobre rutas reales y contexto auténtico del HEAD; tests significativos y rollback. NO crear nuevo visor/Kernel/DB/polling si puede resolverse con native renderer. Si no ejecutas test escribe NOT_RUN.
D4: Plan de optimización por capas idle/visible/background/móvil; cada mejora trae «magia preservada», métrica que mejora, riesgo y no-regresión que la protege.
D5: Handoff ejecutable al Work ÚNICO del Lenovo con GitHub CLI/fine-grained PAT autorizados, R0→backup→patch→test→mount→E2E→readback→verify→receipts issue #37. Sin secretos ni publicación del Drive.
D6: Lo que esté sólo en SOURCE debe permanecer NO_VERIFICADO: no declara instalado, ni live, ni E2E, ni percentajes inventados.
**Primera salida:** HEAD GitHub leído y plan de fuentes. **Resultado final:** informe completo y diffs auténticos, o lagunas explícitas. Mantén PR #54 DRAFT y main intacta.

## CRITERIO FINAL
La mejor solución no es la más minimalista visualmente, sino la más **capaz, expresiva, continua, autónoma y mediblemente eficiente**. Mantener experiencia rica y completa; reducir coste de lo que NO se está usando, no sus prestaciones. No confundir animación/visor rico con ejecución material o permisos.
