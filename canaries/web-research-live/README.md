# LC-WEB-RESEARCH-LIVE — canario SOURCE

**Estado:** SOURCE listo; `LC-WEB-RESEARCH-LIVE` OPEN. No hay autorización ni credenciales del host para LIVE; ningún resultado ni coste se afirma.

## Contrato existente (no rediseñar)

- `SPEC.json#/backlog/active_live/3`: Web Search/fetch nativos, proveedor y tratamiento de contenido.
- `SPEC.json#/configuracion/librechat_yaml/webSearch`: `searchProvider=keenable`, `scraperProvider=keenable`, `rerankerType=none`, `safeSearch=1`, runtime `NO_DEPLOYMENT_EVIDENCE`.
- `TOPOLOGY.json#/gates_live/3`, `operating/GAPS_CURRENT.json#/gaps/3`: LIVE host/account readback pendiente. `config/librechat-vx.example.yaml` es sólo ejemplo, **no prueba de YAML aplicado**.
- Upstream anclado: `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`; `api/server/routes/config.js` devuelve para usuario autenticado sólo el resumen `webSearch.searchProvider/scraperProvider/rerankerType` (no `safeSearch` ni permisos completos). `packages/data-provider/src/config.ts` acepta Keenable keyless, con rate limits del proveedor.
- `src/research/researchPolicy.ts` y `skills/nostromo-research/SKILL.md`: web público -> Web Search; documentos internos -> File Search; verdad operacional -> readback de destino. Contenido web nunca da autoridad de ejecución.
- **No** desplegar SearXNG, Firecrawl, LocalAI, proxy, crawler ni automatización navegador sin necesidad medida. No modificar MANOJOS3.

## Variables, dependencias y privacidad

| Variable | Función |
|---|---|
| `LIBRECHAT_BASE_URL` | HTTPS origin del LibreChat host autorizado, sin ruta ni query. |
| `LIBRECHAT_READ_TOKEN` | Token de sesión LibreChat de lectura para `GET /api/user` y `GET /api/config`. |
| `LIBRECHAT_ACTIVE_YAML` | Ruta exacta al `librechat.yaml` realmente montado por el backend en el host. |
| `WEB_RESEARCH_CONFIG_PATH_CONFIRMED` | Debe ser `YES`; confirmación humana de la ruta montada. No autentica la declaración por sí sola. |
| `WEB_RESEARCH_EVIDENCE_DIR` | Carpeta privada fuera del repositorio, default `${XDG_RUNTIME_DIR:-/tmp}/lc-web-research-$(id -u)`. Permisos 700/600. |
| `WEB_RESEARCH_RESULT_PROOF_FILE` | Prueba JSON privada de búsqueda/fetch **nativos realizados por operador autorizado**. Plantilla `search-fetch-proof.template.json`. |
| `WEB_RESEARCH_SECURITY_PROOF_FILE` | Prueba JSON privada de permisos, SSRF, citas, inyección, coste y cuota. Plantilla `security-cost-proof.template.json`. |
| `WEB_RESEARCH_MAX_AGE_SECONDS` | TTL para pruebas, default 86400 segundos. |

Requiere Bash, jq, curl, date, sha256sum. Para 02: Python 3 + PyYAML ya instalado en el host (no instala paquetes automáticamente). No guardar JWT, secretos, cuerpo completo de YAML, consultas confidenciales ni conversación en Git o chat. Se extrae un resumen de YAML **sin valores de claves** y su SHA256. Archivos de evidencia privados: mode 600, directorio 700, fuera del repo. Evitar `set -x`.

## Orden futuro de uso, host autorizado

```bash
bash canaries/web-research-live/00-source-sanity.sh

# Debe ser un host LibreChat real, con sesión válida:
bash canaries/web-research-live/01-authenticated-config-readback.sh

# Confirmar YAML REALMENTE montado por el backend:
bash canaries/web-research-live/02-host-config-readback.sh

# Fuera del canario, operador ejecuta una búsqueda y lectura nativas desde UI:
# - consulta pública de bajo riesgo, sin información personal, 2 resultados distintos
# - fetch de al menos una fuente, comparación de citas, referencias verificables
# - no se ejecuta en este paquete POST /api/ask, /api/agents/chat, ni inferencia
bash canaries/web-research-live/03-native-search-fetch-proof.sh

# Fuera del canario, operador obtiene readback real de ACL, seguridad y cuotas:
bash canaries/web-research-live/04-citations-security-cost.sh
```

## Qué prueba / qué NO prueba

- **01**: readback autenticado de `GET /api/user` y `GET /api/config`; tres proveedores coherentes. Esta API no prueba `safeSearch`, uso real de Web Search, ni permiso WEB_SEARCH de la cuenta.
- **02**: PyYAML inspecciona únicamente el YAML de host entregado por el operador. Compara proveedor, scraper, `safeSearch=1`, reranker y ausencia de overrides, exenciones SSRF o claves de proveedores pagos con `SPEC.json`. La ruta declarada debe corroborarse con readback del despliegue.
- **03**: valida estructura y referencias de evidencia externa de Web Search + fetch, no realiza ninguna búsqueda, scrape ni POST. No autentica por sí solo la prueba suministrada. Exige resultados públicos diferentes y enlaces de citas.
- **04**: valida estructura de readbacks externos de ACL (permitido/denegado), contenido web no confiable, SSRF, citas y coste cero de proveedores; un booleano autodeclarado **no es prueba independiente** de control.
- **LIVE**: propietario confirma autenticidad de cada referencia, ejecución real de search/fetch en el host, ausencia de rutas facturables no autorizadas, sesión y permisos, rollback. Un `HTTP 200` solo admite a lo sumo `DEPLOYED_UNVERIFIED`. Nunca cerrar el gate automáticamente.

## Seguridad

En el upstream, una búsqueda nativa puede comenzar un chat, consumir inferencia/cuota y modificar historial. Por eso **no** enviamos POST ni invocamos Web Search en el canario. El material Web Search sólo es fuente no confiable; instrucciones en páginas no deben ejecutar tools ni conceder acceso a MANOJOS3/VX13. No usar redirecciones HTTP en las lecturas de configuración. Ante `UNKNOWN_OUTCOME`, comprobar la misma conversación y cuenta antes de repetir generación.

Rollback: `05-rollback.md`. Ejemplos `expected-outputs/` son sintéticos, nunca prueba LIVE.
