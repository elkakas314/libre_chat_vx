# NOSTROMO E2 — Integración temporal #38–#42 y backup descriptor-fd

**LOT_ID:** `E2-NOSTROMO-PR38-42-FD-QA-20261111`  
**BASE_HEAD:** `director/nostromo-critical-path-20261111@c11af334ccfce8b7dd4b5be8dece44768b9999d2` (readback `identical`, 0/0).  
**E2_HEAD:** rama CANDIDATA `e2/nostromo-integration-qa-38-42-20261111` (consultar HEAD de PR adjunto).  
**Ámbito:** sólo GitHub y copia de pruebas aislada; no Lenovo ni recursos privados.

## Montaje real del candidato

Se creó una rama nueva **a partir del HEAD exacto del Director**.
Se trasladó el contenido Git exacto de los 23 archivos de PR #38–#42,
uno a uno desde cada rama original, preservando todos los SOURCE previos,
sin merges, sin alterar ninguna de las cinco ramas originales y sin
tocar `main` ni `integration`.

- PR #38: **6/6** blobs idénticos al PR.
- PR #39: **4/4** blobs idénticos.
- PR #40: **3/3** blobs idénticos.
- PR #41: **7/7** blobs idénticos.
- PR #42: **2/3** blobs idénticos; excepción intencional:
  `scripts/nostromo-backup-audit-r0.py`, reforzado en **este
  candidato únicamente**.
- Total: **23 rutas aportadas, cero colisiones de ruta**; un nuevo
  test de carreras `scripts/tests/test_nostromo_backup_fd_races_r0.py`
  completa **24 rutas cambiadas frente al Director**.

La ausencia de colisiones no prueba ejecución conjunta de LibreChat.
El candidato tiene historia lineal de copia de archivos (NO merge de PR)
y es **DRAFT, no listo para integrar**.

## Hardening R0: cierre del gap estático TOCTOU de backup scanner

En la copia del auditor procedente de #42 se sustituyó el recorrido
basado en `os.walk`/rutas resolubles por **descriptores anclados**:

- `open_dir`: desde `/`, cada componente mediante
  `os.open(..., dir_fd=fd, O_DIRECTORY|O_NOFOLLOW)`.
- `_snapshot_fd`: `os.scandir(fd)` y
  `os.stat(name, dir_fd=fd, follow_symlinks=False)`; cada hijo directorio
  se abre igualmente con `O_DIRECTORY|O_NOFOLLOW`, contrastando
  `fstat` con la identidad observada.
- `_hash_relative`: archivo abierto con `O_NOFOLLOW` y su cadena
  de padres mediante `dir_fd` desde la **misma raíz fija** del
  inventario; compara `fstat` antes/después y respeta presupuesto.
- `audit_dir`: conserva un **root_fd** durante los dos snapshots y
  todos los hashes. Si hay symlinks, sustituciones o discrepancia de
  árbol/raíz, devuelve `UNKNOWN_PRESERVE`, nunca autorización de
  borrado, cuarentena ni restauración. Los nombres sensibles no se leen.
- Se conserva interfaz `snapshot`/ `hash_file` y el hook de
  `snapshot` con tercer argumento **posicional** para compatibilidad
  con la suite original de #42.

**Límites:** prueba de protección frente a los escenarios ensayados de
intercambio con symlink; no certificación formal contra todas las
carreras de FS, cambios hostiles en un bind mount, hardlinks externos,
nodos especiales ni escáner productivo de backups del usuario. Sigue R0.

## QA ejecutada sobre ficheros físicos y bytes exactos de GitHub

**Fixture Linux temporal:** `/mnt/data/nostromo_fd_qa`,
Python 3.13.5, Node 22.16.0, TypeScript global 5.8.3, **no Lenovo**.

