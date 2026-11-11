# NOSTROMO — restauración protegida de herramientas de desarrollo (2026-11-11)

## Evidencia previa real

Readback Lenovo de `npm run nostromo:frontend:deps:test` y
`npm run nostromo:frontend:deps:inspect` sobre PR #33:
1/1 PASS; upstream `~/librechat/upstream` pinned
`f10b1d91f1eee3a2c82d5247bf620351486b7c1b`,
dirtyEntryCount=6, lock SHA-256
`e7119c0eecd9c97048c7fb838a9f8cb0cb620bed99b7488886743e9bbe14d5f5`.
Faltan `rimraf`, `tsdown`, `vite`; existe `tsc`.
PR #33 fusionada como `00892423...`. MCP v0.3 28/28 PASS
en `main` y VX workspace reconciliado con backup. No frontend LIVE.

## Superficie nueva

`npm run nostromo:frontend:deps:repair`: **PREVIEW R0**,
no invoca npm install; comprueba identidad, lock SHA, herramientas,
versión npm y recursos. No modifica ninguna ruta.

`npm run nostromo:frontend:deps:repair -- --apply`: operación explícita
de escritura al directorio `~/librechat/upstream/node_modules`,
protegida por:
- sólo ruta canónica, Git HEAD exacto y SHA del lockfile observado;
- no acepta manifests/lockfile simbólicos, ni carpetas node_modules
  simbólicas del upstream;
- requiere npm 11, espacio libre >=3 GiB y MemAvailable >=2 GiB;
- hace simulación `npm install --dry-run` primero;
- guarda copia privada de package.json, package-lock.json,
  client/package.json y packages/data-provider/package.json;
- ejecuta `npm install --no-save --include=dev --ignore-scripts
  --no-audit --no-fund --prefer-offline --progress=false` con
  capacidad de RAM de Node limitada y pocas conexiones npm;
- evita transmitir secretos del entorno y no llama GitHub Actions;
- verifica SHA original de los manifiestos y presencia de los cuatro
  ejecutables al finalizar, con resultado tipado. No compila ni
  arranca LibreChat o MCP.

**LÍMITE:** npm install puede instalar, modificar o podar paquetes
dentro de `node_modules`; la copia sólo protege manifests/lockfile,
no respalda el árbol completo de dependencias. No es una operación
puramente R0 ni ofrece rollback completo de node_modules. En caso
de error se detiene, conserva el backup, **no ejecuta --force, npm ci,
git clean, git reset, desinstalación ni reintento automático**.
`--ignore-scripts` puede dejar dependencias con postinstall nativo
pendientes: deberán resolverse individualmente tras readback.

## Aceptación

1. Prueba fixture `npm run nostromo:frontend:deps:repair:test` PASS.
2. Preview documenta 3 ejecutables ausentes, lock SHA esperado.
3. Aplicación sólo si los recursos autorizan, sin cambios de manifests
   ni lockfile. Releer `npm run nostromo:frontend:deps:inspect`.
4. Con dependencias listas, compilar LibreChat `npm run frontend:ci`
   bajo límites de RAM; no afirmar READY sólo por binarios.
5. Configurar un único MCP stdio y el agente nativo después de que
   frontend/backend estén LIVE y sus ACL verificadas.
6. Nunca importar la `.env` de `~/upstream` sin revisión del operador.

## Clasificación

Reparador SOURCE pendiente de pruebas reales en host al publicarse.
El operador ya ha verificado 1/1 del auditor y 28/28 del MCP,
no este nuevo aplicador. El repositorio `elkakas314/libre_chat_vx`
permanece independiente de MANOJOS3, VX13 y ORÁCULO.


## Endurecimiento posterior: auditoría DeepSeek M1–M3

La propuesta externa fue revisada en `docs/NOSTROMO_DEEPSEEK_M1_M2_M3_REVIEW_20261111.md`.
No ejecutar el código externo sin cambios: su `PREFLIGHT_PASS`
requiere binarios que precisamente faltan, el fallback `vite@^5`
no concuerda con LibreChat v0.8.8 (`^8.2.2`), y el rollback sólo
repone manifests aunque npm puede modificar `node_modules`.

