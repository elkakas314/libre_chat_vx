# HANDOFF CURRENT

## Estado
`SOURCE_RECONCILED_CODE_SCAFFOLDED`

## Trazabilidad
La matriz canónica de requisitos y ubicaciones está en:
`docs/REQUIREMENT_LOCATION_MATRIX_CURRENT.md`.

80 requisitos LibreChat relevantes han sido reconciliados desde Maestro VX13/LibreChat CURRENT a archivo + test + estado.

## No repetir
- Repo inicialmente vacío; ahora bootstrap y scaffolding gobernado.
- LibreChat es Conversation/UI Plane + cockpit; no Kernel.
- No copiar source de VX13, MANOJOS3 u ORÁCULO.
- Upstream pin: `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`.
- Event-driven/lazy/backpressure/snapshot-resync es baseline.
- Polling fijo sólo fallback bounded POR_MEDIR.
- U0–U23 es familia cliente canónica.
- Offline/PWA no auto-replay de efectos.
- Artifacts ≠ TrustedSurfaceHost.
- VX13Adapter sigue DESIGN_ONLY sin runtime.
- MANOJOS3 binding y ORÁCULO canary siguen pendientes materialmente.
- Los módulos TS creados son contratos/scaffold, no integración upstream probada.

## Reanudación exacta
Host online → M0 AUDIT_LOCAL_CLIENT → AdapterCompatibilityReport → overlay upstream mínimo → MANOJOS3 R0 → ORÁCULO R0 mediado → cockpit → mobile/recovery → primera mutación gobernada.
