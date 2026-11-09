# LC-CF-AIG-BINDING — canarios LIVE preparados en SOURCE

**Objetivo:** preparar pruebas reproducibles para cerrar `LC-CF-AIG-BINDING` sin confundir respuestas HTTP con autorización LIVE. Esta carpeta **no** afirma que Cloudflare, rutas ni proveedores estén desplegados.

**Requisitos:** host con Bash, curl, jq, HTTPS y `date`; acceso autenticado **de lectura** a la cuenta Cloudflare y permisos `AI Gateway Read` (más lectura de cuenta); acceso a los paneles/APIs autenticados de cada proveedor para coste y cuota. El Gateway debe tener `authentication=true` y `byok_only=true`. Duración orientativa de ejecución operativa: **30–60 minutos**, variable según permisos y proveedores.

Variables obligatorias **solo en el entorno del host**, nunca en Git, capturas ni chat:

- `CLOUDFLARE_ACCOUNT_ID`: identificador de cuenta de Cloudflare.
- `CLOUDFLARE_API_TOKEN`: token de acceso a API con alcance mínimo suficiente.
- `CLOUDFLARE_AI_GATEWAY_ID`: identificador del AI Gateway.
- `CF_AIG_EVIDENCE_DIR` (opcional): directorio privado para evidencias; por defecto `${XDG_RUNTIME_DIR:-/tmp}/lc-cf-aig-canary-$(id -u)`. Es **local**, no parte del repositorio.
- `CF_AIG_PROVIDER_PROOF_FILE` (obligatorio en 04): archivo externo de pruebas autenticadas de cuota/coste por cada proveedor y modelo. Estructura orientativa: `expected-outputs/provider-proof.template.json`.
- `CF_AIG_ALLOW_INFERENCE=YES` (obligatorio en 03): confirma explícitamente que se permiten **siete** peticiones de inferencia que podrían consumir cuota. **No** establece ni garantiza coste cero.

## Orden operativo (fallo cerrado)

En un host autorizado, exportar las tres variables obligatorias mediante su gestor de secretos, **sin imprimirlas**. Ejecutar desde la raíz del repositorio:

```bash
bash canaries/cf-aig-binding/01-read-account-and-routes.sh
bash canaries/cf-aig-binding/02-verify-routes-content.sh
# Consultar de verdad paneles/APIs de todos los proveedores/modelos,
# cotejar permisos/ámbito/cuotas/coste y aportar evidencias fuera del repo.
export CF_AIG_PROVIDER_PROOF_FILE="/ruta/privada/proveedor-readbacks.json"
bash canaries/cf-aig-binding/04-quota-and-cost.sh
# Solo si 01, 02 y 04 han pasado y el operador admite 7 peticiones:
export CF_AIG_ALLOW_INFERENCE=YES
bash canaries/cf-aig-binding/03-canary-inference.sh
```

**Por qué 04 precede a 03:** no debe enviarse inferencia potencialmente facturable sin una verificación de cuenta/proveedor. `04` solo valida la estructura/frescura de la evidencia que un operador obtuvo con autenticación externa. **No autentica por sí mismo dicha evidencia**, ni sustituye el readback de cuota posterior a los canarios. No se puede cerrar LIVE solo con un PASS de esos scripts.

## Criterios de aceptación del gate (todos acumulativos)

1. Cuenta y gateway leídos con autenticación real y permisos efectivos; identidad comprobada; `authentication=true`, `byok_only=true`.
2. Existen exactamente las **7 rutas semánticas requeridas** con identificador inequívoco y versión realmente desplegada; se conserva la versión previa por ruta.
3. Para **cada nodo de modelo** de las 7 rutas hay proveedor/modelo, cuota disponible, coste cero confirmado *en su cuenta*, compatibilidad y permiso de uso; sin fallback pagado. Se rechaza cualquier prueba caducada, inferida o de otro ámbito.
4. Inferencia mínima por ruta con `cf-aig-gateway-id` y `cf-aig-no-wholesale: true`, SSE terminado y `cf-aig-log-id` comprobado contra el API autenticado. No hay reintentos automáticos.
5. Comprobación posterior real de cuota y facturación en **cada proveedor**; los costes estimados del AI Gateway por sí solos no bastan. Comprobar también privacidad/capacidades necesarias y política de almacenamiento de logs.
6. Se registra plantilla `evidence-template.json` con timestamps, IDs/versión reales **solo en el almacén privado**, alcance y evidencias autenticadas, readback de rollback y verdictos. La promoción a `LIVE_VERIFIED` requiere revisión explícita.

## Salidas

Cada script termina en **PASS** o **FAIL**; HTTP 200 aislado jamás equivale a LIVE. Los JSON brutos y las respuestas SSE pueden contener metadatos/confidencialidad: se guardan con permisos restringidos **fuera del repositorio**; jamás subirlos a Git. No ejecutar `set -x`. La carpeta `expected-outputs/` solo contiene ejemplos sintéticos.

## Rollback

Consultar `05-rollback.md`. Estos canarios solo usan GET y un POST de inferencia (que **consume cuota**, sin cambiar la configuración). Si algo falla: detener, no habilitar rutas ni retocar Cloudflare automáticamente; conservar evidencia, verificar la versión anterior y exigir autorización por separado para cualquier restauración.

## Documentación HTTP oficial (consulta de rutas/versiones y streaming)

- https://developers.cloudflare.com/api/resources/ai_gateway/methods/get/
- https://developers.cloudflare.com/api/resources/ai_gateway/subresources/dynamic_routing/
- https://developers.cloudflare.com/api/resources/ai_gateway/subresources/logs/methods/list/
- https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/usage/
- https://developers.cloudflare.com/ai-gateway/observability/costs/
