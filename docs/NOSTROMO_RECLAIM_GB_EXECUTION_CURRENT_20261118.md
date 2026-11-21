# NOSTROMO — limpieza material de GB, recuperación y recibos (18/11/2026)

**Intención explícita del usuario:** recuperar espacio real en Lenovo, incluida eliminación de residuos inútiles. **Este archivo NO crea ni suplanta grants de HOST_CONTROL R2/R3, ni ejecuta borrados.** El Work autenticado del Lenovo debe comprobar `grant_interface`, emitir por vía legítima los grants exactos que permita su control, aplicar operaciones y mostrar readback del espacio liberado. No utilizar MCP MANOJOS3 como atajo de autoridad sobre el host. No forzar reinicios ni elevar privilegios.

## Estado físico base y límites

Según receipts Work de las 4:11–5:08 del 18/11, NO nuevo acceso LIVE desde ChatGPT:
- Backend activo `/home/elkakas314/librechat/upstream`; MCP activo `/home/elkakas314/libre_chat_vx-clean` (consumido por vx-backend.service). Al cambiarlo hacen falta plan R2, snapshot, pruebas y un reinicio autorizado del servicio; retirar la raíz antigua requiere R3 exacto y ausencia demostrada de consumidores.
- `/home/elkakas314/manojos_3` ~50 GB pertenece a otro proyecto activo: **NO TOCAR sin plano MANOJOS3**. `/home/elkakas314/MANOJOS` producto independiente y activo: NO TOCAR.
- `~/librechat` ~3.2 GB con backend y herramientas, `~/LibreChat` ~657 MB con checkout Docker modificado, `~/upstream` ~567 MB con `.env`, package-lock borrado y node_modules ignorados; ninguno está acreditado como redundante.
- `~/vx-backup` ~6.2 MB, `~/vx-audit` ~244 KB, `~/nostromo-workspace-backup.gngRsx` ~4.2 MB, `~/servicios-ia/openclaw` ~8.4 MB con state/.env, `~/openclaw-b-paquete` ~80 KB. No confundir gigabytes con tamaños de pocos MB.
- RAM disponible ~9.5 GiB, swap libre ~39 MiB de 2 GiB. **No ejecutar simultáneamente builds, grandes `tar` ni `du` recursivo de 50GB sin medir.**

## Plan ejecutable — recuperar espacio SIN perder material único

**Fase R0 (no hay borrados)**

1. Abrir los receipts actuales `20261118-root-sizes-readback.json`, `20261118-vx-clean-active-mcp-readback.json`, `20261118-third-upstream-current-preservation-readback.json` y `20261118-vx-backup-root-readback.json`, más el índice de doce raíces. No repetir la exploración si sigue fresca.
2. Ver `df -B1 /home/elkakas314`, `findmnt -T /home/elkakas314 -o TARGET,SOURCE,FSTYPE`; medir **espacio realmente libre** en el mismo filesystem al principio y al final.
3. Inspeccionar por separado: `docker system df -v` (solo lectura), `du -sh ~/.cache ~/.npm ~/.local/share/Trash 2>/dev/null`, `du -sh ~/upstream/node_modules ~/LibreChat/node_modules 2>/dev/null` **solo si existen**; limitar búsquedas a cachés explícitas de los proyectos y no seguir enlaces simbólicos. No imprimir `.env`.
4. Para cada candidato, comprobar `/proc/<pid>/cwd`, `/proc/<pid>/fd`, systemd ExecStart, wrappers, Docker mounts/volumes, Git dirty/untracked, hashes de material único, lockfiles, reversibilidad, porcentaje de bytes realmente regenerables. Sin evidencia, `UNKNOWN_PRESERVE`.
5. Emitir JSON de candidatos con `path,device,inode,bytesAllocated,owner,provenance,liveConsumers,uniqueFiles,restoreProbe,grantTarget,expectedFreedBytes`. `bytesAllocated` no equivale a espacio ahorrado si hay hardlinks, reflinks o snapshots. No inventar.

**Clasificación y orden de candidatos**

