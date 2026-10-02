# HANDOFF CURRENT

## Estado

`DOCUMENTED_SOURCE_BOOTSTRAP`

No declarar `LIVE`, `READY` ni `MATERIAL_VERIFIED` sin readback del runtime real.

## No repetir

- Este repositorio estaba vacío antes del bootstrap.
- LibreChat es Conversation/UI Plane y cockpit; no es Kernel.
- No copiar source de VX13, MANOJOS3 u ORÁCULO.
- Upstream fijado: `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`.
- El baseline es event-driven/lazy/backpressure/snapshot-resync. Polling fijo sólo puede ser fallback acotado.
- U0–U23 queda como familia contractual cliente.
- Offline/PWA no reenvía mutaciones ni autorizaciones automáticamente.
- Artifacts no son Trusted Operational Surface.
- VX13 sigue DESIGN_ONLY mientras no haya runtime probado.
- MANOJOS3 requiere binding LibreChat real antes de elevar sus capabilities a configuradas.
- ORÁCULO conserva `authority=false`; modelo configurado no equivale a inferencia verificada.

## Continuación

1. Inspeccionar host y localizar/adoptar instalación LibreChat real si existe.
2. Materializar overlay sobre el pin upstream.
3. Validar configuración y secretos externos.
4. Cerrar MANOJOS3 R0 con readback.
5. Cerrar ORÁCULO R0 mediado.
6. Implementar cockpit y recovery.
7. Sólo después probar una mutación gobernada pequeña.
