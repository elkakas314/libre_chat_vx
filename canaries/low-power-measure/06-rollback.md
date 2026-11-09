# Rollback y conservación (GATE_HUMAN)

- 01, 05 y 00 no modifican la configuración ni arrancan procesos de LibreChat. 01 recopila métricas host y snapshots opcionales de top/free/df/iostat.
- 02 solo puede arrancar una unidad systemd LibreChat dedicada inicialmente inactiva cuando `LOWPOWER_ALLOW_STARTUP=YES`. El trap intenta detenerla al salir para **restaurar el estado inactivo**. Si la restauración falla, notificar al operador; **no** ejecutar resets globales.
- 03 y 04 hacen como máximo una petición sintética cada uno a endpoints locales **de prueba, aislados y confirmados como efímeros**. No deben conectarse a producción ni generar conversaciones persistentes; si no se puede garantizar esto, omitir los escenarios (SKIP).
- No instalar, editar unidades, activar servicios adicionales, modificar Tailscale, tocar MANOJOS3 ni reintentar una petición tras resultado desconocido.
- Los JSON, report.md y snapshots permanecen únicamente en `LOWPOWER_OUTPUT_DIR` del **host**, por defecto un directorio temporal privado. El operador decide qué conservar y adjuntar como evidencia, sin tokens o datos privados.
- Tras un fallo de inicio, consultar `systemctl status <unidad LibreChat>` y health loopback antes de una recuperación manual autorizada.
- Ningún script declara que el host sea suficiente: la decisión es humana, `LC-LOW-POWER-MEASURE` sigue GATE_HUMAN.