| Componente | Comando/alcance | Resultado |
|---|---|---|
| Backup R0 original de #42 + carrera nueva | `PYTHONDONTWRITEBYTECODE=1 python3 -B -m unittest discover -s scripts/tests -p 'test_nostromo_backup_*.py' -v` | **12/12 PASS**, 9 originales y 3 de carrera |
| Carreras | intercambio hijo por symlink después de snapshot; root reemplazada tras abrirla; hijo sustituido antes de abrir | **3/3 PASS**, cero lectura del **inodo externo** |
| Móvil M5 | `node --experimental-strip-types --test scripts/tests/nostromo-m5-mobile-auth.test.mjs` | **5/5 PASS** |
| TypeScript focal M5 | `tsc --noEmit --strict --target ES2022 --module CommonJS src/mobile/mobileContinuity.ts` | **PASS** |
| M3 contrato | 3 callbacks del test original sobre contenido exacto de GitHub evaluados en JS V8 | **3/3 PASS** SOURCE (no `node --test`) |
| M4 contrato | 5 callbacks del test original sobre contenido exacto de GitHub evaluados en JS V8 | **5/5 PASS** SOURCE (no `node --test`) |

**Conteo nuevo:** 12 Python + 5 Node + 8 callbacks JS = **25 PASS**
de alcance diferenciado; un `tsc` focal PASS separado.

**Blobs del candidato materializados y verificados con `git hash-object`:**
- Backup R0 descriptor-fd: `29cff6f51c3f1f1dc5f1ed51afc9992228e92422`.
- Test #42 original intacto: `3fc2e6ff6b03609605bce0e3f6d71ef770079bad`.
- Nuevo test carreras: `4f1458c9cb83b1fc62956a4e7061f82bf1bf21f5`.
- Móvil source: `0913734e311fca3f393797fcee3f6aa46ee83c67`.
- Móvil test: `04937542f88f2b8fded988f86810c270384a1eb9`.
- M3/M4 y restantes blobs: readback por `fetch_file` en cada rama
  y candidata, todos coincidentes donde no hubo mejora explícita.

**QA no ejecutable en este runtime:** no existe checkout físico completo
de la repo privada en el contenedor. `git ls-remote` falla por
`Could not resolve host: github.com`; no se pueden materializar
el árbol completo ni sus `node_modules` mediante Git. Por tanto
`npm run nostromo:qa:diagnostics`, `npm run build`, React/frontend
upstream, las pruebas nativas Node M3/M4 y toda la suite integral:
**NOT_RUN / UNAVAILABLE_DEPENDENCIES**, nunca PASS.
El workflow existente `.github/workflows/source-check.yml`
se dispara sólo por `workflow_dispatch`; la creación de este PR
NO lo ejecuta. No crear un workflow automático alternativo sólo
para eludir esas restricciones. MCP SDK real permanece
`MODULE_NOT_FOUND`/`EAI_AGAIN`, **handshake SKIP**.

## Regresión e integración: veredicto

- **SOURCE:** integración de archivos consistente, sin rutas duplicadas,
  sin nuevo Kernel/MCP/backend, y componentes ejecutables locales
  con pruebas focalizadas PASS.
- **QA global:** incompleta, el código compilado e instalado no está
  certificado; NO se ha observado el bridge visual con React,
  backend/Mongo, agentes/modelos, Tailscale/HTTPS, móvil real ni
  recuperación tras reinicio.
- **RIESGO:** el nuevo scanner guarda FDs durante el inventario,
  pero requiere revisión independiente de ownership/rutas/bind mounts
  y recursos antes de uso material en Lenovo.
- **HOST_RECEIPTS:** `NONE`. `CONFIG_GAP / EXECUTION_ROUTING_MISMATCH`.
  `~/upstream`, los cuatro backups y `.env` intactos.
- **ROLLBACK:** cerrar el PR DRAFT/candidato o revertir exclusivamente
  sus commits; no se alteraron refs de #38–#42 ni Director/main/integration.
- **NEXT_ACTION:** Director revisa exact HEAD y diff del candidato,
  ejecuta en checkout desechable real
  `npm run nostromo:qa:diagnostics`, tests FD R0 y
  `npm run build` con dependencias válidas; registrar fallos y
  reparar en nueva revisión **sin fusionar todavía**.
  La secuencia de host NOSTROMO tipada sigue pendiente:
  `nostromo:local:audit → nostromo:third-upstream:extract →
  nostromo:third-upstream:gate → nostromo:backend:preflight →
  nostromo:backend:decision`.

**ESTADO:** `SOURCE_QA_PARTIAL_PASS / GITHUB_VERIFIED / HOST_UNVERIFIED`.
