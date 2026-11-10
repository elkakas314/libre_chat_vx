# NOSTROMO — TS7016 / TS7026 React (Lenovo 2026-11-10)

El operador aportó evidencia del fallo material en `npm run nostromo:workspace:diagnose` sobre `main@9463ff8`: faltan las declaraciones TypeScript de `react` y `react/jsx-runtime` en el contexto del compilador del staging de LibreChat, generando TS7016 y TS7026. El resultado fue `TSC_EXIT=2`. No se sustituyó el paquete existente.

**Reparación SOURCE**: `scripts/stage-react-types.mjs` reutiliza las declaraciones React ya instaladas en `upstream/node_modules/@types`; en su ausencia, puede enlazar temporalmente las de `vx/node_modules/@types` dentro del staging. Los enlaces se retiran tras compilar y el paquete final no contiene symlinks de desarrollo. No ejecuta npm ni cambia root locks o upstream/node_modules.

Si faltan ambas copias, se comunica `REACT_TYPINGS_MISSING`. Instalación mínima propuesta **sólo en VX**, nunca en el upstream dirty:

```sh
cd ~/librechat/vx
npm install --include=dev --ignore-scripts --package-lock=false --no-audit --no-fund --prefer-offline
npm run nostromo:workspace:test
npm run nostromo:workspace:diagnose
```

No repetir `--apply` hasta `DIAGNOSE_COMPILE_PASS`. Si aparecen otros fallos TypeScript, mostrar nuevo error completo y reparar sólo la dependencia ausente.

Se deshabilitó la ejecución automática de los tres workflows GitHub Actions en `main@ddb1f44`; las pruebas deben ejecutarse localmente y registrarse con readback. SIWC ChatGPT permanece `enabled:false` y `provider_binding:UNCONFIGURED` hasta instalar LibreChat y recibir consentimiento OAuth; el token GitHub fine-grained sólo sirve para GitHub.
