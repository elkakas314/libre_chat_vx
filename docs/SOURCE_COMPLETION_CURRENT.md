# LibreChat VX — SOURCE completion current

Status: `SOURCE_CORE_COMPLETE / EXACT_HEAD_TESTS_PASS / UPSTREAM_OVERLAY_BUILD_PASS / LIVE_NO_VERIFICADO`

Source implementation: `aed4a617d8c19a9761a687da24715cce0ff8c2a9`.

Latest exact-head CI evidence for the interpreter-first refactor: GitHub Actions `source-check` run `37562733264`: `build-test=SUCCESS`, `overlay-smoke=SUCCESS`.

## Source gaps closed

- ProviderStatusView -> Tentáculo HUD inference lane.
- NostromoTargetGateway in-process facade.
- MANOJOS3 MCP TargetAdapter with injected transport and fail-closed material path.
- Generic lazy Resource Tree + React view + cockpit/window integration.
- AdapterCompatibilityReport fail-closed contract.
- Contract tests covering separate inference truth, BOTH/AUTO routing, M3 material fail-closed behavior, lazy tree loading and upstream drift.

## Reclassified as already implemented source

These were previously carried as development backlog but already existed in source:

- TrustedSurfaceHost;
- client cache revoke policy;
- privacy-safe client telemetry;
- UI resource budget;
- Dual Target read/view semantics;
- Cross Target Truth aggregation;
- Readiness Truth;
- one-turn TargetOverride;
- target capability projection contracts.

## Deliberately not fabricated

- VX13 TargetAdapter remains `GATE_EXTERNAL` until VX13 exposes the canonical Tentáculo Link/frontdoor.
- Cloudflare AI Gateway remains `LIVE_NO_VERIFICADO` until authenticated runtime binding and canaries.
- MANOJOS3 adapter remains `UNCONFIGURED` until the real MCP transport is selected and probed.
- No local/host test PASS is claimed; exact-head cloud CI PASS is claimed and evidenced.
- No MANOJOS3 or VX13 repository was changed.

## Remaining closure gates

1. authenticated Cloudflare live route canaries;
2. MANOJOS3 R0 bootstrap/readback/receipt;
3. mobile/reconnect and UNKNOWN_OUTCOME live verification;
4. first minimal governed R2 only after the preceding gates;
5. low-power host measurement;
6. VX13 binding later, when its canonical frontdoor exists.

SOURCE completion is not LIVE completion.


## Pinned upstream overlay CI

GitHub Actions run `37562733264` validated the current refactor lineage against `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`:

- pinned upstream dependency install via its committed lockfile: PASS;
- upstream blob/revision verification: PASS;
- reversible overlay install: PASS;
- copied `@librechat/vx` TypeScript build: PASS;
- LibreChat `frontend:ci` build with the VX bridge: PASS;
- overlay uninstall: PASS;
- clean upstream verification after uninstall: PASS.

This proves source compatibility/build/reversibility for the pinned upstream. It does not prove a deployed host, authenticated Cloudflare routes or target LIVE bindings.


## Purpose refactor — 2026-10-07

Additional SOURCE now implemented and CI-validated:
- dedicated CODIGO inference profile removed;
- INVESTIGAR and VISUALIZAR semantic profiles added;
- Intent Interpreter;
- Presentation Planner;
- Model Registry with active+reserve zero-cost pool;
- Tentaculo Companion cognitive boundary;
- public research policy;
- Agent Events notification envelope;
- Skills for intent translation, visualization, research and event triage;
- configuration hides provider/model operator selection by default.

The existing BuildPanel is retained only as an adaptable external-work/evidence viewer. Programmatic Tool Calling and Code Interpreter remain optional upstream capabilities and are not part of the default NOSTROMO core.

These SOURCE changes do not imply LIVE Cloudflare routes, Skill Sync, Web Search or Agent Events have been canary-tested.
