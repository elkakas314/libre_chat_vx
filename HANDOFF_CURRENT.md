# LIBRECHAT HANDOFF CURRENT

Mode: `SOURCE_COMPLETE_LIVE_BINDINGS_PENDING`.
Live: `NO_VERIFICADO`.
Material verified: `false`.
Authority: `false`.

## Exact source proof

- SOURCE-bearing head: `ffd31f79abc1f56433d05d33e5bdbe65b2dd5690`.
- GitHub Actions: `source-check` run `37667119803` — **SUCCESS**.
- build-test: **SUCCESS**.
- parallel transport isolation v2: **SUCCESS**.
- pinned upstream verify/install/build/uninstall/clean: **SUCCESS**.
- upstream pin: `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`.

## Canonical architecture

```text
User
  ↓
LibreChat / NOSTROMO
  ├─ conversation + context + Files/RAG + native surfaces
  ├─ Tentáculo HUD / Companion
  ├─ Intent Interpreter + Research Policy + Presentation Planner
  ├─ NostromoInferenceGateway
  │    ↓
  │  Cloudflare AI Gateway (1)
  │    ↓
  │  7 dynamic/nostromo-* routes
  │    ↓
  │  admitted zero-cost provider/model pool
  └─ NostromoTargetGateway (in-process, authority=false)
       ├─ MANOJOS3 adapter -> MANOJOS3 MCP (future LIVE binding)
       ├─ VX13 adapter -> Tentáculo Link/frontdoor (future)
       └─ ORÁCULO advisory
```

## Transport canon

- Required Cloudflare Workers: **0**.
- Optional narrow event-normalizer Worker: **max 1**, only if Agent Events cannot be emitted directly.
- Required Cloudflare Tunnels: **0**.
- Optional public web/API tunnel: **1**, always behind Access.
- Tailscale Serve private route: **1**, baseline for mobile/remote.
- Tailscale Services: **0 baseline**; optional for multi-host/HA.
- Funnel: **0**.
- Secure MCP Tunnel for LibreChat: **0**.
- No MANOJOS3 tunnel/Worker/hostname/port is reused.

## LLM bootstrap

First providers to probe:
1. Cloudflare Workers AI.
2. Groq.
3. Google AI Studio/Gemini.

Reserve:
4. Mistral.
5. OpenRouter Free.

Exact model IDs are LIVE discovery data.
No automatic paid fallback.
A profile may run with fewer than six active models; never fill the target pool with paid/unverified candidates.

## Mobile/remote

- One backend/history across PC and mobile.
- Route priority: LOCAL -> TAILSCALE_PRIVATE -> CLOUDFLARE_ACCESS_PUBLIC optional.
- Offline = cached read + text draft only.
- Reconnect refreshes session/ACL/target truth.
- Cognitive streams may resume.
- Material target requests never replay.
- Possible prior effect = UNKNOWN_OUTCOME + target readback.
- Push/events are opaque hints; opening triggers fresh authenticated fetch.
- Recovery is outside LibreChat: host service + Tailscale SSH when deployed.

## Skills/plugins

Source Skills: `skills/<name>/SKILL.md` — 11 canonical Skills.

Preferred distribution: GitHub Skill Sync.

Filesystem fallback:
`DEPLOYMENT_SKILLS_DIR=./skill`.

Agent Plugin:
`plugins/vx-nostromo` source;
runtime `DEPLOYMENT_PLUGINS_DIR=./plugin`;
persistent data `DEPLOYMENT_PLUGIN_DATA_DIR=./data/plugins`;
command hooks disabled unless explicitly enabled.

Extension order:
`NATIVE -> CONFIG -> SKILL -> MCP/ACTION -> AGENT_PLUGIN -> THIN_WRAPPER -> CUSTOM_SOURCE`.

## Installation decision

Documented candidates:
- Docker Compose — official default/reproducible candidate.
- npm — single-host low-overhead candidate, only if Lenovo measurement wins.
- Helm — not baseline for single Lenovo.
- remote hosting — not baseline.

Single LibreChat instance uses in-memory resumable streams.
Redis is not needed solely for PC/mobile continuity until multi-instance/horizontal scaling.

## Live/external gaps in order

1. Cloudflare AI Gateway LIVE provider/account probes + seven route canaries + rollback.
2. GitHub Skill Sync LIVE.
3. Tailscale Serve mobile/reconnect/revoke/rollback.
4. Web Research canary.
5. Agent Events canary and mobile notifications.
6. Out-of-band recovery.
7. MANOJOS3 R0, ORÁCULO advisory, VX13 when canonical.
8. First governed material canary.

## Truth invariants

- connection != readiness != work != evidence;
- provider READY != target READY;
- event != authorization != receipt;
- ToolApproval != target authorization;
- model output never mints authorization/PASS/receipt/evidence;
- AUTO/BOTH never mutate;
- reconnect/failover/device handoff never replays material work;
- no secrets in repo/Drive/HUD/Skills;
- UI/Tentáculo/Artifact/tunnel/Worker are authority=false.

## Living documentation

Drive package:
00 Entry/CURRENT/Bootstrap -> 10 Design -> 20 Operations -> 30 Closeout/Handoff -> 40 Map/Coverage.

The matrix remains the detailed capability/IDEA decision register.

MANOJOS3 transport convergence remains a separate `DEFERRED / DO_NOT_TOUCH_NOW` item.
