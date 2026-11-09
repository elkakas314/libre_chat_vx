# LibreChat VX — NOSTROMO Extension Creator + Tentáculo HUD tri-target
CURRENT SOURCE CANDIDATE · 2026-11-09 · owner=LIBRECHAT_VX · enabled=false · authority=false

## Qué se conserva
- LibreChat original: Agent Builder, native agents, MCP, OpenAPI Actions, Skills, ToolApproval and Agent Plugins (experimental). Keep native UI and one shared panel slot. Do not build another marketplace, scheduler, Kernel, permissions database or privileged plugin runner.
- Existing `skills/nostromo-extension-review`, `config/extension_registry.current.json`, `plugins/vx-nostromo`, GitHub Skill Sync; do not delete legacy Skills before live readback.
- `NostromoTargetGateway` existing scoped MANOJOS3/VX13; do not rename its protocol IDs until negotiation. The UI label is MANOJOS while the live producer still advertises MANOJOS3; a display alias never proves MANOJOS new runtime.
- Existing `config/transport_registry.current.json`: local web :3080, Tailscale Serve optional, Cloudflare Access edge optional, Cloudflare AI Gateway outbound. No new tunnel for each agent or plugin.

## Deliverable SOURCE
- `src/extensions/extensionCreator.ts` + tests: pure deterministic proposal builder. Five kinds AGENT, SKILL, ACTION, MCP, AGENT_PLUGIN; verified registry precondition; collisions reuse; no embedded secrets; no mutable authority; emits files for review, not installed extensions.
- `agents/nostromo-extension-creator/agent.candidate.json`, Skill `nostromo-extension-creator`: optional native Agent Builder persona in the main LibreChat conversational UI, without a second chat service. Skills stored `skills/`, live mirror only after GitHub Skill Sync verification.
- `src/hud/tentaculoHud.ts`, `src/ui/TentaculoHud.tsx`, `config/tentaculo_hud.current.json`: one context-only, accessible read-only HUD with independent cards MANOJOS, VX13, ORÁCULO; default closed; MANOJOS3 legacy runtime ID accepted only as evidence-bound identity under MANOJOS label. ORÁCULO consultive, VX13 design until Link LIVE. No automatic telemetry.
- Hub typed tree from indexed items (SYSTEM→MODULE→CAPABILITY) with anti-cycles/cross-target checks. Turning an existing Hub item into an Agent generates only a candidate, never a separate VX13 worker, alternate Link or autonomous Mother.

## Intended conversational interaction
User: “Crea un agente para la banda de SHUB con biblioteca, Spotify y Drive”.
1. Native agent NOSTROMO Extension Creator checks current authenticated catalog, asks owner only when missing, filters duplicated roles from existing Skill/MCP/Action/Plugin and obtains source IDs from SHUB.
2. Source builder proposes minimal Agent+Skills and, if needed, a signed MCP/OpenAPI Action descriptor with `servers:[]` or `url:null`, never secrets or public exposure.
3. Show concise diff, capabilities, owner, producer/consumer, evidence, test P/N/C/R/SEC; optional native preview/ToolApproval.
4. Governed GitHub branch CAS/CI/receipts via existing connector or MANOJOS builder; this code never performs this step itself.
5. Owner explicitly authorizes deployment, canary and rollback on a real LibreChat host. Publish only confirmed readback, not HTTP 200 or fixture success.
6. Agent and Hub views retain target ownership: MANOJOS Policy/Kernel, VX13 Link→Switch/Madre/Spawner, ORÁCULO advisory read only.

## MANOJOS transition and runtime evidence
- New repo `elkakas314/MANOJOS` main observed `d4335e9ce3853ece6221e4164b28f127126d5120`; plan D4.1 reports `DESIGN_CANDIDATE_REQUIRES_EXTERNAL_ACCEPTANCE`. It is not evidence of installed MANOJOS.
- Legacy `elkakas314/manojos3` main observed `118203db0ae1cfdc9691255b34e5c54594b99586`; connected MANOJOS5 host status health LIVE v0.4.0 and readiness READY, 287 registry, 15 Skills, `librechat_configured=false` in preceding readback. That is the only authenticated live control plane here. Keep its endpoint labels until handshake; no second core.
- MCP connector of MANOJOS repo `src/manojos/mcp_gateway.py` currently delegates to local MANOJOS3 `127.0.0.1:8787`; `config/gateway.json` declares future port 8890, not proof of running service.

## ChatGPT Plus / free-within-plan model route
Official `Sign in with ChatGPT` (SIWC) for compatible OSS is the only consented path considered; **not** the website, scraping, session cookies, proxy, reverse engineering or API-key impersonation. ChatGPT Plus may share eligible usage with participating apps, subject to plan/weekly limits and availability; not an unlimited free API, not guaranteed ready in LibreChat.
PR #16 SIWC server-only SOURCE modules: PKCE, one-shot loopback, OIDC signature/JWKS, vault, model list, Responses SSE. There is no runtime binding/consent, and no public TLS callback automatically. Test with official documentation and real account before offering as primary engine. Refuse silently paid fallback or credits; keep Cloudflare or other zero-cost verified provider independent.
Sources:
- https://help.openai.com/es-es/articles/20001542-using-your-chatgpt-plan-in-other-apps-and-sites
- https://developers.openai.com/siwc/token-sharing-open-source
- https://docs.librechat.ai/features/agents
- https://docs.librechat.ai/features/mcp
- https://docs.librechat.ai/features/skills

## VX13 alignment (DO NOT WRITE CANON DIRECTLY)
VX13 Maestro v0.9.38 / CURRENT A-91, A-88 Link 78 SOURCE IDs, A-89 LibreChat reconciled; A-87 native spreadsheet matrix. Existing contribution AP-LCVX-001…007 should be reconciled rather than duplicated. Tentáculo HUB is a navigable resource hierarchy and may supply candidate native Agent profiles, HUD contextual across 3 external systems. Producers: Link/Manojos/ORÁCULO; consumers: LibreChat agent/HUD; authorization and receipts never shared. No VX13 FZ approved by this proposal.
The VX13 official LEEME must be read after SOURCE development to ensure contribution layout, IDs, owner review and document placement.

## Source acceptance
- TypeScript build `npm test`, 5-kind generation tests, collision/secret/path negative tests, 3-system HUD freshness/source tests and Hub cycle/tenant boundary tests.
- Reviewer checks security and paths, no activation, fallback, rollback and that any Agent Plugin manifest is experimental. No active native plugin installation or host edit.
- LIVE only after: `librechat:3080` health and version; exact Agent Builder supported API or UI canary; account+Skill Sync/RBAC, OIDC consent; MANOJOS handshake; ORÁCULO advisory and VX13 Link rights readback; desktop/mobile UI approval.
