# REPO LOCATION INDEX — CURRENT

Source-bearing base inspected: `ffd31f79abc1f56433d05d33e5bdbe65b2dd5690`
Tree: `74dadcb525a80f7c7bd967378ccb4fb5aaf32b0e`

SOURCE does not imply LIVE.

## Root

- `CURRENT.json` — current source/live snapshot.
- `HANDOFF_CURRENT.md` — continuation.
- `SOURCE_MANIFEST.json` — provenance/truth order.
- `UPSTREAM.json` — exact LibreChat upstream pin.
- `package.json` — build/test/overlay commands.

## Config

- `config/cloudflare_ai_gateway.current.json` — AI Gateway client/config.
- `config/model_registry.current.json` — model admission/pool.
- `config/provider_candidates.current.json` — provider candidate truth.
- `config/llm_bootstrap.current.json` — provider/profile bootstrap cohort.
- `config/agent_events.current.json` — Agent Events.
- `config/librechat-vx.example.yaml` — Skills, Remote Agents, Web Search, Model Specs.
- `config/parallel_transport.current.json` — transport canon v2 and M3 isolation guards.
- `config/transport_registry.current.json` — resource registry.
- `config/mobile_access.current.json` — mobile route/reconnect policy.
- `config/mobile_recovery.current.json` — mobile/recovery compatibility.
- `config/extension_registry.current.json` — Native→Custom extension order/runtime paths.
- `config/skills.current.json` — Skill catalog.
- `config/targets.example.yaml` — target example config.

## Contracts

- `contracts/transport-resource.schema.json`.
- `contracts/mobile-access.schema.json`.
- `contracts/extension-package.schema.json`.
- plus UiAction, target capability, cross-target truth, background mutation fence and other existing contracts.

## Skills

Canonical path: `skills/<skill-name>/SKILL.md`.

10 active Skills + 2 legacy aliases (12 physical folders):
nostromo-core; nostromo-visualization; nostromo-research;
nostromo-event-triage; nostromo-evidence-first; nostromo-resource-navigation;
manojos3-nostromo; vx13-nostromo; cross-target-read; nostromo-extension-review. Legacy aliases: nostromo-intent-translation and nostromo-tool-budget.

## Plugin

`plugins/vx-nostromo/` — optional experimental Agent Plugin, authority=false.

## Source domains

- `src/intent/` — Intent Interpreter.
- `src/presentation/` — Presentation Planner.
- `src/research/` — Research Policy.
- `src/events/` — Agent Events envelope.
- `src/tentacle/` — Tentáculo Companion.
- `src/llm/` — gateway/Cloudflare client/registry/status/identity/output validation.
- `src/targets/` — in-process NostromoTargetGateway.
- `src/adapters/` — target boundaries.
- `src/resources/` — Resource Tree/resource budget.
- `src/cockpit/` and `src/ui/` — cockpit/read models/renderers.
- `src/mobile/` — continuity, recovery, offline draft, push refresh, remoteAccess policy.
- `src/recovery/`, `src/security/`, `src/session/`, `src/notifications/` — safety/recovery.
- `src/librechat/` — upstream/native surface composition.

## Mobile source

- `src/mobile/mobileContinuity.ts`.
- `src/mobile/mobileRecovery.ts`.
- `src/mobile/offlineDraft.ts`.
- `src/mobile/pushRefresh.ts`.
- `src/mobile/remoteAccess.ts`.

## Scripts

- `scripts/verify-upstream.mjs`.
- `scripts/install-as-workspace.mjs`.
- `scripts/uninstall-overlay.mjs`.
- `scripts/validate-parallel-transport.mjs` — v2 canon + MANOJOS3 collision guards.

## Tests

- `tests/mobile-remote-access.test.ts`.
- `tests/transport-canon.test.ts`.
- existing core/inference/model-registry/intent-events/mobile/target/native/UI/integration tests.
- `tests/REQUIREMENT_TEST_MATRIX.md` — LC-R001…R120.
- `tests/UI_ALL_GATES_CURRENT.md` — UI-ALL-01…11.

## Docs added for the closed design

- `docs/TRANSPORT_CANON_CURRENT.md`.
- `docs/LIBRECHAT_INSTALLATION_OPTIONS_CURRENT.md`.
- `docs/SKILLS_PLUGINS_RUNTIME_LAYOUT_CURRENT.md`.
- `docs/MOBILE_REMOTE_ACCESS_CURRENT.md`.

## Routes

- local web: `:3080`;
- Tailscale Serve -> `:3080`;
- optional Cloudflare Access -> dedicated Tunnel -> `:3080`;
- Agent Events: `/api/agents/v1/events`;
- inference: seven `dynamic/nostromo-*` routes;
- Skills: outbound HTTPS GitHub Skill Sync;
- targets: in-process TargetGateway -> adapters.

## Boundaries

- required Workers=0;
- required Cloudflare Tunnels=0;
- Tailscale Serve=1 baseline;
- no MANOJOS3 resource reuse;
- no target authority in LibreChat;
- no secrets in repo;
- SOURCE PASS does not imply LIVE binding.

## Operating Canon criba files

- `docs/BACKLOG_CRIBA_CURRENT.md` — ACTIVE_LIVE vs deferred/external/source-closed, with semantic review alternatives.
- `docs/SKILL_REDUNDANCY_AUDIT_CURRENT.md` — 10 active Skills, two legacy aliases.
- `tests/operating-current-data.test.ts` — enforces current JSON keys and active gap selection.
- `operating/DRIVE_REFS_CURRENT.json` — live 00/10/20/30/40 references.
