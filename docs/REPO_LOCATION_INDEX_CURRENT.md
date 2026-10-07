# REPO LOCATION INDEX — CURRENT

Base inspeccionada: `db9919f73be80184385b3084b7ac0865feebabc5`
Árbol base: `91211e87f6ccbc38afeb1d6f7f2927d42c546d58`

Este índice responde “dónde vive cada cosa” en el estado SOURCE actual.
SOURCE no equivale a LIVE.

## Root

- `CURRENT.json` — snapshot SOURCE/LIVE y siguiente orden.
- `HANDOFF_CURRENT.md` — continuidad.
- `SOURCE_MANIFEST.json` — procedencia/prioridad.
- `UPSTREAM.json` — pin exacto de LibreChat upstream.
- `package.json` — build/test/scripts del paquete.

## Config

- `config/cloudflare_ai_gateway.current.json` — AI Gateway SOURCE.
- `config/model_registry.current.json` — admisión/pool.
- `config/provider_candidates.current.json` — candidate truth.
- `config/agent_events.current.json` — eventos entrantes.
- `config/librechat-vx.example.yaml` — Skills, Remote Agents, Web Search y Model Specs.
- `config/parallel_transport.current.json` — aislamiento Tailscale/Cloudflare/targets.
- `config/mobile_recovery.current.json` — móvil/recovery.
- `config/skills.current.json` — catálogo de Skills.
- `config/targets.example.yaml` — targets de ejemplo.

## Skills

Ruta canónica: `skills/`.

11 Skills:
- nostromo-core;
- nostromo-intent-translation;
- nostromo-visualization;
- nostromo-research;
- nostromo-event-triage;
- nostromo-evidence-first;
- nostromo-resource-navigation;
- nostromo-tool-budget;
- manojos3-nostromo;
- vx13-nostromo;
- cross-target-read.

## Plugin

`plugins/vx-nostromo/` — Agent Plugin experimental/opcional, authority=false.

## Source domains

- `src/intent/` — Intent Interpreter.
- `src/presentation/` — Presentation Planner.
- `src/research/` — Research Policy.
- `src/events/` — Agent Events.
- `src/tentacle/` — Tentáculo Companion.
- `src/llm/` — inference gateway, Cloudflare client, Model Registry, identity/status.
- `src/targets/` — NostromoTargetGateway.
- `src/adapters/` — target boundaries.
- `src/resources/` — Resource Tree/resource budget.
- `src/cockpit/` — truth/focus/lifecycle/views.
- `src/ui/` — React projections.
- `src/mobile/`, `src/recovery/`, `src/security/`, `src/session/`, `src/notifications/` — continuity/security/recovery.
- `src/librechat/` — native surface binding/reuse.

## Scripts

- `scripts/verify-upstream.mjs`.
- `scripts/install-as-workspace.mjs`.
- `scripts/uninstall-overlay.mjs`.
- `scripts/validate-parallel-transport.mjs`.

## Tests

Source tests:
- core;
- inference gateway;
- model registry;
- intent/presentation/events;
- Nostromo/hybrid;
- MANOJOS3 entrypoints/interflow;
- native surfaces;
- mobile recovery;
- target parity/semantics;
- operating canon;
- UI;
- integration completion.

Gate documents:
- `tests/REQUIREMENT_TEST_MATRIX.md` — LC-R001…R120;
- `tests/UI_ALL_GATES_CURRENT.md` — UI-ALL-01…11;
- `tests/README.md` — global gate inventory.

## Overlay

`overlay/` — bridge reversible sobre upstream fijado.

## Network/application routes

- LibreChat local: `:3080`.
- Private remote: Tailscale Serve → `:3080`.
- Public optional: Cloudflare Access → dedicated Tunnel → `:3080`.
- Agent Events: `/api/agents/v1/events`.
- LLM: `dynamic/nostromo-*`.
- Skills: outbound HTTPS → GitHub Skill Sync.
- Targets: in-process NostromoTargetGateway → adapters.

## Boundary

- No target authority in LibreChat.
- No secrets in repo.
- MANOJOS3 transport migration remains DEFERRED.
- SOURCE tests/overlay PASS do not imply LIVE bindings.
