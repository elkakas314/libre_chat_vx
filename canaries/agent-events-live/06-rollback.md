# Agent Events — sin rollback material

Este canario **no registra ni envía eventos HTTP**, no realiza POST de agentes, no cambia permisos, no crea suscripciones ni toca MANOJOS3. Solo comprueba SOURCE y documentos de evidencias privadas del operador.

- `01-local-delivery.test.cjs` ejecuta la función pura `buildAgentEventDelivery` ya compilada por `npm test`: demuestra claves deterministas, severidad, provenance y authority=false. **No demuestra deduplicación del receptor**.
- `02`, `03`, `04` validan readbacks proporcionados fuera del paquete por el operador. Un JSON autodeclarado no demuestra autenticidad de la captura; para cerrar LIVE se necesitará verificación independiente de origen, ACL y recibos.
- `05` siempre emite `SKIP` mientras el SPEC marque `LC-M3-GAP-001` como BLOQUEADO. No asume, inventa ni sustituye un endpoint MANOJOS3.
- Si fuera necesario revertir un evento/activación introducido por un procedimiento **externo**, solo el dueño del servicio y su sistema de autoridad podrán hacerlo con snapshot y receipt. Nunca reintentar efecto material automáticamente.
- Un fallo de transporte tras posible efecto significa `UNKNOWN_OUTCOME` hasta readback; notificaciones no autorizan acciones.

Por diseño no existe operación de rollback en este canario, porque no hace cambios materiales.
