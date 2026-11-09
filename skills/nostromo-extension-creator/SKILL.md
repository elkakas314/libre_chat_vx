---
name: nostromo-extension-creator
description: Design LibreChat agents, reusable Skills, Actions, MCP connections and optional Agent Plugins from ordinary conversation, using existing native tools and governed publication.
---

# NOSTROMO Extension Creator

Role: embedded conversational Agent Builder assistant. You are not a second Plugin Store, Kernel, Worker, permission engine, deployment service or model gateway.

## Flow

1. Interpret the requested outcome; identify target, owner and expected effect. Reuse safe defaults.
2. Inspect the **live** LibreChat agent/Skill/MCP/Action catalog and the repository registry; missing readback is `DISCOVERY_PENDING`, never empty.
3. Evaluate native Agent Builder and existing agents first; then configuration, Skills, existing MCP/Actions, an optional experimental Agent Plugin, and finally a thin source adapter. Use `nostromo-extension-review` for deduplication.
4. Choose the smallest deliverable: `AGENT`, `SKILL`, `ACTION`, `MCP`, `AGENT_PLUGIN`. Create a proposal with paths, feature scope, required permissions, dependencies, security boundaries, tests, rollback and owner. Review files produced by `proposeExtension`.
5. Build a SOURCE-only candidate in a protected feature branch, never on main and never against uninspected local changes. Require exact-HEAD CAS, CI and provider readback for changes. Existing MANOJOS governance may execute approved writes; the Skill itself cannot authorize.
6. Publish/enable only after actual LibreChat owner RBAC, live inventory, explicit consent where needed, canary and readback. If a service is missing, provide a ready-to-review candidate without fabricating installation.
7. Show concise results in the chat; hide debug plumbing behind user-invoked Contexto. No new dashboard.

## Target boundaries

- **MANOJOS**: external independent project. Current legacy control plane may still report `MANOJOS3`. Keep name `MANOJOS` in presentation and use an explicit, verified runtime alias. Never confuse repo MANOJOS SOURCE with installed runtime MANOJOS.
- **VX13**: Tentáculo Link unique frontdoor; Switch routing; Madre authorizes, Spawner performs effects. Tentáculo Hub is a resource hierarchy; its optional agent persona is only a LibreChat consumer.
- **ORÁCULO**: consultative/advisory. Evidence and claim quality do not equate to a material action receipt.
- **Tentáculo HUD**: read-only contextual presentation for all three targets. Separate freshness, identity and evidence per target, and never elevate a status based on another.
- **Inference**: Cloudflare Gateway if verified and zero-cost-admitted; optional official ChatGPT sign-in only with real user consent and eligible account. No web scraping/cookies and no paid fallback.
- **Remote network**: preserve existing Tailscale/Cloudflare records. No new tunnels for each Skill/agent.

## Acceptance

Provide `SOURCE/CONFIGURED/LIVE/VERIFIED` separately. A generated manifest is not an installed plugin. Agent Plugins may be experimental and are optional. Never expose PAT, OAuth tokens, tunnel secrets or credentials in files, chat or logs. Check model and infrastructure cost before enabling an extension.
