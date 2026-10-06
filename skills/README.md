# LibreChat VX Skills

This directory is the canonical source for LibreChat VX deployment/mirrored Skills.

## Rules

1. Prefer native LibreChat capability or configuration before adding code.
2. Use a Skill for reusable instructions, procedures, tool-selection rules and read-only operating discipline.
3. Use MCP/Actions for external tools and services instead of patching LibreChat core.
4. Agent Plugins are optional packaging; they are not a second runtime or authority layer.
5. A Skill never creates target authority, grants, receipts, evidence or material completion.
6. Keep Skills small, target-specific only when necessary, and free of secrets.

## Canonical Skills

- `nostromo-core` — one-voice cockpit behavior and focus discipline.
- `nostromo-evidence-first` — truth/readback/receipt discipline.
- `nostromo-resource-navigation` — files, cloud resources and generic hierarchical resource browsing.
- `nostromo-tool-budget` — least-cost native-tool selection and deferred-tool discipline.
- `manojos3-nostromo` — MANOJOS3 cockpit behavior.
- `vx13-nostromo` — VX13 cockpit behavior.
- `cross-target-read` — read-only cross-target comparison.

## Distribution

Preferred order:

1. GitHub Skill Sync from this `skills/` directory.
2. Standalone deployment Skills via `DEPLOYMENT_SKILLS_DIR`.
3. Experimental Agent Plugin bundle only when Skills + MCP + hooks genuinely belong together.

See `config/librechat-vx.example.yaml`, `config/skills.current.json` and `docs/EXTENSION_STRATEGY_CURRENT.md`.
