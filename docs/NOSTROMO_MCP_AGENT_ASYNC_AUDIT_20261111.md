# NOSTROMO — auditoría MCP, agente y CLI asíncrono (11 noviembre 2026)

## Evidencia y estado

- Agente nativo: agents/nostromo-autonomo/agent.candidate.json sigue enabled:false/model:null. SOURCE, no instalado en LibreChat.
- MCP: deployment/nostromo-mcp/server.mjs ofrece protocolo stdio y herramientas CLI. La prueba anterior 19/19 PASS era local del servidor, no conversación del agente en LibreChat.
- Terminal: policy.mjs valida comando/cwd/límites y distingue R0/R2 con permiso físico de un solo uso. exitCode no es verificación del efecto.
- Antes de esta rama nostromo_terminal_ejecutar aguardaba al cierre del proceso hasta 120 s; no había jobId, cancelación desde el agente, ni consulta de salida intermedia.
- El Lenovo instaló el paquete VX con WORKSPACE_RECONCILED y respaldo /home/elkakas314/nostromo-workspace-backup.2jGTrK. Frontend sigue bloqueado en data-provider por rimraf no encontrado. Backend, agente y MCP LibreChat no verificados.
- ChatGPT OAuth SIWC: módulos de origen, sin consentimiento ni enlace LIVE. No confundir con la autorización del CLI.

## Desarrollo de esta rama (SOURCE sin pruebas locales todavía)

- Un solo proceso MCP stdio. No se añade Worker, daemon, HTTP ni base de datos.
- nostromo_terminal_preparar: requestHash exacto, alcance y clasificación R0/R2.
- nostromo_tarea_iniciar: devuelve RUNNING + jobId UUID, sin esperar al fin del proceso.
- nostromo_tarea_estado: sondea estado y stdout/stderr parciales acotados; al terminar entrega exitCode, executionId y resultado. materialVerified:false.
- nostromo_tarea_cancelar: solicita terminar el grupo de procesos. CANCEL_REQUESTED no certifica rollback; R2 exige readback independiente.
- Un trabajo simultáneo por proceso; BUSY en vez de cola oculta; límite 120 s, historial hasta 24 tareas y 15 minutos. No sobreviven a reinicio del MCP.
- La activación requiere trío completo iniciar/estado/cancelar en NOSTROMO_TOOL_SET. El modo directo y el asíncrono son excluyentes.
- NOSTROMO_MCP_ENABLED=0 continúa bloqueando ejecución y lectura. Los valores de configuración y el agente siguen desactivados por defecto.

## Gates de aceptación sin GitHub Actions

1. Ejecutar en el Lenovo: npm --prefix deployment/nostromo-mcp run check.
2. Confirmar PASS en tests de Node para R0, R2 rechazado, timeout, cancelación real, salida parcial, concurrencia y ciclo MCP stdio.
3. Inspeccionar la configuración de LibreChat y las ACL del UID antes de habilitar cualquier herramienta o modelo.
4. Registrar el agente en LibreChat y verificar una llamada real por stdio con stdout, stderr, exitCode y readback.
5. Mantener aprobación R2 física separada de OAuth ChatGPT.

## Limitaciones

Este mecanismo no es autonomía persistente ni tareas reanudables. Una caída/reinicio elimina los jobId del proceso y puede dejar efectos materiales desconocidos. Para reanudación real hacen falta journal durable, leases/fences, idempotencia, recuperación y pruebas independientes; no afirmar PASS por SOURCE.

## Endurecimiento Git R0 del CLI

La política del mismo ejecutor añade GIT_OPTIONAL_LOCKS=0 para evitar escrituras oportunistas en el índice, desactiva fsmonitor, omite configuración Git global y usa diff --no-ext-diff. Evita un driver externo en un comando clasificado R0. No sustituye una sandbox de sistema operativo ni demuestra ausencia absoluta de efectos secundarios.

## 2026-11-11 — receipt de pruebas reales Lenovo, cierre PR #32

- SOURCE probado: `de2fa39ef79317d1a9cb23240b08b9d92ff9185f` en checkout temporal `--detach`; el operador confirmó volver a rama `main` intacta.
- Comando ejecutado en el Lenovo: `npm --prefix deployment/nostromo-mcp run check`.
- Pruebas Node: 28 / 28 PASS, 0 FAIL, 0 SKIP. `node --check` de server, policy y async-jobs completado.
- Evidencia incluye R0 `pwd` por MCP stdio, sondeo asíncrono por `jobId` y resultado EXIT_0; R2 denegado, test real de cancelación y TIMEOUT; admisión R2 en carrera bloqueada.
- PR #32 fusionada con comprobación SHA exacta en `main@c78ffab32d57c3dbd2a03f835521554312981a23`. Lectura posterior confirma MCP v0.3 en `main`.
- GitHub Actions **NO ejecutados**; workflows mantienen disparador exclusivamente manual.
- Estado de instalación: `SOURCE+TEST VERIFIED` para el MCP, **no** `AGENT LIVE` ni `MCP BOUND` en LibreChat. Fragmento `librechat-mcp.fragment.yaml` permanece con `NOSTROMO_MCP_ENABLED: '0'`.
- Próximo gate material: actualizar únicamente `~/librechat/vx` con `git pull --ff-only origin main`, repetir `npm --prefix deployment/nostromo-mcp run check` en main, inspeccionar el backend y configurar UN único MCP stdio en LibreChat sólo tras backup/ACL. No importar `.env` de `~/upstream` sin revisión.
- Bloqueo independiente: `npm run frontend:ci` del checkout `~/librechat/upstream` falló en `packages/data-provider` con `rimraf: not found`; falta instalar o reconciliar las dependencias de desarrollo preservando lockfile, y verificar luego puerto 3080/agent.


## 2026-11-11 — segundo readback de Lenovo, instalado en rama main

- Fast-forward de `~/librechat/vx` desde `f7cab1d` hasta `main@2b3c9bfc8ea8b1f3abcd3bb347a622b982e6707a` observado en la salida de consola del operador.
- Ejecución en la **rama principal** de `npm --prefix deployment/nostromo-mcp run check`: **28 pruebas / 28 PASS, 0 fallos, 0 omitidas**; duración de suite aproximadamente 1,69 s.
- Incluye ejecución real R0, MCP stdio con jobId/consulta/resultado, rechazo R2 sin grant, cancelación de proceso real, timeout, exclusión de concurrencia y protección de ámbito. El code check de tres scripts completó sin error.
- Esto confirma **MCP local v0.3 SOURCE+LOCAL_TEST_VERIFIED** y `main` actualizado en el Lenovo. No confirma que el backend de LibreChat haya registrado el MCP ni agente activado: siguen `NOT_CONFIGURED/NOT_LIVE_VERIFIED`.
- Bloqueo siguiente independiente: `frontend:ci` del upstream principal sigue fallando por binario `rimraf` ausente en `data-provider`; inspección R0 de dependencias preparada en rama de corrección. GitHub Actions no utilizados.
