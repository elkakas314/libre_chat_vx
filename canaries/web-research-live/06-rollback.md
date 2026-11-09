# LC-WEB-RESEARCH-LIVE — sin rollback material

Los scripts de este canario **no modifican** `librechat.yaml`, permisos, claves, configuraciones de Keenable, LibreChat, MANOJOS3 ni otros servicios.

- `01` lee YAML del host y compara con `SPEC.json`, sin escribirlo.
- `02` envía una única **consulta** HTTP POST a Keenable (`/v1/search/public`), que no configura ni modifica estado de LibreChat. La llamada sí puede consumir cuota/rate-limit del servicio.
- `03` ejecuta GET del scraper keyless para una página pública estable; no edita configuración.
- `04` y `05` comprueban la salida de un pipeline ya ejecutado fuera del canario por un operador autorizado. Si no existe un readback seguro, devuelven `SKIP`; no generan conversaciones.
- Un fallo de cuota, DNS, credenciales o del backend no autoriza un fallback pagado. No instalar dependencias ni forzar reintentos.
- Si una acción ajena a este paquete hubiera cambiado el host, cualquier restauración es una **operación externa**, gobernada por el propietario y basada en su snapshot; este canario no ejecuta rollback.
- Registrar readback/HTTP y pruebas de cuota si se decide cerrar el gate. Un PASS aislado no significa LIVE_VERIFIED.

En todos los casos, `LC-WEB-RESEARCH-LIVE` permanece **OPEN** hasta verificación autenticada acumulativa.
