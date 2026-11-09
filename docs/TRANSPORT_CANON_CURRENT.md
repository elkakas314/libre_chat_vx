# TRANSPORT CANON — CURRENT

Status: SOURCE_CANON_COMPLETE / LIVE_NOT_DEPLOYED
Authority: false

## Canonical counts

- Cloudflare AI Gateway: 1 (`librechat-vx-nostromo`).
- Dynamic Routes: 7 — RAPIDO, NORMAL, PENSAR, INVESTIGAR, VISUALIZAR, CONTEXTO_LARGO, VISION.
- Required Cloudflare Workers: 0.
- Optional Cloudflare Workers: max 1 without architecture review, only for event normalization when an external producer cannot emit LibreChat Agent Events directly.
- Cloudflare Tunnel: 0 required, 1 optional dedicated public web/API tunnel.
- Tailscale Serve: 1 baseline private remote route.
- Tailscale Services: 0 baseline; optional for multi-host/HA/stable service identity.
- Tailscale Funnel: 0.
- OpenAI Secure MCP Tunnel for LibreChat: 0.

## Planes

### Local access
Browser/app -> LibreChat VX -> 127.0.0.1:3080.

### Private remote/mobile
Mobile/PC -> Tailscale identity + ACL -> Tailscale Serve -> 127.0.0.1:3080.

### Public remote optional
Browser/API -> Cloudflare Access -> dedicated Tunnel `librechat-vx-web` -> 127.0.0.1:3080.

The same LibreChat-owned tunnel may expose separate hostnames for human UI and machine Agent Events with different Access policies. Do not create one tunnel per source.

### Inference
LibreChat -> Cloudflare AI Gateway -> `dynamic/nostromo-*` -> admitted provider/model.

AI Gateway is not a tunnel and never transports target material actions.

### Skills
LibreChat -> outbound HTTPS -> GitHub Skill Sync -> `elkakas314/libre_chat_vx/skills`.

### Events
Source -> authenticated LibreChat Agent Events -> Tentáculo triage -> user.

### Targets
LibreChat -> NostromoTargetGateway -> target adapter -> target frontdoor/authority chain.

No public target router is added.

## Worker policy

Baseline has no Worker.

Optional `librechat-vx-event-normalizer` is admitted only when a source cannot speak Agent Events directly. It may validate and normalize a narrow webhook payload and forward it. It must not:
- hold broad Cloudflare administration credentials;
- manage AI Gateway routes;
- write the repository;
- mint authorization;
- execute target actions.

Router Steward is NOT a public Worker. It is a future controlled admin-side capability/script that compiles an admitted Model Registry into a route version, runs a canary, deploys and can roll back.

## LLM bootstrap cohort

First providers to probe:
1. Cloudflare Workers AI.
2. Groq.
3. Google AI Studio / Gemini.

Reserve:
4. Mistral.
5. OpenRouter Free.

Exact model IDs remain LIVE discovery data. A profile may begin with fewer than six active models. Never admit a paid or unverified model merely to fill the target pool size.

## CLI/API automation

Cloudflare:
- Wrangler tunnel commands are allowed for discovery/create/info/run/delete, but are treated as experimental and always followed by readback.
- Wrangler/Cloudflare API changes use narrow tokens and resource-specific wrappers.
- Route changes are versioned: candidate -> version -> canary -> deploy -> readback -> rollback.

Tailscale:
- `tailscale serve status/get-config/set-config/advertise/drain` are the preferred declarative/readback path.
- OAuth clients are preferred for durable API automation because scopes are explicit and access tokens are short-lived.
- Services stay optional until multi-host/HA provides real value.

## Mobile invariants

Same backend/history across desktop and mobile.
Route priority: LOCAL -> TAILSCALE_PRIVATE -> CLOUDFLARE_ACCESS_PUBLIC optional.
Offline permits cached read/draft only.
Reconnect refreshes session, ACL and target truth.
Cognitive streams may resume.
Material requests never replay automatically.
Possible prior material effect after disconnect -> UNKNOWN_OUTCOME -> target readback.

## MANOJOS3

No current MANOJOS3 tunnel, Worker, hostname, port or route is reused.
Future convergence of MANOJOS3 transports is DEFERRED / DO_NOT_TOUCH_NOW and lives only in pending/closeout documentation until LibreChat transport canaries pass.
