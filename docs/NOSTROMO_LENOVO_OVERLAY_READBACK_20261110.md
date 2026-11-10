# NOSTROMO — Lenovo: cierre de paquete VX existente (readback 2026-11-10)

## Estado R0 observado en el Lenovo (aportado por el operador)

- \`~/librechat/vx\`: Git \`2abd153\`; dos lockfiles sin seguimiento
  (\`package-lock.json\`, \`deployment/nostromo-mcp/package-lock.json\`).
- MCP local: 19/19 pruebas de código y stdio PASS en el Lenovo;
  todavía no se ha vinculado al agente de LibreChat.
- \`~/librechat/upstream\`: HEAD fijado
  \`f10b1d91f1eee3a2c82d5247bf620351486b7c1b\`.
- Tracked modificados: \`client/package.json\`,
  \`client/src/components/Chat/Presentation.tsx\`,
  \`package-lock.json\`. Árbol \`client/src/components/VX\`
  y \`packages/librechat-vx\` sin seguimiento (instalación parcial).
- Bridge/CSS sincronizados mediante copia acotada y \`cmp\`;
  respaldo de UI en \`/home/elkakas314/nostromo-ui-backup.s5cE3siD\`.
- \`packages/librechat-vx/src\`, \`contracts\`, \`config\` son una
  **versión antigua**, no coinciden con el HEAD VX actual.
- \`~/librechat/upstream/.env\` y \`librechat.yaml\` no existen.
  \`~/upstream/.env\` corresponde a **otro checkout**; no copiar
  automáticamente. \`~/upstream/e2e/lighthouse/librechat.yaml\`
  es una fixture de pruebas, no configuración real de producción.
- \`~/librechat/upstream/node_modules\` existe. El hecho de que
  \`client/node_modules\` no exista no prueba fallo (workspaces npm).
- No hay escucha TCP 3080/27017. Docker CLI existe pero el socket
  \`/var/run/docker.sock\` no está activo. \`mongod\` y \`mongosh\` no
  están en PATH. No inferir que no exista Mongo en otro ámbito.

## Decisión

Reutilizar checkout existente y evitar \`scripts/install-as-workspace.mjs\`
porque exige árbol limpio y puede borrar/sobrescribir código único.
Nunca ejecutar \`scripts/uninstall-overlay.mjs\` sobre árbol dirty:
hace \`git restore\` y borra paquetes/archivos VX.

Añadido \`scripts/reconcile-existing-workspace.mjs\`:
- Por defecto, sólo PREVIEW.
- Comprueba HEAD upstream, identidad del marcador, binding
  Presentation, dependencia declarada, coincidencia exacta Bridge/CSS.
- Bloquea symlinks y fuentes antiguas únicas que no estén en VX.
- Exige \`node_modules/.bin/tsc\` existente.
- En \`--apply\`, crea un directorio temporal privado bajo \`packages\`,
  copia \`package.json,tsconfig.json,src,contracts,config\` desde VX,
  compila el paquete **antes** de cambiar el instalado.
- Conserva el paquete anterior completo por \`rename\` hacia
  \`~/nostromo-workspace-backup.*\` (directorio privado 0700).
- Activa paquete compilado por rename, hace readback de todos los
  archivos fuente, restaura paquete previo si falla la conmutación.
- No toca \`.env\`, \`librechat.yaml\`, \`package-lock.json\`,
  \`Presentation.tsx\`, \`client/package.json\`, Docker ni Mongo.
- No pretende certificar frontend ni servicio. Tras este gate,
  compilar frontend y preparar Mongo/config del mismo checkout.

## Ejecución en Lenovo tras CI y merge (no hacerlo antes)

\`\`\`sh
cd ~/librechat/vx
git pull --ff-only origin main
npm run nostromo:workspace:preview
npm run nostromo:workspace:apply
\`\`\`

Si PREVIEW devuelve \`BLOCKED:UNIQUE_OLD_SOURCE_FILES\`, no continuar:
el operador debe preservar/reconciliar esas rutas con su backup.
\`WORKSPACE_RECONCILED\` con \`build:PASS\` certifica sólo el
paquete dentro de upstream, no frontend ni backend ni agente.

## Rollback reversible

El receipt de \`--apply\` imprime \`backup\` y no borra el paquete
original. Con LibreChat parado, preservar también el paquete nuevo y
restaurar el antiguo por rename con ese backup concreto y HEAD
verificado, sin \`git clean/reset\` ni borrados masivos. El paquete
anterior puede contener trabajo único: no eliminar backup sin auditoría.

## Gates siguientes

1. Compilar frontend con \`npm run frontend:ci\` contra el mismo
   upstream y comprobar navegación; medir consumo real del Lenovo.
2. Inspeccionar qué servicios de MongoDB están disponibles; elegir
   un solo motor local y evitar Docker si no hace falta.
3. Crear \`librechat.yaml\` y \`.env\` desde plantilla adecuada sólo
   después de inspección sin divulgar secretos; nunca importar
   \`~/upstream/.env\` a ciegas.
4. Lanzar :3080 y comprobar login/health; habilitar un agente nativo,
   conectar un solo MCP stdio; prueba R0 bajo root real.
5. Router gratuito disponible LIVE y SIWC ChatGPT cuando exista
   consentimiento OAuth real; voz y Tentáculo Hub bajo prueba visual.

## 2026-11-10 — Lenovo: bloqueo de compilación (observado)

El operador ejecutó `main@7e33c58` y obtuvo `PREVIEW_ONLY`:
`sourceFiles=192`, `existingFiles=81`, `changedSources=136`,
`ui=MATCHED`, upstream `f10b1d91...`. `--apply` falló **antes
 de mover el paquete existente**, al ejecutar
`upstream/node_modules/.bin/tsc -p tsconfig.json` sobre staging.
El script antiguo descartaba `stdout/stderr` del compilador y sólo
mostraba `Command failed`. Por tanto **la causa raíz no se conoce**:
pueden faltar dependencias/typings host-locales o existir una diferencia
real entre la instalación y el runner limpio de CI. No declararla.

Reparación instrumental: `npm run nostromo:workspace:diagnose` compila
una copia de staging, captura hasta 16 KiB de errores TypeScript
(reduciendo tokens evidentes) y **elimina el staging al terminar**.
No conmuta el paquete ni modifica servicios; no exige repetir
`--apply` hasta conocer el diagnóstico. `--apply` también imprime
el mismo diagnóstico en caso de error.

Comando de siguiente lectura al integrar esta revisión:

```sh
cd ~/librechat/vx
git pull --ff-only origin main
npm run nostromo:workspace:diagnose
```

Si devuelve `TSC_BUILD_FAILED`, leer las líneas entre
`NOSTROMO_TSC_DIAGNOSTICS_BEGIN/END` y reparar la dependencia
concreta sin borrar node_modules, package-lock ni árboles ajenos.
Sólo entonces repetir `npm run nostromo:workspace:apply`.

## 2026-11-10 — incidente de diagnósticos: selector inalcanzable

Readback Lenovo tras `94d72cd`: `npm run nostromo:workspace:diagnose`
devolvió `PREVIEW_ONLY` con `readOnly:false` (192 archivos nuevos,
81 antiguos, 136 cambios) **sin invocar TypeScript**.

Causa raíz SOURCE: el guard `if(!APPLY)` terminaba el proceso
antes de llegar a `if(DIAGNOSE)`; el modo diagnóstico jamás
compilaba. Se corrige a `if(!APPLY && !DIAGNOSE)`.
Nueva aceptación CI: salida `DIAGNOSE_COMPILE_PASS` y
`existingWorkspaceUnchanged:true` obligatorias en la misma revisión.
Si el Lenovo muestra `TSC_BUILD_FAILED`, capturar diagnósticos y
corregir únicamente entonces; no repetir reinstalación.

El campo `readOnly:false` en `--diagnose` significa que sí crea
y borra staging temporal, **no** que reemplace el paquete VX
ni modifique servicios.
