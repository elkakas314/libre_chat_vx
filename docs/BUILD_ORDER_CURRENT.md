# BUILD ORDER — CURRENT

Status: `SOURCE_CORE_COMPLETE / LIVE_BINDINGS_PENDING`

## Regla

No desarrollar por inercia. Cada tramo termina en:

`CHANGE/CONFIG → TEST → READBACK → VERIFY → DOCUMENT`

Si una necesidad ya está cubierta por native/config/Skill/MCP/Action/wrapper fino, no crear otro módulo.

## A — Coherencia SOURCE y documentación

Estado: `PASS`.

Mantener alineados:
- `CURRENT.json`;
- `HANDOFF_CURRENT.md`;
- matriz maestra;
- 00/10/20/30/40 de Drive;
- tests/scripts/rutas/árbol;
- pin upstream.

No reabrir desarrollo SOURCE cerrado sin regresión demostrada.

## B — Cloudflare AI Gateway + Model Registry LIVE

Estado: `NEXT`.

1. adquirir account/gateway state real;
2. descubrir candidatos y credenciales disponibles;
3. verificar health/quota/cost/capabilities/privacy/context;
4. crear rutas `dynamic/nostromo-*`;
5. canary por perfil;
6. fail-closed zero-cost;
7. deploy versionado;
8. readback;
9. rollback probado.

No paid fallback. No Worker público administrador.

## C — GitHub Skill Sync LIVE

1. token read-only;
2. startup sync;
3. periodic sync;
4. discovery de 11 Skills;
5. update/remove canary;
6. last-known-good;
7. rollback.

## D — Tailscale Serve + móvil

1. leer Serve actual;
2. crear ruta dedicada LibreChat → `:3080`;
3. móvil/PC;
4. session/ACL;
5. streaming;
6. Wi-Fi↔datos;
7. reconnect;
8. revoke;
9. rollback.

Funnel queda fuera del baseline.

## E — Web Research LIVE

Baseline: Keenable search+fetch.

Canary:
- search;
- fetch;
- synthesis;
- Artifact/visualización;
- safe private-address policy.

SearXNG/Firecrawl sólo por benchmark.

## F — Agent Events LIVE

1. Remote Agents credentials;
2. event `fire`;
3. idempotency;
4. ordering;
5. Tentáculo triage;
6. mobile/browser notification;
7. fresh readback when state matters.

## G — Recovery fuera de banda

- host service/systemd;
- Tailscale SSH;
- LibreChat down recovery;
- tunnel disable/rollback;
- no public backdoor.

## H — Targets R0

Orden:
1. MANOJOS3 R0;
2. ORÁCULO advisory;
3. VX13 cuando el frontdoor sea canónico.

R0 primero. No R2 durante discovery.

## I — Primer material canary

Una sola acción mínima sobre ConcreteTargetId:
- target authorization;
- expected/preimage state;
- idempotency/fence;
- effect;
- readback;
- verifier/receipt;
- projection LibreChat.

## J — Opcionales/diferidos

Sólo con evidencia:
- SearXNG;
- Firecrawl;
- Whisper local;
- llama.cpp;
- LocalAI;
- Tailscale Services;
- Router Steward;
- secondary notifier;
- AI Gateway custom domain + Access.

## Pendiente externo separado

Migración futura de transportes MANOJOS3 hacia principios similares:
`DEFERRED / DO_NOT_TOUCH_NOW`.

Se abre sólo después de cerrar el stack paralelo LibreChat.
