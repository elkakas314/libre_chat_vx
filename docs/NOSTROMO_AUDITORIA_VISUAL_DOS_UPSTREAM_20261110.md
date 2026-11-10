# NOSTROMO — auditoría forense SOURCE de cabina, Tentáculo Hub y dos upstream locales (10-11-2026)

## Ámbito, evidencia y límites

Base GitHub leída: `elkakas314/libre_chat_vx@a4f5f2e5dc9de20706f0edd4a70e55760963bc7f`.
Se inspeccionaron los archivos `overlay/upstream/VXCockpitBridge.tsx`,
`overlay/upstream/VXCockpit.css`, `src/ui/NostromoCockpit.tsx`,
`src/ui/CockpitShell.tsx`, `src/ui/TentaculoHud.tsx`,
`src/ui/TentaculoHub.tsx`, `src/hud/nostromoHub.ts`,
`src/hud/tentaculoHud.ts`, `src/cockpit/windowRouter.ts`,
`src/cockpit/controlDeck.ts`, `src/ui/ControlDeckView.tsx`,
`src/ui/BackgroundTasksView.tsx`, `src/ui/ResourceTreeView.tsx`,
`src/ui/PlanGraphView.tsx`, `src/ui/ActiveFlowView.tsx`,
`tests/tentaculo-hud.test.ts`, `tests/nostromo.test.ts`,
`tests/visual/visual-smoke.cjs`, `ci/fixtures/native-overlay-prereq.spec.ts`,
`config/nostromo_autonomo.current.json`, `config/model_registry.current.json`,
`config/chatgpt_authorized.current.json` y documentación UX anterior.

Esta auditoría es SOURCE (GitHub) y cotejo de readbacks que el usuario pegó desde el Lenovo.
El conector MANOJOS5 se intentó en R0 para auditar las carpetas:
`run-f6cf9b30-991b-480c-abfa-5fcb5351c627` produjo
`PLANNING_FAILED/TYPED_PLAN_SCHEMA_INVALID` sin pasos.
**No se ha obtenido nuevo readback host-local vía plugin.**

## Tres árboles físicos independientes que no se deben mezclar

| Carpeta | Naturaleza | Evidencia previa en el Lenovo |
|---|---|---|
| `~/librechat/vx` | repo NOSTROMO `elkakas314/libre_chat_vx` | HEAD local visto `9463ff8`, fichero `node_modules` según instalación, package-lock no seguido; el remoto avanzó luego. |
| `~/librechat/upstream` | LibreChat original con el overlay parcial que se está preparando | `f10b1d91...`, `client/package.json`, `Presentation.tsx`, `package-lock.json` modificados; paquete VX viejo; Bridge/CSS copiados y comparados; sin `.env` ni YAML principal. |
| `~/upstream` | **otro** checkout de LibreChat | se observó `.env` aquí y una eliminación tracked histórica; **no confundir ni copiar** su `.env` o configuración al primero. |

En el Lenovo: MCP Node stdio 19/19 pruebas PASS locales previas. Después,
`nostromo:workspace:diagnose` retornó `TSC_EXIT=2` por tipos
`@types/react` / JSX TS7016/TS7026. Nueva reparación SOURCE publicada
en el repo: staged React declarations, aún **no probado en Lenovo**.
No se ha conmutado el paquete VX original. No escuchar 3080/27017, socket
Docker ausente; esto no demuestra que no exista otra DB instalada.

## Hallazgos visuales con severidad

