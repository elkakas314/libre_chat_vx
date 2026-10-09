# Cierre del Bloque 2 — Canarios SOURCE

## Estado

- **7/7 canarios SOURCE** creados y validados mediante GitHub Actions (self-tests SOURCE, `build-test` y `overlay-smoke`): [run 37989747981](https://github.com/elkakas314/libre_chat_vx/actions/runs/37989747981), HEAD de referencia `b3733a7b8434d40cd4ef9ceeedce83baa8e71012`.
- **0/7 gates LIVE cerrados**; ninguna de las comprobaciones sobre el host o cuentas externas está acreditada. En rigor hay **seis gates LIVE en estado OPEN y un benchmark `GATE_HUMAN` pendiente** (`LC-LOW-POWER-MEASURE`).
- **Bloque 1 cerrado previamente (12/12 contratos)**; este cierre de Bloque 2 es **documental/SOURCE**, no una declaración de despliegue ni de verificación LIVE.
- Referencia canónica de estados: `SPEC.json#/backlog/active_live`. La creación de estos canarios no altera esos estados.

## Tabla de canarios

Duraciones **estimadas**, no medidas; dependen de disponer de host, accesos autorizados, snapshots y evidencias autenticadas. Los scripts `00` son self-tests SOURCE offline; los rangos indican pasos del canario, no autorizan acciones por sí mismos.

| Gate | Directorio | Ejecutable | Duración est. | Requisitos | Resultado esperado |
|---|---|---|---|---|---|
| `LC-CF-AIG-BINDING` | `canaries/cf-aig-binding/` | `01–04` | 30–60 min | Cuenta Cloudflare y token autorizado, rutas reales y rollback preparado | Readbacks de binding, permisos y ruta de inferencia; gate OPEN hasta prueba LIVE autenticada. |
| `LC-SKILL-SYNC-LIVE` | `canaries/skill-sync-live/` | `01–04` | 15–30 min | Administrador LibreChat y token GitHub de alcance mínimo | Evidencia de distribución/sincronización controlada y autorización; gate OPEN hasta verificación. |
| `LC-TAILSCALE-MOBILE-LIVE` | `canaries/tailscale-mobile-live/` | `01–04` | 20–40 min | Host con Tailscale, política de acceso, móvil y sesión autorizada | Evidencia de acceso privado y continuidad móvil, ACL y revocación; gate OPEN hasta readback completo. |
| `LC-WEB-RESEARCH-LIVE` | `canaries/web-research-live/` | `01–06` | 15–30 min | Host LibreChat, YAML real, acceso a Keenable y evidencias privadas de seguridad/coste | Readbacks de configuración, proveedores, búsqueda/fetch y controles restaurados del paso `06`; gate OPEN hasta corroboración. |
| `LC-AGENT-EVENTS-LIVE` | `canaries/agent-events-live/` | `01–05` | 10–20 min | Host LibreChat, readbacks del receptor y fuente externa gobernada de eventos | Prueba SOURCE ejecutable del builder TypeScript; recepción externa MANOJOS3 = **SKIP** mientras `LC-M3-GAP-001` siga bloqueado; gate OPEN. |
| `LC-RECOVERY-LIVE` | `canaries/recovery-live/` | `01–04` | 15–30 min | SSH al host, Tailscale SSH autorizado, unidad LibreChat identificada, ventana y rollback | Readback de recuperación y canal SSH independiente; un reinicio necesita autorización explícita; gate OPEN hasta pruebas reales. |
| `LC-LOW-POWER-MEASURE` | `canaries/low-power-measure/` | `01–05` | 30–60 min | Host Lenovo libre, LibreChat instalado, unidad dedicada y credenciales **solo de prueba** para chats opcionales | `report.md` + JSON con CPU/RAM/disco/red/latencias y referencias SOURCE (`null` si no existen); **decisión HUMANA**, sin PASS/FAIL automático del host. |

**Precauciones sobre los ejecutables:** los scripts pueden devolver `SKIP` si no existe evidencia o autorización. En Recovery, el paso `03` tiene efecto controlado únicamente con `RECOVERY_CANARY_ALLOW_RESTART=YES`. En low-power, el `02` arranca temporalmente un servicio originalmente inactivo únicamente con `LOWPOWER_ALLOW_STARTUP=YES`. La lista `01–06` de Web Research incluye el control restaurado `06-restore-lost-checks.sh`; `06-rollback.md` es documentación, no script ejecutable.

## Orden recomendado de ejecución cuando haya host

1. **`LC-LOW-POWER-MEASURE`** — medir primero en reposo y con carga controlada para que **el operador** decida si el host aguanta LibreChat; es `GATE_HUMAN`.
2. **`LC-CF-AIG-BINDING`** — verificar rutas de inferencia, identidad y permisos con la cuenta autorizada.
3. **`LC-SKILL-SYNC-LIVE`** — verificar distribución y lectura autenticada sin permisos genéricos.
4. **`LC-WEB-RESEARCH-LIVE`** — contrastar YAML efectivo, proveedor, evidencias de seguridad, cuotas y costes.
5. **`LC-TAILSCALE-MOBILE-LIVE`** — probar acceso privado, ACL, móvil y cambios de red.
6. **`LC-RECOVERY-LIVE`** — solo en ventana autorizada, con Tailscale SSH independiente y rollback preparado.
7. **`LC-AGENT-EVENTS-LIVE`** — ejecutar la parte externa solo cuando MANOJOS3 exponga `GET /v1/events` o una interfaz gobernada equivalente, autenticada y demostrable; hasta entonces, `SKIP` externo.

Este orden es **recomendado**, no sustituye el preflight ni los permisos particulares de cada paso.

## Bloqueos externos conocidos

- **`LC-M3-GAP-001` (`BLOQUEADO`)**: el Control Plane HTTP y MCP de MANOJOS3 examinados no evidencian `GET /v1/events`, stream o suscripción equivalente. Esto **no prueba** ausencia absoluta de otras integraciones. Bloquea la recepción externa de `LC-AGENT-EVENTS-LIVE`; su canario SOURCE y el test TypeScript existen, pero el paso MANOJOS3 devuelve `SKIP`. No se modifica MANOJOS3 desde LibreChat VX.
- La instalación efectiva del host, identidad de servicio, políticas de acceso, cuentas Cloudflare/Tailscale, credenciales y observaciones LIVE requieren confirmación independiente; no se inventan despliegues ni resultados.

## Riesgos y dependencias

- **Host insuficiente o saturado:** la medida CPU/RAM/disco/red/latencia carece todavía de valores reales. `SPEC.json#/rendimiento` conserva los valores desconocidos como `null`; la decisión de capacidad es humana.
- **Acceso y secretos:** usar tokens de privilegio mínimo y políticas de cuenta verificadas; mantener evidencias privadas, evitar copiar credenciales, sesiones o IDs personales a GitHub.
- **Acciones materiales:** un reinicio, arranque, cambio de transporte o sincronización puede afectar al servicio; respetar el permiso explícito de cada script, snapshot/readback y procedimiento de rollback. No ejecutar reintentos ciegos tras resultado desconocido.
- **Dependencias de red:** Tailscale SSH debe funcionar fuera de banda cuando LibreChat esté caído; un HTTP 200, una simulación SOURCE o el CI verde no demuestran continuidad real ni ausencia de trabajos duplicados.
- **Pruebas de inferencia y coste:** Keenable, Cloudflare o endpoints de chat pueden consumir cuotas. Aislar los escenarios sintéticos y comprobar facturación y límites antes de considerar cualquier evidencia.
- **Integración externa:** `LC-M3-GAP-001` impide acreditar el flujo de eventos MANOJOS3→LibreChat; el diseño y la ejecución pura del builder no equivalen a recepción LIVE.
- **Validez de evidencias:** conservar fechas, hash y referencias de readback autenticadas; `PASS` de estructura o fuente no promueve por sí solo un gate a LIVE.

## Qué NO hacer

- **No ejecutar los canarios de host sin un host real**, permisos y preflight correspondiente.
- **No declarar PASS LIVE ni cerrar gates** basándose en SOURCE, plantillas, respuestas simuladas, un HTTP 200 aislado o CI verde.
- **No tocar MANOJOS3**, su Kernel, host-control, MCP, túneles, servicios ni credenciales.
- **No modificar Cloudflare, Tailscale, unidades del host ni ACL sin snapshot, autorización y rollback preparado**.
- No hacer fallback pagado, instalación automática de herramientas ni duplicación/replay de acciones materiales.
- No incluir tokens, secretos, IDs reales, conversaciones privadas o capturas de cuentas en GitHub.
- No aplicar automáticamente el dictamen de rendimiento del host: `LC-LOW-POWER-MEASURE` exige decisión humana.

## Persistencia de mediciones y evidencia

- **Low-power:** `01–04` generan JSON de medición en `LOWPOWER_OUTPUT_DIR` (directorio privado del host; por defecto temporal), y `05` consolida `report.md` + `low-power-proof.json`. No se deben confundir los datos temporales del host con persistencia Git.
- **Otros canarios:** emplean sus propias variables de directorio de evidencia, definidas en `canaries/*/README.md`; no todos escriben en `LOWPOWER_OUTPUT_DIR`.
- Tras cada ejecución, el operador debe conservar las **evidencias desensibilizadas**, con referencia trazable al gate correspondiente en `SPEC.json#/backlog/active_live`. Adjuntar documentos o modificar SPEC requiere una acción posterior expresamente autorizada: **este cierre no edita estados de gates ni añade pruebas no existentes**.
- No subir evidencias privadas, credenciales o datos personales a GitHub. El repositorio contiene exclusivamente instrumentación y documentación SOURCE.

## Referencias

- `SPEC.json#/backlog/active_live`
- `SPEC.json#/backlog/deferred_external`
- `SPEC.json#/despliegue/procedimientos`
- `SPEC.json#/rendimiento`
- `canaries/*/README.md`
- `.github/workflows/source-check.yml`
