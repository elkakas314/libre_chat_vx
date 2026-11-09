# LibreChat VX Skills — CURRENT

Canonical source: `skills/<name>/SKILL.md`. Distribution: GitHub Skill Sync (preferred) or filesystem deployment Skills.

## Active catalog: 10

- `nostromo-core`: conversation, intent/referents, tool budget and lightest native path.
- `nostromo-visualization`: information-shape presentation.
- `nostromo-research`: public research.
- `nostromo-event-triage`: incoming events and notices.
- `nostromo-evidence-first`: fresh readback/verification.
- `nostromo-resource-navigation`: lazy files/resources.
- `manojos3-nostromo`: MANOJOS3 read-only cockpit projection.
- `vx13-nostromo`: VX13 cockpit projection.
- `cross-target-read`: read-only cross-target comparisons.
- `nostromo-extension-review`: anti-monolith/backlog criba on demand.

## Legacy compatibility aliases (not active catalog)

- `nostromo-intent-translation` → absorbed by `nostromo-core`.
- `nostromo-tool-budget` → absorbed by `nostromo-core`.

Both files remain physically present until GitHub Skill Sync LIVE readback and no-regression canary. This means GitHub path scanning may discover **12 physical Skill folders**, despite 10 active names in `config/skills.current.json`. Do not claim 10 LIVE skills or delete the aliases prematurely.

## Rules

1. Native/config before Skill; MCP/Action before custom source.
2. Instructions are never material authority.
3. Keep secrets out of Skills/plugins and commits.
4. No second Kernel/Policy/Governor/executor/ledger/routing authority.
5. The extension review is a review Skill, not a new service.
6. No automatic material retry or authorization from an LLM.
7. `LC-NOSTROMO-SEMANTIC-BRIDGE` is queued for design review; do not create a second semantic engine.

See `config/skills.current.json`, `docs/SKILL_REDUNDANCY_AUDIT_CURRENT.md`, and `docs/BACKLOG_CRIBA_CURRENT.md`.
