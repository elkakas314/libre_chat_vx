# Observaciones MANOJOS3 — anexo SOURCE no canónico

**Propietario del canon observado:** MANOJOS3, independiente de LibreChat VX.
**Repo observado:** `elkakas314/manojos3`, rama `main`, git_commit_sha `87444678ad4de2f197039ae989f058f87a02cc0e`.
**Estado de despliegue:** `NO_DEPLOYMENT_EVIDENCE`; no se ha consultado el runtime ni se han realizado mutaciones sobre MANOJOS3.
**Propósito:** registrar las observaciones contrastadas de un target externo, no importar su deuda a `SPEC.json#/discrepancias_abiertas`, ni autorizar cambios en MANOJOS3.

## OBS-M3-001 — OpenAPI frente a servidor: seguridad de lecturas

`docs/CONTROL_PLANE_OPENAPI.json` declara `XManojosToken` en lecturas de catálogo e identidad (`GET /v1/self`, `/v1/capabilities`, `/v1/capability-index`), mientras que los handlers de `src/manojos3/server.py` responden antes del chequeo `_auth_ok()` de las rutas protegidas (runs, receipts, autorizaciones). Es una divergencia SOURCE; no demuestra que las rutas sean públicas en una instalación real, pues proxy/ingress quedan fuera de alcance.

- `docs/CONTROL_PLANE_OPENAPI.json` — git_blob_sha `5f9521e44cea01f46c47a7abb4fcd5295588ac16`
- `src/manojos3/server.py` — git_blob_sha `e3ffa9ae2eef4b1914c45db84de52c7654b5b18e`

## OBS-M3-002 — Eventos internos; entrega externa no identificada

`state.py` persiste y consulta eventos mediante `event()` y `events_by_kind()`. En las rutas de `server.py` y las herramientas de `mcp_gateway.py` examinadas no existe `/v1/events` ni una suscripción de eventos. No atribuir a MANOJOS3 la obligación de crear un endpoint literal si confirma una alternativa gobernada equivalente.

- `src/manojos3/state.py` — git_blob_sha `704a2ecb918c6c416fcdd2af43a480f72e86e9fe`
- `src/manojos3/runtime.py` — git_blob_sha `24690c6e855837fa81134c7594681ac06c92445c`
- `src/manojos3/server.py` — git_blob_sha `e3ffa9ae2eef4b1914c45db84de52c7654b5b18e`
- `src/manojos3/mcp_gateway.py` — git_blob_sha `ac1950197d647a9f2191da5a68417cfe6d83f79b`

**Límite de interpretación:** este documento es un anexo de observaciones SOURCE, no un cuarto artefacto del canon LibreChat, no una discrepancia VX, no una orden de implementación en MANOJOS3 y no demuestra LIVE.
