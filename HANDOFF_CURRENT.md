# HANDOFF CURRENT

## Estado
`SEMANTIC_MODEL_RECONCILED_SOURCE_ONLY`

## Correcciones semánticas obligatorias

- Tentáculo HUD != Tentáculo Link.
- Nostromo = cabina/shell de LibreChat, no target ni servicio.
- AUTO/BOTH = scope de vista/lectura; nunca target material.
- VX13/MANOJOS3 = únicos targets materiales del selector actual.
- ORÁCULO = advisory provider, no peer target.
- Source descriptor, LibreChat integration state y live observation son capas distintas.
- `materialReady` deja de usarse como estado de target.
- governedReadPathReady / governedMutationPathReady describen caminos, no resultados.
- MATERIAL_VERIFIED exige readback + verification + receipt de una ejecución concreta.
- ToolApproval UI != autorización Madre/Policy.
- Artifact != TrustedSurfaceHost.
- LibreChat subagent != VX13 hija != target worker.
- background tool call != target run.
- GREEN/YELLOW/RED clasifican intención UI y no conceden autoridad.

## Fix estructural

`CockpitWindow` ahora declara `EVIDENCE`; antes el router devolvía una ventana que el tipo no contenía.

## Materialidad

Último commit probado materialmente en Lenovo: `94c632762f7afee7d9fa9d0f0c23c80d7494d2d2` con 26 tests PASS.

Este HEAD es GitHub-only por la restricción actual de no tocar local:
- source tests = NOT_RUN;
- LibreChat runtime = NO_VERIFICADO;
- VX13 runtime = DESIGN_CONSOLIDATION;
- MANOJOS3 LibreChat binding = PREPARED_UNCONFIGURED.