- **C1:** cachés descargables y regenerables `~/.npm/_cacache`, cachés temporales de paquetes y compilación, archivos temporales de builds obsoletos. Solo si no hay procesos que los utilizan, sin contenido único ni lock de ejecución. Preferir comando de limpieza del gestor propietario, no `rm -rf` ciego.
- **C2:** `node_modules` de worktrees **inactivos**, con `package-lock.json` preservado, `npm ci` probado en CI/copia aislada, misma versión Node/ABI y ausencia de consumidores. Probar restauración; no borrar `node_modules` de `~/librechat/upstream` ni MCP ACTIVE.
- **C3:** capas de build de Docker sin consumidores, verificadas con `docker system df -v`, sin imágenes en uso ni volúmenes de Mongo. **NO** usar `docker system prune -a --volumes`; no tocar Docker global compartido sin autoridad específica.
- **C4:** worktrees/checkout duplicados y copias históricas. SOLO tras semdiff de blobs, recuperación de cambios únicos, comprobación de submódulos/branches remotas, snapshot validado y verificación de servicio desconectado. Cuarentena reversible antes de borrado.
- **C5:** OpenClaw staging no onboarded: separar código fuente de state/.env; conservar state y pruebas hasta que exista política de retención; no es prioridad P0.
- **Excluidos:** `MANOJOS`, `manojos_3`, Mongo, `.env`, `.ssh`, `~/.local/state/nostromo/jobs`, bases SQLite, backups únicos, worktrees dirty sin reconciliar, volúmenes Docker y cualquier raíz `UNKNOWN_PRESERVE`.

**Fase R2/R3 — efecto material por plano autorizado**

1. Escoger primero un lote con `verified_regenerable=true` y sin consumidores, de **solo una categoría**. Observar el grant HOST_CONTROL real, `kernel_authority`, target, acción, revisión y riesgo. **La autorización del usuario en ChatGPT es INTENT, no un archivo de grant material.**
2. Guardar manifest, preimagen/retención temporal si precisa, SHA y procedimiento de restauración; operación exacta mediante herramientas locales aprobadas; jamás borrar con `rm -rf ~`, wildcard genérico, `find /home -delete`, `git clean -fdx` o `docker system prune -a --volumes`.
3. Después de cada lote, `df` y readback de los procesos activos, servicio LibreChat, Mongo, MCP, conversación guardada. El éxito implica `freed_bytes = df_after_available - df_before_available >0` en mismo filesystem y ausencia de regresiones.
4. Si el filesystem no libera bytes por ficheros aún abiertos (`lsof +L1` R0) o snapshots, clasificar sin matar servicios sin grant específico.
5. Mantener los receipts e inventario resumido incluso tras borrar carpetas obsoletas. Un backup no restaurado no se elimina porque ocupe espacio.

## Gates prioritarios

No bloquear `agent_9ex2a9buul2cwzyo` ni la PR #54 mientras se auditan caches; el P0 se repara por su ruta autorizada. `SOURCE_CI_PASS` no es `AGENT_MCP_LIVE_PASS`. La limpieza física viene después del cambio de ruta MCP y pruebas de conversación. Si hay cachés inocuas independientes y grant exacto, se pueden eliminar antes sin afectar al agente.

## Receipt de cierre obligatorio

```json
{
  "cleaningRunId":"issued-by-host",
  "hostGrantRefs":[],
  "sourceRootsPreserved":[],
  "candidatesVerified":[],
  "deletedExactPaths":[],
  "quarantinedExactPaths":[],
  "bytesBeforeAvailable":null,
  "bytesAfterAvailable":null,
  "bytesActuallyFreed":null,
  "servicesHealthy":null,
  "mongodStateVerified":null,
  "mcpRealToolCanaryVerified":null,
  "rollbackVerified":null,
  "status":"NOT_EXECUTED_UNTIL_HOST_READBACK"
}
```

**Nunca declarar limpieza efectuada o GB recuperados por escribir un plan, conceder intención por chat o recibir HTTP 200.**
