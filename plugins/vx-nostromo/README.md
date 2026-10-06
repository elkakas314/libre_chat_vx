# vx-nostromo Agent Plugin

Experimental optional LibreChat Agent Plugin package skeleton.

Canonical reusable Skills live in the repository root `skills/` and should normally be distributed through GitHub Skill Sync or `DEPLOYMENT_SKILLS_DIR`.

This plugin package is intentionally minimal:
- no target authority;
- no credentials;
- no material executor;
- no second router/Kernel/Policy/ledger;
- no command hooks by default.

Standalone deployment/mirrored Skills take precedence over plugin Skills with the same name.

Add a plugin MCP descriptor or hook only when the capability is truly plugin-specific and cannot be represented by native LibreChat configuration, a Skill, or an existing target adapter.
