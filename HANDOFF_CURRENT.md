# HANDOFF CURRENT

## Estado
`SOURCE_RECONCILED_SECOND_PASS_CODE_SCAFFOLDED`

## Trazabilidad
`docs/REQUIREMENT_LOCATION_MATRIX_CURRENT.md` contiene 120 requisitos LibreChat reconciliados desde Maestro VX13 + aportación LibreChat/Tentáculo v7, cada uno con fuente, ubicación, test y estado.

## Segunda pasada incorporada
Shell reversible, StatusRail, estados Tentáculo, prioridad exacta de foco, ArtifactDock, renderer manifest, UiAction lifecycle, audio/build semantics, continuidad referencial, SkillMirrorManifest, LibreChatReadinessTruth, ReadDiscovery, CrossTargetRead, PlanGraph, M3 panel parity, ActiveFlow y layouts desktop/mobile.

## No repetir
- LibreChat es Conversation/UI Plane + cockpit, no Kernel.
- Upstream pin = `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`.
- Event-driven/lazy/backpressure/snapshot-resync es baseline.
- Polling fijo es sólo fallback bounded POR_MEDIR.
- U0–U23 es familia cliente canónica.
- Offline/PWA no auto-replay de efectos.
- Artifacts ≠ TrustedSurfaceHost.
- VX13Adapter sigue DESIGN_ONLY sin runtime.
- MANOJOS3 binding y ORÁCULO canary siguen pendientes materialmente.
- Los módulos TS actuales son scaffolding contractual; no equivalen a integración LibreChat upstream ni runtime PASS.

## Reanudación exacta
Host online → M0 AUDIT_LOCAL_CLIENT → AdapterCompatibilityReport → overlay upstream mínimo → MANOJOS3 R0 → ORÁCULO R0 mediado → cockpit → mobile/recovery → primera mutación gobernada.
