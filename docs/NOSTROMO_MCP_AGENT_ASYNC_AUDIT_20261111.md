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
