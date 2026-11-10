# NOSTROMO — dependencias frontend LibreChat (11 nov 2026)

## Evidencia material (Lenovo)

- NOSTROMO VX instalado en `~/librechat/upstream/packages/librechat-vx` con `WORKSPACE_RECONCILED`, `build:PASS` y respaldo `~/nostromo-workspace-backup.2jGTrK`.
- Frontend `npm run frontend:ci` del upstream fijado `f10b1d91f1eee...` se interrumpió antes de compilar la aplicación: `packages/data-provider` → `npm run clean` → `rimraf dist` → `sh: rimraf: not found` (código 127).
- El manifiesto exacto `LibreChat@v0.8.8` declara `rimraf:^6.1.3` y `tsdown:^0.22.2` como devDependencies de `packages/data-provider`; no hay prueba de que toda la instalación de dependencias del frontend esté completa.
- El upstream de NOSTROMO tiene modificaciones en `client/package.json`, `Presentation.tsx`, `package-lock.json` y archivos VX sin seguimiento. **No usar `npm ci`, `git reset --hard`, `git clean` ni reinstalador overlay** a ciegas; preservar estado material.
- El MCP asíncrono v0.3 está probado 28/28 en `main@2b3c9bf`; esto es independiente del frontend y no demuestra agente LIVE.

## Comprobación segura preparada

Ejecutar desde `~/librechat/vx` tras actualizar GitHub mediante fast-forward:

```bash
npm run nostromo:frontend:deps:inspect
npm run nostromo:frontend:deps:test
```

`scripts/inspect-librechat-frontend-deps.mjs` es R0 y no invoca npm:
comprueba upstream HEAD, presencia/huella del lockfile, metadatos públicos de manifests
y ejecutables `rimraf`, `tsdown`, `tsc`, `vite` en node_modules del workspace.
No lee `.env`, no instala, no inicia servicios ni usa GitHub Actions.

## Decisión siguiente

- Si el reporte dice `DEPENDENCIES_INCOMPLETE`, conservar el lockfile y las modificaciones únicas, investigar la ausencia de bins y preparar una instalación incremental acorde con el lock exacto. No descargar ni reemplazar todo `node_modules` sin preflight.
- Si los bins aparecen, reintentar `frontend:ci` con RAM disponible y límites; evitar carga paralela con MANOJOS3.
- Sólo tras frontend y backend LIVE, configurar entrada del único MCP en `librechat.yaml`, validar namespace/UID/ACL y registrar agente mediante Agent Builder.
- El fragmento de MCP sigue `NOSTROMO_MCP_ENABLED: '0'`: no implica MCP conectado por instalar VX.
