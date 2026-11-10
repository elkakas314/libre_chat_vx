# NOSTROMO — auditoría R0 de los dos LibreChat locales

El Lenovo tiene **tres árboles diferentes**, no dos copias intercambiables:
`~/librechat/vx` (NOSTROMO), `~/librechat/upstream` (LibreChat
con overlay pendiente) y `~/upstream` (otro checkout de LibreChat).
La revisión pública SOURCE no sustituye la inspección host-local.

`node scripts/audit-local-librechat.mjs` no escribe en disco,
no lee valores de `.env`, `librechat.yaml`, tokens o credenciales y no
ejecuta npm, GitHub Actions, Docker o servicios. Sólo imprime: Git
HEAD, rama, dirty/untracked limitado, existencia de tipos React y
rutas de instalación, SHA-256 de archivos de código seleccionados
y comparación entre las dos copias LibreChat.

```bash
cd ~/librechat/vx
git pull --ff-only origin main
node --check scripts/audit-local-librechat.mjs
node scripts/audit-local-librechat.mjs
```

El JSON es readback **R0**, no instalación/estado LIVE del agente.
NO copiar `~/upstream/.env`, NO borrar lockfiles, NO ejecutar
`install-as-workspace` o `uninstall-overlay` en árbol dirty.

La auditoría visual detallada está en la rama
`audit/nostromo-visual-and-local-trees-20261110`,
pendiente de pruebas locales. GitHub Actions permanece manual-only.


## Readback material recibido: 2026-11-10T22:43:28.949Z

Fuente: ejecución local del operador de `node scripts/audit-local-librechat.mjs`
después de fast-forward de `9463ff8` a `b0641a221b21d28b523a16bafc51d821e2dc72c4`.
No es un screenshot; es JSON de estado y hashes de archivos seleccionados.
No mide servicios LIVE ni realiza inspección exhaustiva de los 83 untracked.

| Ruta | HEAD | Cambios tracked | Untracked |
| --- | --- | ---: | ---: |
| `~/librechat/vx` | `b0641a221b21` | 0 | 2: dos `package-lock.json` |
| `~/librechat/upstream` | `f10b1d91f1ee` | 3 | 83 (salida truncada) |
| `~/upstream` | `f10b1d91f1ee` | 1 (eliminado `package-lock.json`) | 0 |

En el **upstream interno** hay cambios rastreados en
`client/package.json`, `client/src/components/Chat/Presentation.tsx`
y `package-lock.json`. Además, existen Bridge/CSS, paquete VX,
dist compilado y marcador del overlay, todos **ausentes** en el
upstream externo. En ambos `package.json` raíz coincide por SHA-256,
pero los `client/package.json`, `Presentation.tsx` y ocho rutas
de integración no coinciden o faltan en uno de los árboles.

`~/upstream/.env` está presente (contenido no leído). En el
upstream interno no hay `.env` ni `librechat.yaml`. **No copiar la
configuración externa sin auditoría de propósito y permisos.**

`~/librechat/vx/node_modules/@types/react/index.d.ts` y
`@types/react-dom/index.d.ts` existen; ambos **faltan** bajo
`~/librechat/upstream/node_modules/@types`. La reparación SOURCE
`scripts/stage-react-types.mjs` puede utilizarlos temporalmente en
el staging. Aún falta demostrar un `DIAGNOSE_COMPILE_PASS` local.

**Decisión**: usar `~/librechat/upstream` como candidato exclusivo
de instalación NOSTROMO, conservar `~/upstream` sin tocarlo,
no borrar el trabajo untracked y proteger ambos respaldos.
La PR #31 contiene el ajuste visual de cabina/Tentáculo Hub,
pero sigue SOURCE y sin pruebas locales de su HEAD exacto.

**Siguiente gate** en el Lenovo (sin mutación del paquete instalado):
```bash
cd ~/librechat/vx
npm run nostromo:workspace:test
npm run nostromo:workspace:diagnose
```
Si `DIAGNOSE_COMPILE_PASS` no aparece, corregir error concreto antes
de `--apply`. GitHub Actions sigue manual-only.


## Readback local posterior: 2026-11-10, staging TypeScript PASS

El operador ejecutó en `~/librechat/vx`, después de fast-forward a
`main@efd1a7587a52fca072a51c3fff04d31454da5cc8`:

```text
npm run nostromo:workspace:test
tests 5 · pass 5 · fail 0
npm run nostromo:workspace:diagnose
status: DIAGNOSE_COMPILE_PASS
sourceFiles: 192
existingFiles: 81
changedSources: 136
ui: MATCHED
typeDeclarations.react: VX_FALLBACK_LINKED
typeDeclarations.react-dom: VX_FALLBACK_LINKED
build: PASS
installed: false
existingWorkspaceUnchanged: true
compilerOutput: ""
```

Interpretación: **resuelto el P0 TypeScript del staging en el Lenovo**.
El fallback de declaraciones React funciona en una compilación real,
sin mover el paquete instalado. `installed:false` significa que aún
NO se ha efectuado el cambio de workspace ni el build de frontend.
La presencia previa de `:3080`/:27017 sigue sin acreditarse como
servicio operativo. La PR visual #31 continúa aparte, SOURCE/no instalada.

Siguiente gate permitido: `npm run nostromo:workspace:apply` con
respaldo local `~/nostromo-workspace-backup.*` y readback
`WORKSPACE_RECONCILED`, seguido por compilación frontend del
checkout `~/librechat/upstream` si MemAvailable lo permite.
No copiar `.env` de `~/upstream`, no usar Actions, no reinstalar
ni borrar trabajos locales.
