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
