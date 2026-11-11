# NOSTROMO — Backups, limpieza segura y prevención (11 noviembre 2026)

## Estado

El usuario quiere impedir que NOSTROMO acumule residuos. Hay tres rutas prioritarias en el Lenovo:

- `/home/elkakas314/nostromo-workspace-backup.2jGTrK`
- `/home/elkakas314/nostromo-ui-backup.s5cE3siD`
- `/home/elkakas314/nostromo-backup.ceBhjB8V`

**No se ha inspeccionado el contenido real de esas carpetas desde GitHub.**
No suponer redundancia por nombre o antigüedad. El primer backup es
la antigua instalación VX, conservada mediante `rename` por el
reconciliador. Un `rename` dentro del mismo filesystem no duplica por
sí solo todos los bloques. El espacio recuperable es desconocido.

## Revisión de la propuesta DeepSeek

Aprovechados: Python stdlib, auditoría R0, hashing por bloques, no
seguir symlinks, clasificación conservadora, evitar `git clean/reset`.

**Rechazados hasta reparar:**

1. Su digest de directorio omite directorios vacíos, modos y objetivos
   de symlinks. Un digest aparentemente igual no garantiza
   reversibilidad del backup.
2. Su clasificación puede proponer `REDUNDANT` sin reconciliar
   referencias de instalador/rollback ni el propósito del backup.
3. `cmd_verify` considera válido el hash que acaba de calcular,
   sin baseline anterior; no prueba que no se perdieron datos.
4. `cmd_purge` usa `PURGE_CONFIRMED` genérico, prefijos de
   ruta y `shutil.rmtree`; no utiliza allowlist, CAS de contenido
   ni fence por identidad de cada carpeta.
5. `shell=True` en el test MCP opcional amplía el riesgo.
6. El fragmento de uso apunta a `~/nostromo` y a
   `python -m mcp_nostromo`, que no son rutas/comandos de este
   proyecto; el MCP real está en `deployment/nostromo-mcp/server.mjs`.

**No ejecutar el código de eliminación suministrado por DeepSeek.**

## Implementado en esta revisión (SOURCE)

- `scripts/nostromo-backup-audit-r0.py`: solo lectura; stdout JSON;
  tres backups exactos predeterminados; workspace de comparación real
  `~/librechat/upstream/packages/librechat-vx` (no `~/librechat/vx`).
  Calcula SHA-256 de contenido regular, sin leer archivos con nombres
  sensibles, sin seguir enlaces, con comprobación de identidad antes
  y después, límites de número de entradas y bytes leídos.
  El hash completo incluye rutas, tipos, modos y directorios vacíos.
  Si falla un permiso, hay symlink o cambio concurrente: UNKNOWN_PRESERVE.
- Ningún resultado concede borrado: `canQuarantine:false` y
  `canPurge:false`. Igualdad de contenido sólo genera
  `POSSIBLE_DUPLICATE_REVIEW_ONLY` y sigue pendiente el propósito.
- `scripts/tests/test_nostromo_backup_audit_r0.py`:
  pruebas para duplicado exacto, original único, symlink,
  secretos, cambios durante el análisis, límites y directorios vacíos.
- `scripts/workspace-noop-gate.mjs`: evita crear más carpetas
  `nostromo-workspace-backup.*` cuando `--apply` ya encuentra
  exactamente el paquete instalado, el UI coincidente y mismo
  conjunto de archivos.
- Scripts antiguos `install-as-workspace.mjs` y
  `uninstall-overlay.mjs`: ahora FALLAN CERRADOS. Sus versiones
  históricas hacían `rmSync` / `git restore` directamente;
  sus fuentes permanecen en Git, no se eliminan del historial.

## Comando único de auditoría sin ensuciar el Lenovo

Una vez actualizada y probada la revisión SOURCE desde el checkout
que la contiene:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -B -m unittest discover \
  -s scripts/tests -p 'test_nostromo_backup_audit_r0.py' -v
node --test scripts/tests/workspace-noop-gate.test.mjs
python3 -B scripts/nostromo-backup-audit-r0.py
```

El último comando **imprime en pantalla** el inventario de los tres
respaldos y la instalación, sin escribir JSON en el home ni alterar
carpetas. Conviene ejecutar sin otras tareas de mantenimiento pesadas.
No ejecutar pruebas de otras ramas simultáneamente.

## Próximo gate de limpieza material

Tras obtener readback de tamaños/fingerprints y auditar referencias
a cada backup en el árbol de scripts y receipts:

1. Conservar una copia de recuperación coherente y toda diferencia única.
2. Para candidatos realmente idénticos, comprobar ausencia de
   referencias activas y de symlinks/archivos privados.
3. Preparar un plan preciso firmado por SHA y ruta/uid/inode,
   con un propietario explícito, cuarentena reversible en mismo FS
   y comprobación POST-CAS, no un borrado automático.
4. Eliminar definitivamente **únicamente después** de verificación
   de integridad de producto, recuperación y autorización concreta.
5. Registrar el espacio realmente liberado (st_blocks/filesystem
   readback), no confundir tamaño lógico y espacio recuperable.

Quedan protegidas las tres rutas. Este PR no llama a `rm -rf`,
no crea backups ni modifica servicios/archivos de host, y no
utiliza GitHub Actions.
