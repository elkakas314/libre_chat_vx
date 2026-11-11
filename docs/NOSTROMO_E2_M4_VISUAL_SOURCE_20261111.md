# NOSTROMO E2 — M4 interfaz SOURCE: continuidad y contratos
Fecha: 2026-11-11 · Issue #37 · Base Director `c11af334ccfce8b7dd4b5be8dece44768b9999d2`
Rama: `e2/nostromo-m4-visual-source-contract-20261111`

## Hallazgo decisivo

M4 no requiere una segunda interfaz. El puente existente `overlay/upstream/VXCockpitBridge.tsx` ya inserta `TentaculoHub` y `TentaculoHud` dentro del panel nativo, **no como cockpit paralelo permanente**. El Bridge recibe sólo inventario SOURCE y una proyección HUD de lista vacía; **ninguna respuesta backend/Agent Builder/MCP** se consume en ese JSX. No hay endpoint NOSTROMO ni sesión OAuth autenticada acreditados.

## Productores, consumidores, fronteras

| Componente SOURCE existente | Contrato / consumidor | Verdad demostrada |
|---|---|---|
| `src/hud/nostromoHub.ts` | `nostromoHubSourceSnapshot()` → `TentaculoHub` en el bridge | Inventario SOURCE estático, `mcpInstalled=null`, `chatgptConnected=null`, `materialVerified=false` |
| `src/ui/TentaculoHub.tsx` | `snapshot.items` → árbol Hub local y futuros externos | Lectura visual sin `onClick` de ejecución, sin poder sobre MCP/host |
| `src/hud/tentaculoHud.ts` | `projectTentaculoHud([])` → `TentaculoHud` | Los destinos sin observación permanecen `UNCONFIGURED`; `VERIFIED_READ` exige evidencia y `peerVerified` |
| `src/ui/TentaculoHud.tsx` | Recibe cards/activeSystem del bridge | Sin foco solicitado, renderiza `null`; acciones del destino no se transfieren |
| `overlay/upstream/VXCockpitBridge.tsx` | El overlay de LibreChat lo registra en su `Presentation` tras reconciliación | Selector NOSTROMO/MANOJOS/VX13/ORÁCULO; inventario y contexto, sin llamadas MCP |
| `src/ui/NostromoCockpit.tsx` y `src/ui/CockpitShell.tsx` | Composición alternativa ya existente; conservar | SOURCE disponible, montaje como flujo nativo LIVE **no verificado** |
| `scripts/reconcile-native-visual.mjs` | Overlay hacia `client/src/components/VX` | PREVIEW por defecto, `--apply` gobernado con checks y backups; no ejecutado aquí |
| `agents/nostromo-autonomo/agent.candidate.json` | Provisionamiento nativo Agent Builder pendiente | `enabled=false`, `model=null`; no se activa desde la UI |
| `deployment/nostromo-mcp/server.mjs` | Sólo proceso stdio del agente (NO bridge visual) | SOURCE; no hay `chat→MCP` ni herramienta LIVE verificada |
| Backend/Mongo y auth | Fuente futura de observaciones autenticadas | `HOST_UNVERIFIED`; no inferir READY por screenshot ni puerto TCP |

## Cambio mínimo implementado

Sólo textos en `overlay/upstream/VXCockpitBridge.tsx`: donde decía
`Tu agente de terminal en el Lenovo`, ahora `Agente candidato de terminal
para el Lenovo`; reemplaza `MCP probado localmente` por `MCP con pruebas
SOURCE, sin enlace LIVE con LibreChat comprobado` y precisa que el modo
local es **candidato**. No cambia JSX estructural, permisos, imports,
backend, estados, navegación, rutas ni herramientas MCP.

Prueba nueva `scripts/tests/nostromo-m4-visual-source-contract.test.mjs`,
sólo Node builtin, registra **5 contratos** para el bridge, textos veraces,
Hub fail-closed, HUD sin observación, y reconciliación visual preview-first.
Ejecutable en checkout: `node --test scripts/tests/nostromo-m4-visual-source-contract.test.mjs`.
Se conserva la suite de renderizado React original en
`tests/tentaculo-hud.test.ts` sin reescribirla.

## Evidencia y límites de prueba

- `fetch_file` de GitHub en esta rama para los **7 archivos exactos**
  (bridge, Hub snapshot, Hub JSX, HUD JSX, proyección HUD, reconciliador y test).
  Se evaluaron **5/5 invariantes estáticos PASS** sobre esas cadenas
  descargadas, con comprobaciones independientes contra los mismos
  contratos del test publicado. Esto **no equivale** a ejecutar el archivo
  `node --test` contra un checkout físico de GitHub, ni a renderizar React.
- Blob bridge actualizado `60df7b459616e0120112571a08ac7dbad3344945`.
- Blob test nuevo `bd6608573b57bc53ddc8eed2a01563d1827026e8`.
- `tests/tentaculo-hud.test.ts` anterior incluye pruebas de
  `UNCONFIGURED`, ausencia de 3-card grid, inventario SOURCE y
  no atribución de estado LIVE; **no reejecutado** aquí.
- Ningún checkout Lenovo modificado; no overlay aplicado; sin screenshot,
  sin sesión backend, sin usuario autenticado, sin pruebas UI/móvil E2E.
- Contratos con backend, modelo/agente y MCP aún pendientes de wiring
  autenticado real; nunca rellenar observaciones con datos sintéticos.

**ROLLBACK:** revertir exclusivamente commits M4 o cerrar su PR DRAFT.
**GAPS:** descarga SDK y handshake de M3 pendiente, M1/N-B1 host pendiente,
backend+Mongo/auth/persistencia y mobile/recovery no verificados.
**NEXT_ACTION:** reviewer prueba el test Node puro y los tests React en
checkout aislado con dependencias legítimas; tras readback Lenovo y auth,
instrumentar una proyección **autenticada** con recibo, sin segunda UI.
**ESTADO:** `SOURCE_CONTRACTS_REVIEWED / UI_HOST_UNVERIFIED`.
