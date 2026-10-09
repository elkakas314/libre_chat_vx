# LC-TAILSCALE-MOBILE-LIVE — rollback manual, no mutaciones de canario

**El paquete no contiene** `tailscale serve --bg`, `tailscale serve reset`, `tailscale funnel` de activación, modificaciones de ACL, escrituras de configuración ni reintentos materiales. Solo lee y valida pruebas privadas.

1. El operador autorizado toma un snapshot autenticado de `tailscale serve status --json` y `tailscale funnel status --json` **antes** de cualquier cambio externo; conserva la configuración completa, node/tailnet, rutas existentes y hash SHA256 en almacén privado.
2. Si una activación administrada externa de Serve falla, detener tráfico nuevo y cotejar configuración y owner de la ruta LibreChat VX con el snapshot. No deshacer rutas de terceros ni las de MANOJOS3.
3. La restauración —si llega a autorizarse— es operación manual y material del dueño del host/tailnet, limitada **exclusivamente** a la ruta LibreChat VX. Nunca usar `tailscale serve reset` global sobre un host con otras rutas.
4. Comprobar mediante readback `serve status --json`, `funnel status --json`, ACL de tailnet y el mismo snapshot previo; realizar acceso autorizado y revocado desde dispositivos separados.
5. Guardar referencias a las lecturas autenticadas de revocación, DNS, HTTP y restauración. `04-revocation-and-rollback-readback.sh` **solo valida estructura de esas evidencias**, no ejecuta el rollback ni autentica sus capturas por sí mismo.
6. Ante efecto material previo posible y desconexión: `UNKNOWN_OUTCOME` hasta un readback de destino. Nunca re-enviar comandos/autorizar en reconexión.
7. Si no puede restaurarse el snapshot o demostrar aislamiento respecto de MANOJOS3, mantener `LC-TAILSCALE-MOBILE-LIVE` **OPEN** y sin promoción runtime.
