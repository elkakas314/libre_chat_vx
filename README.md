# libre_chat_vx

Repositorio independiente para construir la capa LibreChat de VX13/MANOJOS3/ORÁCULO sin mezclar sus repos, kernels ni autoridades.

## Estado

`SOURCE_CORE_COMPLETE / GITHUB_FIRST_QA_IN_PROGRESS`

- `GITHUB_CI_SOURCE=SUCCESS` (código HEAD 3d0d7cb8981b2f5ab5bfc1cba077d9f867721993; run 37997966900)
- `VISUAL_SOURCE_FIXTURE=SUCCESS` (Chromium escritorio+móvil; run 37997966956, artefacto 11648201561)
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
