# LC-TAILSCALE-MOBILE-LIVE — canario SOURCE / READ-ONLY

**Gate:** OPEN. **Runtime:** NO_DEPLOYMENT_EVIDENCE. Ningún host, cliente, ACL, cuenta ni Servicio Tailscale se ha verificado LIVE por crear estos archivos. Fuente canónica: `SPEC.json#/backlog/active_live/2`, `TOPOLOGY.json#/gates_live/2`, `TOPOLOGY.json#/recursos/1`, `config/mobile_access.current.json`, `docs/MOBILE_REMOTE_ACCESS_CURRENT.md` y `deployment/parallel-transport/tailscale-serve.librechat-vx.md`.

## Objetivo (dos dispositivos, un backend)

Comprobar Tailscale **Serve privado** para LibreChat VX, destino `http://127.0.0.1:3080` sin Funnel, acceso por MagicDNS y sesión LibreChat, ACL, cambio Wi-Fi/datos, continuidad desktop ↔ móvil, revocación efectiva, no replay material y rollback al snapshot. Ni NOSTROMO ni este paquete tienen autoridad material. Ninguna ruta/puerto/túnel/servidor de MANOJOS3 se comparte, reasigna, inspecciona de forma intrusiva o modifica.

Tailscale CLI varía entre versiones: `tailscale serve status --json` y `tailscale funnel status --json` son **lecturas**, mientras `serve --bg` o `reset` serían cambios materiales **prohibidos aquí**. Si un CLI/JSON distinto no permite validación inequívoca, **FAIL** y documentación, nunca fallback mutador.

## Dependencias

En host: `bash`, `jq`, `curl`, `tailscale`, `date`, `sha256sum`. En cliente de lectura 02: las mismas herramientas más sesión Tailscale autorizada y JWT LibreChat de solo lectura. En dispositivos móviles sin CLI Bash, la obtención de observaciones Wi-Fi/datos se hace **fuera del canario**, con autenticación propia. Los scripts 03 y 04 solo validan esas evidencias de manera estructural; un PASS allí NO acredita por sí solo prueba LIVE.

## Variables de entorno

| Variable | Para qué sirve |
|---|---|
| `TAILSCALE_CANARY_EVIDENCE_DIR` | Carpeta **privada** fuera del repositorio (default `${XDG_RUNTIME_DIR:-/tmp}/lc-tailscale-mobile-$(id -u)`); pasar de host a cliente cifrada/privadamente según control del operador. |
| `TAILSCALE_LIBRECHAT_URL` | Origen HTTPS completo MagicDNS leído en 01, por ejemplo `https://host.tailnet.ts.net` (**ejemplo ficticio**); no URL pública ni IP adivinada. |
| `LIBRECHAT_VIEW_TOKEN` | JWT de sesión LibreChat real, de lectura, únicamente en el entorno del cliente 02. |
| `TAILSCALE_MOBILE_PROOF_FILE` | JSON privado de observaciones autenticadas desktop/Wi-Fi/datos según `expected-outputs/mobile-proof.template.json`. |
| `TAILSCALE_REVOCATION_PROOF_FILE` | JSON privado de ACL revocada y snapshot/rollback según `expected-outputs/revocation-proof.template.json`. |
| `TAILSCALE_CANARY_MAX_AGE_SECONDS` | Máxima antigüedad admitida en evidencias 03/04; default 86400 (24h). |

**Nunca** versionar JWT, capturas de conversaciones, IDs de nodos, direcciones reales, configuraciones de Tailnet o evidencias privadas. Modo de archivos 600 y directorio 700; no ejecutar `set -x`. Ni siquiera el paquete SOURCE necesita credenciales.

## Orden de comprobación futuro, sin POST ni cambios materiales

```bash
bash canaries/tailscale-mobile-live/00-source-sanity.sh

# En host LibreChat VX, antes de cualquier cambio material:
bash canaries/tailscale-mobile-live/01-host-serve-readback.sh

# Copiar por canal privado evidencia 01 al cliente Tailscale autorizado.
# En cliente tailnet CON CLI, con URL real y JWT local:
bash canaries/tailscale-mobile-live/02-private-route-and-acl.sh

# Aportar pruebas móviles autenticadas de dos redes / mismos IDs:
bash canaries/tailscale-mobile-live/03-mobile-continuity.sh

# Aportar prueba externa de revocación + snapshot/restauración administrada:
bash canaries/tailscale-mobile-live/04-revocation-and-rollback-readback.sh
```

## Criterios (acumulativos, no promocionan LIVE automáticamente)

1. **01:** host Tailscale Running y online, MagicDNS propio, Serve `Proxy=http://127.0.0.1:3080`, Funnel OFF, backend loopback; snapshot previo de Serve y rutas ajenas **preservadas**, no se ejecuta ningún comando que cambie Serve/ACL.
2. **02:** un cliente distinto, en el **mismo tailnet**, accede por HTTPS MagicDNS real con sesión LibreChat autenticada. Esta lectura por sí sola no demuestra política ACL de revocación.
3. **03:** observaciones privadas de móvil Wi‑Fi y datos, cambio de dispositivo y pestaña, misma conversación/backend, stream cuando proceda, borradores offline, no colas de material ni aprobación, backend caído visible como no disponible. Ningún efecto material se reenvía tras reconectar.
4. **04:** identidad revocada DENY, sin acceso fuera del tailnet ni Funnel, otros servicios intactos y readback del rollback al estado de Serve anterior; la restauración, si se realiza, es **externa y autorizada**, nunca ejecutada por este paquete.
5. **LIVE final:** el operador corrobora autenticidad de cada referencia privada, alcance del tailnet/ACL, rollback posible y ausencia de colisiones con MANOJOS3. `GET/HTTP 200` en una ruta solo da como máximo DEPLOYED_UNVERIFIED; no se declara LIVE_VERIFIED ni MATERIAL_VERIFIED hasta comprobación autenticada completa.

## Seguridad y documentación

`05-rollback.md` contiene el procedimiento sin ejecutarlo. El paquete es **fail-closed** si faltan identidad, host, dispositivo, prueba de revocación o snapshot. No inventar `NOT_DEPLOYED` sin inspección host autenticada. No confundir infraestructura de MANOJOS3 con el proxy LibreChat. Para estado histórico, consultar `operating/GAPS_CURRENT.json#/gaps/2`; no modificar ese gate aquí.

Referencia del comando de solo lectura: https://tailscale.com/docs/reference/tailscale-cli/serve y https://tailscale.com/docs/reference/tailscale-cli/funnel
