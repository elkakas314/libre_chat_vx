# E2 NOSTROMO — M5 SOURCE móvil, recuperación y recursos
**LOT_ID:** `E2-NOSTROMO-M5-SOURCE-20261111`  
**BASE_HEAD:** `director/nostromo-critical-path-20261111@c11af334ccfce8b7dd4b5be8dece44768b9999d2`  
**ISSUE:** #37 · **Rama:** `e2/nostromo-m5-mobile-recovery-source-20261111`

## Revisión independiente M4 — no duplicada

- `PR #40` HEAD `7921fc6d3bd9da8df9a3a959dcb5f989c5167c10`,
  base Director inalterada. Diff leído completo: tres cambios de **copy**
  en `overlay/upstream/VXCockpitBridge.tsx`, un test de cinco contratos
  y un handoff; sin nuevas herramientas, permisos, backend o mutaciones.
- Director #6805685995 ejecutó **Node test 5/5 PASS** desde blobs GitHub.
  Revisión no detectó defecto verificable adicional en este lote: PR #40
  permanece DRAFT y sin overlay apply.

## Inventario y dependencias M5 SOURCE (no servicios LIVE)

| Frente | SOURCE existente leído | Dictamen |
|---|---|---|
| PWA/móvil | `scripts/audit-nostromo-mobile-readiness.mjs` + test | R0, presencia de build ≠ PWA instalada; se endurece padre symlink |
| Continuidad | `src/mobile/mobileContinuity.ts`, `src/mobile/mobileRecovery.ts`, `config/mobile_recovery.current.json` | Un único backend/historial; no offline outbox ni replay; se exige autenticación explícita antes de `INTERACTIVE` |
| Upstream | LibreChat pin `f10b1d91f1eee3a2c82d5247bf620351486b7c1b`, `useResumeOnLoad` / `useResumableSSE` documentados | Reutilizar UI resume existente; streams no conceden ejecución ni autentican objetivos |
| HTTPS privado | `deployment/parallel-transport/tailscale-serve.librechat-vx.md`, `canaries/tailscale-mobile-live/` | Plantilla Serve -> `127.0.0.1:3080`, Funnel OFF; canario 00 SOURCE y 01–04 con readbacks privados externos; gate OPEN |
| Recuperación | `canaries/recovery-live/` | 00 solo SOURCE, 01/02 R0, 03 restart R2 opt-in y ventana/SSH externo, 04 evidencia fresca; sin unidad systemd acreditada |
| Backups | `scripts/nostromo-backup-audit-r0.py` + tests | Cuatro backups históricos en `DEFAULT_BACKUPS`, sin purga ni cuarentena automáticas; NO inspeccionados en host |
| Recursos | `canaries/low-power-measure/` | CPU/RAM/disco/red escenario host, gate humano; sin mediciones Lenovo ni arranque autorizado |

**Fronteras:** no instalar PWA, Tailscale Serve, Mongo, MCP ni servicio;
no editar .env, tokens, configuración privada, backups ni checkout tercero.
No presupone nombre de unidad ni credenciales. La autenticación/sesión real
y continuidad de servidor/historial siguen `HOST_UNVERIFIED`.

## Defectos SOURCE corregidos

1. **Symlink padre PWA:** antes el preflight sólo ejecutaba `lstat`
   de archivos finales, pudiendo leer un `manifest.webmanifest` externo
   si `client/`, `dist/` o la raíz eran enlaces simbólicos.
   `realDirectory()` inspecciona con `lstat` cada ancestro desde `/`;
   un ancestro symlink, no directorio o no disponible produce
   `pwa.pathScopeSafe=false` + `PWA_BUILD_INCOMPLETE`, sin leer
   manifiesto. También protege el sondeo de **existencia solamente** de
   `~/upstream/.env`. La herramienta sigue `readOnly:true` y
   `mutations:0`, no imprime valores de archivos externos.
   *Límite:* esta comprobación es SOURCE estática, no una garantía frente
   a cambios concurrentes de directorios entre `lstat` y `readFileSync`.
   No autoriza instalar o mover artefactos.
