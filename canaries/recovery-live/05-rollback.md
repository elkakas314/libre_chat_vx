# LC-RECOVERY-LIVE — procedimiento de rollback (no ejecutable)

1. **Responsable:** operador con Tailscale SSH probado desde un cliente independiente. No usar ni modificar MANOJOS3, otros servicios systemd, túneles, ACL, tailnet global ni conexiones MCP.
2. **Antes de reiniciar:** conservar estado de la unidad LibreChat dedicada, snapshot de su configuración y proceso, evidencia Tailscale/SSH, y registros de trabajos/efectos. No almacenar secretos ni IDs reales en el repositorio.
3. **Si falla el reinicio:** mantener la sesión de recuperación SSH; inspeccionar manualmente `systemctl status --no-pager --lines=0 <UNIDAD_LIBRECHAT>` y el journal de **esa unidad solamente**, bajo autorización del propietario. No ejecutar una segunda orden de restart desde el canario.
4. **Recuperación manual autorizada:** confirmar primero el estado final de la orden anterior. Si es seguro y el responsable lo aprueba, restaurar solo la unidad/configuración de LibreChat desde el snapshot previo, sin reset general, sin `killall` y sin reinicio de otros servicios. Una reversión puede ser material; requiere nuevo permiso y readback.
5. **Trabajos:** si hubo cualquier efecto posiblemente iniciado, clasificar como `UNKNOWN_OUTCOME` hasta obtener readback de trabajos/idempotencia en el sistema propietario. Nunca repetir envíos de trabajo para comprobar recuperación.
6. **Verificar:** comprobar health HTTP 200 del backend loopback y un único servicio activo; verificar desde otro dispositivo acceso Tailscale SSH **durante** la caída, con readback independiente. Un único `MainPID` o respuesta HTTP 200 no demuestran ausencia de duplicación de trabajos.
7. **Conservar:** snapshots y pruebas recientes en almacenamiento privado, nunca en Git. `LC-RECOVERY-LIVE` sigue **OPEN** hasta autenticación y revisión independiente de todas las pruebas.

Este archivo **no ejecuta** procedimientos de rollback.
