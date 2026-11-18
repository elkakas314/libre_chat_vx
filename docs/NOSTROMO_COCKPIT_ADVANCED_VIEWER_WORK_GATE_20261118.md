# NOSTROMO — CABINA / VISOR AVANZADO / TENTÁCULO — GATES DE WORK
**Fecha:** 2026-11-18 · **Estado auditado:** SOURCE presente, integración con runtime LibreChat parcial, HOST UI E2E NO_VERIFICADO.
**Sistema único:** LibreChat nativo con overlay reversible, sin segundo frontend, sin segundo agente controlador y sin atribuir autoridad a vistas.

## ¿Qué es el visor avanzado?
No existe evidencia de un producto LIVE separado llamado «visor avanzado». El equivalente SOURCE es la **composición contextual del cockpit** (no otra app): `NostromoCockpit` + `ContextInspectorView` + `ArtifactDockView` + `InteractiveArtifactView` + `PlanGraphView` + `ActiveFlowView` + `ResourceTreeView` + otras lentes. Debe integrarse con los visores nativos de LibreChat (Files, Artifacts, chat, side panel); construir un visor paralelo sólo si se demuestra una carencia funcional imposible de cubrir nativamente.

## Hallazgo de código, para evitar falsa instalación
- `overlay/upstream/VXCockpitBridge.tsx` monta **dentro** del panel nativo de LibreChat la cabina simplificada, el selector NOSTROMO/MANOJOS/VX13/ORÁCULO, actividad de la conversación cargada, `TentaculoHub`, `TentaculoHud` y teléfono.
- En ese puente, `nostromoHubSourceSnapshot()` es inventario SOURCE y `projectTentaculoHud([])` está vacío: no hay un feed real autenticado del backend para esas tarjetas en ese JSX. UI visible ≠ LIVE.
- `src/ui/NostromoCockpit.tsx` compone el cockpit avanzado completo con ventanas según `src/cockpit/windowRouter.ts`; es código SOURCE, **no está probado que sea el mismo componente montado en el panel real**.
- `src/ui/ContextInspectorView.tsx` enseña foco/referencias; no es un inspector de tokenización/contexto LLM ni una vista de documentos con zoom.
- `src/ui/ArtifactDockView.tsx` define acciones `OPEN/PIN/COMPARE/TIMELINE/EXPORT`, pero los botones requieren callback real, ACL fresca y backend autorizado; no confundir botón con función LIVE.
- `src/ui/InteractiveArtifactView.tsx` sólo genera intents preview/commit; la UI no crea grants R2.
- `src/ui/PlanGraphView.tsx` y `ActiveFlowView.tsx` proyectan plan vs aristas materialmente observadas, nunca simulan ejecución.
- `src/cockpit/layoutContract.ts`: escritorio `CHAT_GRAPH_SPLIT_INSPECTOR`; móvil `CHAT_FIRST_STATUS_INBOX_BOTTOM_SHEET`; mismo historial de conversación y privacidad por visor.
- `docs/NOSTROMO_E2_M4_VISUAL_SOURCE_20261111.md` advierte que un render CI/fixture no certifica visual LIVE; `scripts/reconcile-native-visual.mjs` es preview-first y debe correr sobre upstream realmente instalado con backup.

## Encargo para el MISMO Work — fase UI obligatoria después de P0 chat/MCP
### V0. Preservación y selección nativa
Inspeccionar el `LibreChat` upstream realmente montado y el overlay del Lenovo: hashes, estado dirty, feature flag **gobernado por backend** (no aceptar `localStorage` como autorización), compatibilidad de componentes, routing de panel nativo y CSS scoped. No montar dos cabinas ni ocultar chat estándar. Guardar preimágenes de cambios. Cuando overlay OFF, LibreChat original sigue completamente usable.

### V1. Cabina nativa y contexto
Desde **la misma conversación** abrir y cerrar con teclado, ratón/táctil, foco correcto, Escape y volver al chat. Mostrar estado auténtico (selección agente, modelo, sesión, herramientas efectivas, capacidad/CPU/GPU si autorizado), distinguir `SOURCE/INSTALLED/CONFIGURED/LIVE/VERIFIED`. `StatusRail` separa conexión, readiness, trabajo y evidencia. `CurrentFocus` conserva referentes sin introducir historiales brutos al LLM. Nunca usar valores mock como monitor de producción. La vista no ejecuta cambios por sí misma.

