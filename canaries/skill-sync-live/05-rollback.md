# LC-SKILL-SYNC-LIVE — rollback escrito, jamás automático

1. Detener la observación tras FAIL; conservar evidencia privada 01–04 (sin JWT ni GitHub token), nombres, `git_commit_sha`, `git_blob_sha`, `sha256`, sourceId/tenant y timestamps. Un FAIL **no autoriza** un nuevo POST.
2. Para errores o UNKNOWN_OUTCOME de una sincronización iniciada fuera de este canario: leer el **mismo** run/status y los mirrors afectados antes de cualquier nuevo intento.
3. Stage 1: conservar el YAML previamente aplicado y los 12 Skill roots físicos, incluidos ambos aliases. No pasar a stage 2 con discrepancias.
4. Stage 2: restaurar, solo mediante autorización admin externa, la configuración anterior del **mismo sourceId**, desde snapshot autenticado. Cualquier POST de resync es material y no forma parte del canario; exigir preflight, propietario y autorización propios.
5. Después de un rollback administrado, repetir `GET /api/admin/skills/sync/status`, hashes de los 12 mirrors y visibilidad/ACL por rol; registrar readback verificable. Si snapshot o permisos no están disponibles, gate queda OPEN.
6. No borrar de Git `skills/nostromo-intent-translation` ni `skills/nostromo-tool-budget`. No crear una segunda fuente al confundir `librechat-vx-skills` con `nostromo-vx-skills`.

Todos los scripts del paquete son GET/lectura y no contienen mutadores. Ninguna cuota de servicios ni credencial se inventa.
