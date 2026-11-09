# LC-AGENT-EVENTS-LIVE — canario SOURCE parcial (opción A)

**Estado:** SOURCE canary, gate **OPEN**. `LC-M3-GAP-001` permanece **BLOQUEADO**. Ni este paquete ni CI demuestran que MANOJOS3 exponga `GET /v1/events`, stream o suscripción. La ausencia en superficies SOURCE examinadas no demuestra que el sistema no tenga ninguna integración externa.

## Frontera y bloqueo (obligatorios)

El registro canónico `SPEC.json#/backlog/deferred_external` con `id=LC-M3-GAP-001` documenta que el target MANOJOS3 tiene State interno pero no se identificó interfaz externa de eventos en el HTTP/MCP examinados. **Se prohíbe cerrar `LC-AGENT-EVENTS-LIVE` hasta que MANOJOS3 exponga, documente y permita verificar autenticadamente `/v1/events` o un mecanismo externo equivalente gobernado.** No modificar MANOJOS3, puertos, host-control, MCP, túneles o credenciales desde este paquete.

## Qué puede comprobar LibreChat

La fuente `config/agent_events.current.json` declara `/api/agents/v1/events`, `mode=fire`, idempotencia, severidad, procedencia, payload saneado y `authority=false`. Esa declaración SOURCE no prueba montaje de ruta HTTP LIVE.

`src/events/agentEvents.ts` implementa `buildAgentEventDelivery`, cuya ejecución pura se comprueba por un test Node contra `dist/src/events/agentEvents.js` generado tras `npm test`. Un test de construcción estable de `idempotencyKey` **no sustituye** una prueba de deduplicación real del receptor.

La recepción local, idempotencia de servidor, triage y notificaciones se verifican solo si el operador aporta un readback autenticado; el canario no provoca un evento de producción ni factura inferencias para demostrarlo.

## Archivos y uso

- `00-source-sanity.sh`: offline, comprueba sintaxis, plantillas, STATUS y el bloqueo en el SPEC.
- `01-local-delivery.test.cjs`: 3 pruebas de la implementación TypeScript compilada: claves y consistencia, gravedad/provenance, ausencia de autoridad. Ejecutado automáticamente en el job `build-test`.
- `02-read-inbound-evidence.sh`: readback de recepción en LibreChat (JSON privado), o `SKIP`.
- `03-idempotency-readback.sh`: exige un recibo autenticado de **dos intentos, un único efecto**. No simula que la función pura deduplica.
- `04-triage-notifications.sh`: exige evidencia de severidad, procedencia y notificación opaca con fresh fetch.
- `05-manojos3-external-skip.sh`: `SKIP` explícito obligatorio por `LC-M3-GAP-001`; no hace GET, POST ni llamadas a MANOJOS3.
- `06-rollback.md`: no hay rollback porque el canario no cambia estado.

## Variables y privacidad

| Variable | Significado |
|---|---|
| `AGENT_EVENTS_EVIDENCE_DIR` | Directorio privado 700 fuera del repositorio para resúmenes 600. Default `${XDG_RUNTIME_DIR:-/tmp}/lc-agent-events-$(id -u)`. |
| `AGENT_EVENTS_HOST_PROOF_FILE` | Ruta a un JSON **privado**, obtenido fuera del canario mediante readback autenticado del backend LibreChat; ver `expected-outputs/agent-events-proof.template.json`. |
| `AGENT_EVENTS_MAX_AGE_SECONDS` | TTL para readbacks privados, por defecto 86400 segundos. |

Ningún token, credencial, ID de usuario, conversación real ni payload privado debe añadirse al repositorio. Los ejemplos contienen solo valores sintéticos. No instalar dependencias. Los scripts requieren Bash/jq/date/sha256sum, y el test SOURCE usa Node tras compilar el proyecto con su test actual.

## Procedimiento

```bash
bash canaries/agent-events-live/00-source-sanity.sh
# Tras npm test / compilación TypeScript, en checkout de prueba:
node --test canaries/agent-events-live/01-local-delivery.test.cjs

# En entorno autorizado, solo con readbacks privados YA obtenidos:
bash canaries/agent-events-live/02-read-inbound-evidence.sh
bash canaries/agent-events-live/03-idempotency-readback.sh
bash canaries/agent-events-live/04-triage-notifications.sh
bash canaries/agent-events-live/05-manojos3-external-skip.sh
```

**Resultado esperado antes de resolver `LC-M3-GAP-001`:** PASS SOURCE, posible PASS estructural LibreChat, `SKIP` MANOJOS3, gate **OPEN**. `PASS` estructural basado en JSON aportado no es `LIVE_VERIFIED`; se exige comprobación independiente de autenticidad y correlación de recibos.
