# libre_chat_vx

Repositorio independiente para construir la capa LibreChat de VX13/MANOJOS3/ORÁCULO sin mezclar sus repos, kernels ni autoridades.

## Estado

`DOCUMENTED_SOURCE_BOOTSTRAP`

- `LIVE=NO_VERIFICADO`
- `MATERIAL_VERIFIED=NO`
- Upstream fijado: `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`
- Upstream package observado: `v0.8.8`
- Config schema observado: `1.3.17`

## Principios

1. LibreChat es Conversation/UI Plane + Cockpit/HUB/HUD, no segundo Kernel.
2. VX13 conserva Tentáculo Link/Switch/Madre/Manifestator/Spawner.
3. MANOJOS3 conserva Governor/Policy/Auth/Kernel/Verifier/State.
4. ORÁCULO conserva `authority=false`.
5. No secretos, no force-push, no duplicación de executors/MCP/routers.
6. Timeout tras posible efecto => `UNKNOWN_OUTCOME` => readback/reconcile antes de retry.
7. Polling fijo no es baseline: usar event-driven + lazy views + backpressure/coalescing + snapshot/resync.

## Estructura

```text
contracts/   contratos de proyección/acciones/fencing
config/      ejemplos sin secretos
docs/        arquitectura, seguridad, roadmap y auditoría
src/
  adapters/  fronteras por target
  cockpit/   UI/focus/projection, sin autoridad material
tests/       scaffolding de pruebas
```

## Regla de verdad

`READBACK/LIVE > SOURCE > CURRENT > HANDOFF > BLUEPRINT > DOCUMENTACIÓN > MEMORIA > INFERENCIA`

No declarar PASS material sin target exacto + readback + verifier + receipt.
