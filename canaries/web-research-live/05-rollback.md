# LC-WEB-RESEARCH-LIVE — rollback documental (NO ejecutable)

1. El canario sólo consulta la configuración y valida evidencias privadas. **No** cambia `librechat.yaml`, permisos, proveedores, keys, modelos, reranker, rutas ni herramientas. Tampoco inicia conversaciones Web Search.
2. Antes de activar cualquier proveedor externo, un administrador autorizado debe conservar snapshot autenticado del YAML realmente montado, su SHA256, flags de herramientas, permisos WEB_SEARCH y la configuración de cuota/coste. La configuración canónica de referencia permanece `SPEC.json#/configuracion/librechat_yaml/webSearch`.
3. Si falla la búsqueda o lectura y existe una modificación de configuración *realizada fuera de este paquete*, aislar el componente afectado; no cambiar a Serper/Tavily/Firecrawl/SearXNG ni crear Worker/proxy automáticamente.
4. Una reversión del YAML o credenciales es acción material del administrador **externa** al canario y requiere autorización específica y snapshot. Leer de nuevo `GET /api/config` con sesión autenticada, comprobar permisos, rutas y coste; leer resultados de búsqueda existentes sin repetir generación.
5. Ante petición de generación o fetch con posible consumo/cuota y resultado desconocido, consultar el mismo evento/conversación, registros proveedor y facturación: `UNKNOWN_OUTCOME`, **sin reintento automático**.
6. Si la fuente trae instrucciones hostiles, tratar el HTML/texto remoto exclusivamente como datos, no autorizar tools, host-control, MANOJOS3 ni extracción de secretos.
7. Hasta tener pruebas independientes de readbacks, cuotas y rollback, dejar `LC-WEB-RESEARCH-LIVE` **OPEN** y `NO_DEPLOYMENT_EVIDENCE` si todavía no existe host autenticado.
