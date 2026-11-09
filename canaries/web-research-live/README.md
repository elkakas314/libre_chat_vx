# LC-WEB-RESEARCH-LIVE — canario SOURCE

**Estado:** OPEN / NO_DEPLOYMENT_EVIDENCE hasta contar con host y readbacks autenticados.

Fuente: `SPEC.json#/configuracion/librechat_yaml/webSearch` y `SPEC.json#/backlog/active_live/3`. Upstream fijado `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`.

```yaml
webSearch:
  searchProvider: keenable
  scraperProvider: keenable
  rerankerType: none
  safeSearch: 1
```

**Importante:** el nivel `safeSearch: 1` se verifica en el YAML de LibreChat del host, pero el API público de Keenable **no ofrece un parámetro `safeSearch`**; el script 02 envía únicamente `{"query":"test"}`. La prueba del endpoint Keenable **no certifica por sí sola** la aplicación del filtro por LibreChat.

## Requisitos y variables

Bash, jq, curl, sha256sum, date; Python 3 + PyYAML **ya instalados** para leer YAML. Ningún script instala paquetes. Los datos se guardan en un directorio privado 700 con archivos 600, fuera del repositorio.

| Variable | Uso |
|---|---|
| `LIBRECHAT_BASE_URL` | URL base HTTPS de LibreChat; reservada para el pipeline cuando el servidor exponga lectura segura. No se asume una ruta de chat read-only. |
| `KEENABLE_API_KEY` | Opcional. El baseline **keyless** no lo envía; una key solo aumenta los límites públicos. |
| `KEENABLE_API_URL` | Opcional. Sobrescribe la ruta de búsqueda; por seguridad este canario solo acepta `https://api.keenable.ai/v1/search/public`. |
| `KEENABLE_FETCH_URL` | Opcional. Solo admite `https://api.keenable.ai/v1/fetch/public`. |
| `LIBRECHAT_ACTIVE_YAML` | Archivo YAML realmente montado por el host; nunca un fragmento de ejemplo. |
| `LIBRECHAT_YAML_MOUNT_CONFIRMED` | `YES` tras verificar el montaje real del host; de lo contrario 01 responde `SKIP`. |
| `WEB_RESEARCH_EVIDENCE_DIR` | Directorio externo privado; por defecto `${XDG_RUNTIME_DIR:-/tmp}/lc-web-research-$(id -u)`. |
| `LIBRECHAT_PIPELINE_PROOF_FILE` | Archivo JSON **privado** de readback de una búsqueda/fetch nativos de LibreChat ejecutados por operador. Opcional: sin él 04/05 devuelven `SKIP`. |
| `WEB_RESEARCH_MAX_AGE_SECONDS` | Antigüedad máxima de la prueba de pipeline; default 86400 segundos. |

No poner tokens, IDs de usuario, credenciales ni contenido privado en Git o plantillas. No usar `set -x`.

## Ejecución futura en host autorizado

```bash
bash canaries/web-research-live/00-source-sanity.sh
bash canaries/web-research-live/01-read-search-config.sh
bash canaries/web-research-live/02-verify-search-provider.sh
bash canaries/web-research-live/03-verify-scraper-provider.sh
bash canaries/web-research-live/04-canary-search-query.sh
bash canaries/web-research-live/05-canary-fetch.sh
```

**01:** leer el YAML efectivo en host y cotejar los cuatro valores de `SPEC.json`. Si no hay host, `SKIP`; si los valores difieren, `FAIL`.

**02:** petición de búsqueda keyless al endpoint público Keenable, `POST /v1/search/public` (operación de consulta, no de configuración); exige HTTP 200 y resultados con URL, título y descripción/snippet. Se envía `X-Keenable-Title`. Si no hay clave y Keenable responde 401/403/429, `SKIP` con motivo y evidencia de que no hubo PASS; la documentación admite keyless, pero no se inventan resultados. Sin reintentos.

**03:** `GET /v1/fetch/public?url=https://example.com/&live=true`, sin claves, exige contenido textual no vacío y mínimo 40 caracteres. `live=true` permite obtener la página aunque no esté indexada. Sin redirects ni extracción LLM `prompt`.

**04 y 05:** en el upstream fijado, lanzar búsqueda/fetch nativo mediante chat puede generar mensajes, inferencia y consumo de cuota. **No existe un endpoint GET estándar para iniciar estas herramientas sin efectos**. Por eso el canario lee un resultado de pipeline previamente capturado con autenticación por el operador y comprueba resultados, URL, snippets, contenido y hashes; en ausencia de readback, `SKIP` explícito. No se inicia un chat ni se simula una búsqueda. La plantilla `expected-outputs/web-research-proof.template.json` describe el contrato de evidencia privada.

El POST del **proveedor de búsqueda** es semánticamente de consulta y puede consumir cuota; no se confunde con un POST de chat, sincronización o administración. El self-test CI ejecuta solo `00-source-sanity.sh` y **no hace ninguna petición de red**.

## Salidas y gate

Todos los scripts terminan con `PASS`, `FAIL` o `SKIP` y un motivo para SKIP/FAIL. Cada `PASS` solo cubre su comprobación, no cierra el gate LIVE. La evidencia estructural proporcionada por el operador para 04/05 debe corroborarse de modo independiente.

**Rollback:** `06-rollback.md` — no hay rollback porque ninguno de los scripts cambia configuración.

Referencias: https://www.librechat.ai/docs/features/web_search ; https://docs.keenable.ai/api-reference/search ; https://docs.keenable.ai/api-reference/fetch

## 06 — Comprobaciones de seguridad restauradas

El script `06-restore-lost-checks.sh` recupera las comprobaciones
críticas del antiguo `04-citations-security-cost.sh`:

- Detección de proveedores pagados configurados.
- Excepciones SSRF y overrides de endpoints.
- Evidencias de facturación y cuotas.
- Evidencias de protección frente a instrucciones web hostiles.

Las pruebas relativas a proveedores, facturación y seguridad
externa requieren readbacks verificables.

Un PASS estructural no acredita seguridad LIVE.

## Comprobaciones expresamente excluidas

- Correspondencia entre resultados de búsqueda y fetch.
- Validación de citas y atribuciones.

Ambas quedan excluidas por decisión explícita del propietario.

## Procedencia del código recuperado

Referencia histórica:
commit `9f8b31861f0324e9b0157209b625603763402168`

Archivo original:
`canaries/web-research-live/04-citations-security-cost.sh`

No se restaura el archivo original ni se sustituyen
los scripts 01 a 05.

## Ejecución adicional

```bash
bash canaries/web-research-live/06-restore-lost-checks.sh
```

Variable adicional:
`WEB_RESEARCH_SECURITY_PROOF_FILE`

Ruta privada al JSON de evidencias de seguridad,
facturación, cuotas y tratamiento de contenido hostil.
