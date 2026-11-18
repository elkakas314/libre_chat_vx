# NOSTROMO E2 — Backups R0: guard de ancestros, SOURCE 2026-11-11

**LOT_ID:** `E2-NOSTROMO-BACKUP-R0-ANCESTORS-20261111`  
**BASE_HEAD:** Director `c11af334ccfce8b7dd4b5be8dece44768b9999d2`.  
**SCOPE:** `scripts/nostromo-backup-audit-r0.py` y pruebas existentes.
**HOST:** `CONFIG_GAP / EXECUTION_ROUTING_MISMATCH`, sin acceso Lenovo.

## Fallo SOURCE y corrección

El auditor R0 ya excluía enlaces de entrada y no permitía borrar, pero
un directorio **padre** symlink podía redirigir `audit_dir(root)`
a un backup situado fuera del árbol esperado: `os.lstat(root)` sólo
comprueba la entrada final y `os.walk` resuelve sus ancestros;
`os.open(..., O_NOFOLLOW)` protege solamente el archivo final.

Cambio acotado: `directory_ancestors_safe(root)` recorre desde `/`
**todos los componentes** mediante `os.lstat`, rechazando symlink,
no-directory o ruta no disponible, ANTES de `snapshot`, `audit_dir`
y `hash_file`; se vuelve a comprobar después del inventario.
La clasificación pasa a `UNKNOWN_PRESERVE` con
`ROOT_ANCESTOR_UNSAFE` cuando corresponda. Nunca `canPurge` ni
`canQuarantine`, jamás se lee `.env` ni otros nombres sensibles.

**Limitación de seguridad documentada:** los `lstat` y el
`os.walk`/`os.open` posteriores son operaciones separadas.
La comprobación bloquea symlinks **estáticos**, pero no demuestra
protección completa frente a sustituciones maliciosas concurrentes
(TOCTOU). Para escanear ubicaciones controladas por un atacante sería
necesario un walker por descriptores y `openat/O_NOFOLLOW` para cada
componente. El auditor sigue siendo **R0 SOLO LECTURA**, no herramienta
de recuperación, limpieza ni traslado de datos.

## TEST / READBACK

- Los dos archivos originales se copiaron byte por byte a
  `/mnt/data/nostromo_e2_backup_guard`. `git hash-object` coincidió
  exactamente con GitHub:
  - script original `14279032e8963e8a12a86161ca1256a3d6dd8897`
  - tests originales `6e618173257e7601329410864961bfc1e9d80a69`.
- Pruebas base antes del cambio: **7/7 PASS**.
- Después de la corrección: `PYTHONDONTWRITEBYTECODE=1 python3 -B
  -m unittest discover -s scripts/tests -p
  'test_nostromo_backup_audit_r0.py' -v`: **9/9 PASS** en fixture
  temporal (2 nuevas: symlink padre de backup; `snapshot` y
  `hash_file` bloqueados). Comprobado que `snapshot`/`hash_file`
  no se invocan para el root externo; bytes del marcador intactos.
- Blobs de código/test resultantes publicados y leídos de GitHub:
  `c187bcff342ef3e9c46fcef495e625daaf574595` y
  `3fc2e6ff6b03609605bce0e3f6d71ef770079bad`.
- No se ha realizado auditoría del contenido de los cuatro backups
  históricos del usuario; nombres originales intactos.
- No se ejecutaron canarios de restart, restore, servicios, Mongo,
  Tailscale, navegador ni MCP.

## Coordinación / rollback / siguiente acción

Rama propia e independiente de PR #38–#41; base Director exacta.
Sin acciones en main/integration/Director, sin merge ni force-push.
**Rollback:** cerrar el PR o revertir sus commits; ningún efecto host.

**GAPS:** comprobación de carreras concurrentes del backup scanner;
readback real de backups/servicios/persistencia; SDK MCP handshake
pendiente por EAI_AGAIN; PWA/móvil/HTTPS y autenticación E2E pendientes.
**NEXT:** revisión independiente Director de este guard SOURCE;
cuando haya ejecutor tipado NOSTROMO, seguir orden
`local:audit → third-upstream:extract → gate → backend:preflight →
backend:decision`, preservando backups y datos privados.

**ESTADO:** `SOURCE_TESTED / GITHUB_READBACK_VERIFIED / HOST_UNVERIFIED`.
