# HANDOFF CURRENT

## Estado
`SOURCE_PROVENANCE_INDEXED_CODE_SCAFFOLDED`

## Cobertura
- 120 requisitos canónicos LibreChat con ubicación/test/estado.
- 208 ocurrencias IDEA-LC de la fuente v7 indexadas.
- 112 IDEA-LC únicas preservadas con AP, disposición, offsets y ubicación.
- Mapa AP→ubicación: `docs/AP_LOCATION_MAP_CURRENT.md`.
- Procedencia completa: `docs/SOURCE_PROVENANCE_INDEX_CURRENT.md`.

## No repetir
- LibreChat es Conversation/UI Plane + cockpit, no Kernel.
- Upstream pin = `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`.
- Event-driven/lazy/backpressure/snapshot-resync es baseline.
- Polling fijo sólo fallback bounded POR_MEDIR.
- U0–U23 es familia cliente canónica.
- Offline/PWA no auto-replay de efectos.
- Artifacts ≠ TrustedSurfaceHost.
- VX13Adapter sigue DESIGN_ONLY sin runtime.
- MANOJOS3 binding y ORÁCULO canary siguen pendientes materialmente.
- Los módulos TS son scaffolding contractual; no equivalen a integración upstream ni runtime PASS.

## Reanudación exacta
Host online → M0 AUDIT_LOCAL_CLIENT → AdapterCompatibilityReport → overlay upstream mínimo → MANOJOS3 R0 → ORÁCULO R0 mediado → cockpit → mobile/recovery → primera mutación gobernada.