| Prioridad | Hallazgo | Evidence / solución |
|---|---|---|
| P0 | **No hay cabina LIVE**: LibreChat todavía no arranca con login, agente/MCP conectados y modelo | Mantener SOURCE; arrancar tras compilar paquete, configurar DB y agente. |
| P0 | **Cabina real ≠ cabina avanzada** | `VXCockpitBridge` es la montada en `Presentation`; `NostromoCockpit` contiene paneles adicionales no conectados. No montar automáticamente una segunda cabina ni duplicar native panels. |
| P1 | Texto fijo `MCP no instalado` es inexacto: host sí tiene dependencias MCP y pruebas, pero no binding | Cambiar a **MCP sin vínculo LIVE verificado** y utilizar `mcpInstalled:null` en snapshot SOURCE. |
| P1 | Hub SOURCE omite archivos, Git, métricas, voz y tareas ya diseñadas | Añadir ítems SOURCE con rutas exactas; no asignar autoridad a herramientas opcionales. |
| P1 | `TentaculoHud` siempre recibe `projectTentaculoHud([])` en bridge | No afirmar conexión; integración futura de readbacks por adapter autenticado, con evidencia/frescura. |
| P1 | El botón `Volver al chat` en el modo externo sólo cambia a NOSTROMO local, no cierra panel | Nombrarlo `Volver a NOSTROMO`; el botón de cierre real sí vuelve al chat. |
| P1 | `NostromoCockpit` declaraba ventanas `STATUS_RAIL`, `PLAN_GRAPH`, `ACTIVE_FLOW` en el router sin renderizarlas | Conectar renderizadores **sólo si existe dato de origen**; no inventar eventos ni grafos. |
| P1 | E2E SOURCE habitual renderiza una fixture distinta de `VXCockpitBridge`; pruebas históricas native son con mock | No presentar capturas como LIVE. Ejecutar E2E native en Lenovo cuando LibreChat arranque; escritorio/móvil, contexto abierto/cerrado, Artifacts/Subagent activos, tema claro/oscuro. |
| P1 | Router, SIWC ChatGPT y voz no tienen bindings de runtime | `chatgpt_authorized.current.json` = `enabled:false`, `provider_binding:UNCONFIGURED`; no utilizar token GitHub como OAuth. |
| P2 | Componentes avanzados presentan labels crudos (scope, authority, IDs) y no tienen CSS específico consolidado en la app nativa | Tras integrar de manera incremental, usar lenguaje humano y reutilizar UI nativa, accesibilidad y control de overflow. |
| P2 | `visibleExecutedEdges` filtra por texto de `executionEvidenceRef`, no valida por sí solo un receipt | Tratar `FlowEdge` como proyección de un productor verificado, no como un PASS. |

## Protección y diferencias visuales

- `VXCockpit.css` tiene estilos responsive a 767, 580, 430 y 390 px,
  estados de foco y temas claro/oscuro; esto es inspección SOURCE,
  no comprobación visual sobre navegador del Lenovo.
- No crear segundo SidePanel ni sustituir Files, Artifacts, ToolApproval,
  Subagents, Background Tasks o el historial native.
- Modos visibles: AUTONOMO, MANOJOS, VX13, ORACULO. Sólo AUTONOMO
  posee el MCP local; externos conservan sus autoridades.
- Límite de datos: `projectTentaculoHud([])` mantiene el HUD externo
  sin READ verificado. En tiempo real deberá leer el adapter con ACL,
  TTL y receipt, no confiar en datos redactados por el modelo.

## Readback de ambos upstream sin secretos

Se añade `scripts/audit-local-librechat.mjs`: compara metadatos Git
(HEAD, rama, dirty, untracked), presencia de `.env`/YAML **sin abrirlos**,
tipos React y archivos concretos con SHA-256 entre:
`~/librechat/vx`, `~/librechat/upstream` y `~/upstream`.
No usa npm, GitHub Actions, Docker ni cambia archivos/procesos.

```bash
cd ~/librechat/vx
git pull --ff-only origin main
node --check scripts/audit-local-librechat.mjs
node scripts/audit-local-librechat.mjs
```

**Cierre condicionado**: después de recibir JSON real, decidir qué
trabajo es único en cada checkout y si puede cambiarse el paquete VX.
No copiar `.env`, ejecutar uninstall-overlay ni limpiar git/lockfiles.
El backend LibreChat, Login, OAuth, MCP Agent, Router y HUD LIVE siguen
pendientes hasta readback material independiente.

## No Actions

Desde `main@ddb1f44` los 3 workflows sólo admiten disparo manual.
No se han solicitado nuevas ejecuciones, no se deben reactivar triggers.
Las pruebas de las correcciones SOURCE de esta auditoría aún están
pendientes de ejecución local hasta disponer de dependencias correctas.