### V2. Visor avanzado de datos y artefactos
Composición nativa, **una sola superficie contextual** que permita según contenido:
- Archivos reales: árboles `ResourceTree` lazy, selección, acceso autorizado, tipo y procedencia; vista previa de PDFs, texto, imágenes, audio, código o documentos **mediante renderers ya existentes de LibreChat** cuando sean compatibles. Si alguna representación no está soportada, declarar gap exacto; no recrear un visor entero.
- `ArtifactDock`: abrir/mostrar, fijar, comparar, línea temporal y exportar **sólo cuando exista callback/autoridad/ACL y sea observable**. Botón visible sin comportamiento real debe permanecer inactivo o señalizado `UNAVAILABLE`.
- `ContextInspector`: foco (sistema/módulo/capability/run/artifact), procedencia y versión; si el usuario pide inspector de contexto LLM, enlazar diagnóstico de tokens de forma **numérica/saneada**, no revelar system prompts ni tool schemas sensibles.
- Visualización de planes/tareas: `PlanGraph`, `ActiveFlow`, flujos entre módulos, `BackgroundTasks`, `DecisionInbox`, timeline, árbol, tabla y Mermaid/Artifacts si ya disponibles. Diferenciar PLAN, PENDING, EXECUTED, VERIFIED; un plan no equivale a efecto.
- Paneles especializados: browser/scraping público (contenido remoto UNTRUSTED), Files/Drive, repo/build/evidencias, SHUB/REAPER/audio y conectores. Los destinos MANOJOS3/VX13/ORÁCULO son **EXTERNAL** y nunca reciben autoridad al cambiar de vista.
- Accesibilidad/responsividad: desktop chat+inspector acoplable, móvil chat-first y panel inferior/hoja, sin overflow horizontal, con scroll/zoom apropiado, teclado, foco, contraste básico y no exponer contenido de conversaciones a otro usuario.

### V3. Wiring real y fuente de verdad
Conectar únicamente a endpoints/eventos existentes de LibreChat por cuenta/ACL. Un snapshot SOURCE no puede evolucionar a LIVE sin readback autentificado. Preferir suscripciones/eventos nativos con rate limits/backpressure ya disponibles; no polling agresivo ni mantener renderers pesados vivos cuando el panel está cerrado. Cualquier acción del visor genera intent o requiere ToolApproval/target R2 externo. Nada de secretos en DOM, métricas falsas, cadena LLM→JS con efectos sin permiso, o replicar datos Mongo en localStorage.

### V4. Canarios visuales obligatorios
1. Desktop upstream real autenticado: abre cabina/visor desde conversación, cambia foco, vuelve al chat; una única cabina visible, consola sin errores, overlay OFF restaura LibreChat.
2. Artefacto real generado/adjuntado: abrir, previsualizar, fijar/compare cuando funcione, comprobar ACL y que la operación es real; si no funciona, mostrar claramente NO_CONFIGURADO y dejar gate abierto.
3. `StatusRail` y HUD reciben evidencia fresca de un MCP R0 con receipt; SIN evidencia muestran UNKNOWN/UNCONFIGURED. PlanGraph no transforma un plan en VERIFIED.
4. Móvil Android/iOS mediante navegador/PWA: misma cuenta/conversación, apertura y cierre de visor, reconexión tras reload; chat-first, accesibilidad táctil y sin mutaciones offline.
5. Recursos y coste: panel abierto/cerrado en CPU/RAM, polling y latencia; no penalizar la respuesta de «Hola» ni aumentar prompt del LLM por tener abierto el visor.
6. Ejecutar tests SOURCE, browser visual smoke de fixtures, **y** al menos un E2E de montaje real contra la versión fijada; capturas/receipts sanitizados sin compartir datos personales.

### V5. Entregables
Matriz por panel: `RUTA SOURCE | BINDING INSTALLED | AUTH CONFIGURED | LIVE readback | E2E VERIFIED | ROLLBACK | COSTE`.
Cambios mínimos con test y GH CLI fast-forward a rama de integración; CI exact SHA; evidencias en issue #37; PR #54 DRAFT hasta cierre completo. Si un visor no puede ser implementado en esta fase, especificar componente/ruta/bloqueo, y continuar por paneles independientes.

**Prioridad:** P0 conversación/agente/MCP/contexto primero; cabina/visor avanzado y móvil son **criterios de cierre final**, no opcionales olvidados.
