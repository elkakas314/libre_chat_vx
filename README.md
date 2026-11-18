# libre_chat_vx

Repositorio independiente para construir la capa LibreChat de VX13/MANOJOS3/ORÁCULO sin mezclar sus repos, kernels ni autoridades.

## Estado operativo — actualización 18/11/2026 (PR #54)

**Contrato vigente de Work y ejecución:** [NOSTROMO_WORK_OBJECTIVE_CANON_20261118.md](docs/NOSTROMO_WORK_OBJECTIVE_CANON_20261118.md) y [WORK_NOSTROMO_FINAL_EXECUTION_20261118.md](docs/WORK_NOSTROMO_FINAL_EXECUTION_20261118.md). SOURCE en rama `integration/nostromo-canon-20261118-r1`, PR #54 DRAFT. `main` se mantiene sin promover hasta QA + reconciliación HOST.

El runtime en Lenovo y un canario Mongo/MCP tienen evidencia histórica en `CURRENT.json`, pero la instalación integral **no está verificada**. Los apartados de estado de 2026-10 que aparecen más abajo se conservan para trazabilidad, **no son el estado LIVE ni ordenan diferir NOSTROMO a MANOJOS3**. El dueño del host para LibreChat es el Work local cuando realmente tenga terminal autorizada; MANOJOS3 se mantiene externo.

## Estado histórico / SOURCE original (no usar como CURRENT)

`SOURCE_CORE_COMPLETE / GITHUB_FIRST_QA_IN_PROGRESS`

- `GITHUB_CI_SOURCE=SUCCESS` (código HEAD 6364f4211ec971b92da9126aa55bdc115edf1285; run 37998515362)
- `VISUAL_SOURCE_FIXTURE=SUCCESS` (Chromium escritorio+móvil; run 37998515395, artefacto 11648386603)
- `UPSTREAM_MOUNTED_BROWSER_E2E=NOT_RUN` (pendiente, no equivale a pruebas en host)
- `INSTALLATION=DEFERRED_TO_MANOJOS3`
- `LIVE=NO_VERIFICADO`
- `MATERIAL_VERIFIED=NO`
- Upstream fijado: `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`
- Upstream package observado: `v0.8.8`
- Config schema observado: `1.3.17`

El objetivo vigente es cerrar en GitHub las pruebas SOURCE, interfaz visual e integración reversible; la instalación y los canarios LIVE se realizarán después, mediante MANOJOS3. Estado y orden: `CURRENT.json`, `docs/BUILD_ORDER_CURRENT.md` y `docs/GITHUB_FIRST_VISUAL_VALIDATION.md`.

## Principios

1. LibreChat es Conversation/UI Plane + Cockpit/HUB/HUD, no segundo Kernel.
2. VX13 conserva Tentáculo Link/Switch/Madre/Manifestator/Spawner.
3. MANOJOS3 conserva Governor/Policy/Auth/Kernel/Verifier/State.
4. ORÁCULO conserva `authority=false`.
5. No secretos, no force-push, no duplicación de executors/MCP/routers.
6. Timeout tras posible efecto => `UNKNOWN_OUTCOME` => readback/reconcile antes de retry.
7. Polling fijo no es baseline: usar event-driven + lazy views + backpressure/coalescing + snapshot/resync.
8. Extensión: native/config → Skill → MCP/Action → Agent Plugin → wrapper fino → código propio.
9. Un recurso nuevo no implica un módulo nuevo: usar Resource Tree/renderers/adapters genéricos cuando sea suficiente.

## Estructura

```text
contracts/   contratos de proyección/acciones/fencing
config/      ejemplos sin secretos + catálogo/sync de Skills
docs/        arquitectura, seguridad, roadmap, Resource Tree y auditorías
skills/      Skills canónicas versionadas para GitHub Skill Sync/deployment
plugins/     paquetes Agent Plugin opcionales/experimentales
src/
  adapters/  fronteras por target
  cockpit/   UI/focus/projection, sin autoridad material
tests/       scaffolding de pruebas
```

## Regla de verdad

`READBACK/LIVE > SOURCE > CURRENT > HANDOFF > BLUEPRINT > DOCUMENTACIÓN > MEMORIA > INFERENCIA`

No declarar PASS material sin target exacto + readback + verifier + receipt.


## Corte de integración NOSTROMO — 18/11/2026

La rama de revisión `integration/nostromo-canon-20261118-r1` incorpora `main` y Director/E2 mediante [PR #53](https://github.com/elkakas314/libre_chat_vx/pull/53); `main` no se modificó. Leer [canon de integración y forense](docs/NOSTROMO_INTEGRATION_CANON_20261118.md) y el [delta canónico Drive](https://docs.google.com/document/d/1oOiFTIrMD5Lnd05frGZ3HuZf3LgZHBEnAdhkoZvOwFA/edit). Los SOURCE y QA previos no sustituyen la prueba LIVE del Lenovo ni la recuperación del delta MCP local. `NOSTROMO_FULLY_FUNCTIONAL=NOT_VERIFIED`.
