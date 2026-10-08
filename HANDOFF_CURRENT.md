# LIBRECHAT HANDOFF CURRENT

Mode: `SOURCE_COMPLETE_LIVE_BINDINGS_PENDING`.
Live: `NO_VERIFICADO`.
Material verified: `false`.
Authority: `false`.

## Latest source evidence: scoped ownership continuity

- Exact SOURCE `73d4da310c980d78104c3aebc8ef90c92b38d233` validated with `source-check` run `37725106400`: 114 tests PASS (0 fail), overlay-smoke SUCCESS.
- A previously OWNED scope does not reopen without explicit FREE; unknown/stale ownership requires reconciliation (not material retry). Independent scopes remain eligible. Readback documented in Drive 30.
- LIVE/target effects remain NO_VERIFICADO; NOSTROMO authority=false, material_verified=false.

## Historical source proof — continuity transplanted

- `LC-CONTINUITY-NO-STOP` exact source head `32e304584788e16a59c3a65248d9f513b81d1140`: GitHub Actions `source-check` run `37724764673` SUCCESS, 112 tests PASS/0 FAIL including nonblocking independent gap selection, overlay-smoke SUCCESS.
- Five living Drive documents 00/10/20/30/40 updated and read back. No LIVE endpoint/target effect was exercised. MANOJOS3/VX13 unchanged.
- Continue `bootstrap → next_eligible → verify/readback → checkpoint → refresh`; scope-level blockers do not halt independent work.

## Historical successor source proof (2026-10-08)

- Source HEAD `874d7e0a49def329973a30416160f076dcf2fc05` with GitHub Actions `source-check` run `37724142946`: SUCCESS; build-test 110 PASS/0 FAIL; overlay-smoke SUCCESS.
- OperatingGap/OperatingProof/Bootstrap JSON Schema reconciliation tested. Semantic material target selection fix remains covered.
- SOURCE proof only: Cloudflare/Skills/Tailscale/research/events/recovery are not LIVE; authority=false; material_verified=false.

## Historical source proof before successor review

- Verified SOURCE baseline head: `60a6bbb974dae26e154d883121f22dd6bca560ce`.
- GitHub Actions: `source-check` run `37709003357` — **SUCCESS**.
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

Source Skills: `skills/<name>/SKILL.md` — 10 active SOURCE catalog entries; two legacy alias files remain until LIVE GitHub Skill Sync compatibility canary.

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

## Operating Canon and semantic design review

The authoritative active backlog is `operating/GAPS_CURRENT.json:gaps[]`; target-later, external/deferred, optional and closed items are separately classified. The `operating/BOOTSTRAP_CURRENT.json` is derived and is not LIVE truth.

`LC-NOSTROMO-SEMANTIC-BRIDGE` is a HIGH-priority design-review idea only. Compare native LibreChat + existing Intent Interpreter, a typed authority=false TargetGateway semantic crosswalk to MANOJOS3 target-owned flows, and (only if proven needed) a read-only declarative vocabulary. Never clone M3 semantic engine or interpret a semantic match as authorization. It is recorded in repo backlog and Drive 30.

Skill consolidation is SOURCE applied: 10 active, two legacy aliases physically present until LIVE Skill Sync canary. A new test validates current OperatingGap/Proof schemas. Proof for post-refactor changes must be read from the source-check run associated with the source-bearing commit, not inferred from earlier CI.

## Semantic review and Operating Canon v8

The Operating Canon v8 now separates actionable `ACTIVE_LIVE` gaps from `TARGET_LATER`, `DEFERRED_EXTERNAL`, `OPTIONAL_REENTRY`, `CLOSED_SOURCE` and `design_review_queue`. Its operational JSON data uses the typed bootstrap field names and is checked by `tests/operating-current-data.test.ts`.

`LC-NOSTROMO-SEMANTIC-BRIDGE` (HIGH / DESIGN_REVIEW_PENDING) records the request for a NOSTROMO-owned semantic vocabulary and an authority=false crosswalk to target-owned MANOJOS3 Intent Flows/Interflows/drivers. Compare native LibreChat + current Intent Interpreter, TargetGateway typed crosswalk and a read-only registry. Never copy MANOJOS3 semantic authority or create a second engine by default.

Skills: 10 active in `config/skills.current.json`; `nostromo-intent-translation` and `nostromo-tool-budget` were absorbed into `nostromo-core` in SOURCE but remain as compatibility aliases until LIVE Skill Sync readback. The new on-demand `nostromo-extension-review` Skill reviews future additions without executing them.

Drive living package: 00 Entry, 10 Design, 20 Operations, 30 Backlog/Closeout, 40 Map. MANOJOS3 transport convergence remains deferred.

## Historical operator checkpoint — 2026-10-08 (successor validated source later)

Read `handoff/LIBRECHAT_VX_CHECKPOINT_RELEVO_20261008.md` **in full** before further work. Created at commit `cb767e69eb8acea36cf0b844e7fe5b657f21a767`. All subsequent HEAD values must be discovered from GitHub, never guessed from this note. The last explicitly confirmed `source-check` PASS before checkpoint is run `37709003357` at `60a6bbb974dae26e154d883121f22dd6bca560ce`. Later documentation, Operating Canon, Skills and checkpoint commits **were not finally validated by the departing operator**, per user request. The next operator owns exact-head CI, Source/GDrive reconciliation and closeout.

Snapshot: NOSTROMO interpretation/visual cockpit; parallel transport canon (1 AI Gateway, seven semantic routes, 0 required Workers, private Tailscale Serve 1, public dedicated CF Tunnel+Access optional 1), mobile read/draft/no material replay, 10 active Skills + 2 legacy aliases pending LIVE sync, `LC-NOSTROMO-SEMANTIC-BRIDGE` HIGH design review, M3 transport migration deferred. LIVE NO_VERIFICADO; MATERIAL_VERIFIED=false. Do not modify MANOJOS3/VX13.

## Política transversal de continuidad del hilo — LC-CONTINUITY-NO-STOP

Aplica el contrato en `operating/LIBRECHAT_OPERATING_CANON.md` y el procedimiento de la plantilla viva 20. No detener un objetivo por el primer bloqueo: clasificar su scope y seguir con otro `next_eligible` independiente, con cambios estrechos `CHANGE → TEST → READBACK → VERIFY → REFRESH`. Conservar el mismo run para efectos inciertos; no blind retry ni autorización inferida de conversación. Tras hitos, actualizar evidencias, CURRENT/HANDOFF/Drive 30. Un hilo nuevo recupera el último checkpoint y no reinicia discovery válido. El objetivo de continuidad no crea ejecución persistente fuera de la sesión ni altera `authority=false`.