2. **Interactividad sin autenticación:** `mobileLibreChatState`
   devolvía `INTERACTIVE` con `backendReachable=true` y snapshot fresco
   aunque la sesión estuviera ausente. Ahora requiere
   `authenticated===true` explícito; dato ausente/false ⇒
   `UNAVAILABLE`. No altera `OFFLINE_READONLY` para snapshots locales
   ni el plan `UNKNOWN_OUTCOME`/no replay. Documentado en
   `docs/MOBILE_RECOVERY_CURRENT.md`.

## Pruebas reales en copia aislada de los SOURCE exactos

Entorno de prueba `/mnt/data/nostromo_e2_m5_src`, **NO Lenovo**,
Node v22.16.0; sin npm install ni navegación web.

```bash
node --test scripts/tests/nostromo-mobile-readiness.test.mjs
# 4/4 PASS: faltante; built-not-installed; client padre symlink
# no lectura/alteración del externo; dist/root/fichero symlink.
node --experimental-strip-types --test scripts/tests/nostromo-m5-mobile-auth.test.mjs
# 5/5 PASS: autenticación ausente/false; sesión true; stale;
# backend down; offline snapshot.
```

**TOTAL M5 9/9 PASS, 0 FAIL** en fichero físico temporal. El código
y sus pruebas publicados en GitHub se contrastan mediante SHA de blob Git:

- Preflight móvil `a1c55b0be63f2c5ab1731fe9cf659ea07fd0c188`.
- Test preflight `367eeed915b1284a4f449d2921a441aafe53b130`.
- Mobile continuity `0913734e311fca3f393797fcee3f6aa46ee83c67`.
- Test autenticación `04937542f88f2b8fded988f86810c270384a1eb9`.

Los dos archivos modificados fueron primero materializados **byte a byte**
desde GitHub: hashes previos `5a376225060c548ce39195efb0df360b32d642d6`
y `63b8fbd104dde4fdab3a7549060a307296b9a58b`.
No se han ejecutado aquí los canarios host 01–04, reinicios, benchmarks,
HTTP autenticado, restore ni tests React/E2E; son gates separados.

## Gaps / next action

- `CONFIG_GAP / EXECUTION_ROUTING_MISMATCH` de Lenovo permanece. Sin
  acceso host ni readback N-B0, rutas reales y ocho referencias privadas.
- M3 SDK sigue `EAI_AGAIN`/SKIP, no repetir instalación idéntica sin
  condiciones nuevas.
- Antes de LIVE: identificar y auditar unidad dedicada LibreChat, backend
  y Mongo persistentes, autenticación, herramientas MCP reales, Tailscale
  Serve/ACL, PWA/HTTPS desde dispositivo externo, continuidad entre redes,
  SSH fuera de banda y restauración/rollback con backup verificado.
- Secuencia local admitida cuando exista transporte NOSTROMO tipado:
  `nostromo:local:audit` → `nostromo:third-upstream:extract` →
  `nostromo:third-upstream:gate` → `nostromo:backend:preflight` →
  `nostromo:backend:decision`. Guardar receipts privados en
  `~/librechat/nostromo/reports/` y nunca publicarlos en GitHub.
- Próxima tarea SOURCE independiente: **matriz de compatibilidad de PR
  #38–#41** (archivos/dependencias/orden), sin mezclarlos ni fusionarlos;
  después test de invariantes de reinicio y backup sólo con fixtures
  acotados si el checkout está disponible.

**ROLLBACK:** cerrar este PR DRAFT o revertir sólo commits de esta rama;
no hubo efectos en host, configuración privada ni otros PR.
**ESTADO:** `M5_SOURCE_TESTED / GITHUB_READBACK_VERIFIED / HOST_UNVERIFIED`.