Esta PR incorpora un gate adicional **antes de --apply**:
`npm install --dry-run --json` debe producir un objeto legible con
conteos `added/removed/changed`; se deniega automáticamente si
`removed>0` o `changed>0`, o si faltan datos. Este gate está
implementado en `scripts/librechat-npm-dry-run-guard.mjs` y
tiene pruebas negativas. Una simulación sin cambios planeados es sólo
evidencia de bajo riesgo, NO garantía de que la ejecución real sea
reversible. Mantener --apply desactivado hasta obtener receipt local.


## Actualización 2026-11-11 — npm real del Lenovo y gate previo

Readback operador de la revisión anterior de esta PR: `repair:test` **5/5 PASS**,
`repair` en modo PREVIEW, `mutated:false`, upstream HEAD
`f10b1d91...`, lock SHA exacto `e7119c0e...d5f5`,
faltantes `rimraf/tsdown/vite`, `tsc` presente,
`npmVersion:10.9.8`, recursos reportados:
13.16 GB MemAvailable y ~774 GB disco. Main restaurado.

**Nuevo diagnóstico: CONFIG_GAP**. El `packageManager` del upstream
fijado declara `npm@11.13.0`; el host usa npm 10.9.8. No se retira
silenciosamente la protección: `librechat-frontend-npm-gate.mjs`
clasifica compatibilidad del major y `lockfileVersion`. Preview de
revisión nueva devuelve `PREVIEW_CONFIG_GAP` en caso de incompatibilidad.
El aplicador deniega `--apply` hasta reconciliar el gestor npm y
comprobar el formato real del lockfile. Pruebas negativas de este gate
incluidas en el script `nostromo:frontend:deps:repair:test`.

La solución futura preferida no debe reemplazar npm global de Lenovo ni
construir otro servicio. Verificar versión de Node y escoger npm 11
compatible, acotado al proceso y revisado contra `packageManager`/lock.
No lanzar npm install, dry-run con efectos o frontend build mientras el
gate permanezca bloqueado. Sin GitHub Actions.


## Runtime aislado npm 11.13.0 — implementación SOURCE

Para no sustituir npm 10 global del Lenovo se ha añadido
`scripts/stage-isolated-npm11.mjs`, con vista PREVIEW y operación
`--apply` explícita. Cuando se habilite, sólo instala
`npm@11.13.0` bajo
`~/.local/share/nostromo/tools/npm-11.13.0` utilizando un
staging temporal privado y comprobando
`node <staging>/node_modules/npm/bin/npm-cli.js --version`
antes de promocionar. Deniega destino ya ocupado (también enlace
simbólico colgante), permisos inseguros o recursos insuficientes.
No toca `~/librechat/upstream`, `~/upstream` ni npm global.

El reparador reconoce automáticamente este CLI aislado si existe
en la ruta canónica, valida su `--version` contra el
`packageManager: npm@11.13.0` del upstream y sigue
exigiendo `lockfileVersion:3`, SHA del lockfile exacto,
guardia RAM/disco, simulación JSON que no elimine ni cambie
paquetes existentes, backup y readback. Si no está instalado el
CLI aislado, conserva la denegación del npm10 del host.

Comandos de **solo lectura** para comprobar la revisión SOURCE:

```sh
npm run nostromo:frontend:deps:repair:test
npm run nostromo:runtime:npm11:test
npm run nostromo:runtime:npm11:preview
npm run nostromo:frontend:deps:repair
```

Las fases de escritura `nostromo:runtime:npm11:stage` y
`nostromo:frontend:deps:repair -- --apply` NO están autorizadas
por una prueba SOURCE. Exigen readback local y operación
explícita, con recepción del receipt. Ninguna instalación global,
ni GitHub Actions ni manipulación de secrets.
