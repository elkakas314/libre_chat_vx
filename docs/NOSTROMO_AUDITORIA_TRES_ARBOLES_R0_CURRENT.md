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
