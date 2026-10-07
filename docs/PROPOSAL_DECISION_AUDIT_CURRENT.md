# LibreChat VX — Proposal Decision Audit CURRENT

Date: 2026-10-07
Status: RECONCILED_SOURCE / LIVE_ACCOUNT_PROBES_PENDING

## Decisions integrated now

- NOSTROMO is interpreter + visual cockpit + conversation coordinator, not a coding worker.
- Dedicated CODIGO profile is removed.
- INVESTIGAR and VISUALIZAR are first-class semantic profiles.
- Model Registry keeps a broad candidate pool and a bounded active pool; current source target is 6 active candidates per profile, with all other admitted models in reserve.
- GitHub Skill Sync is the canonical Skill distribution path; no Worker or MANOJOS3 hop is required.
- Native Web Search is the baseline for public research.
- Keenable keyless is the lowest-complexity baseline; SearXNG/Firecrawl are optional self-hosted upgrades, not prerequisites.
- Tentáculo Companion is cognitive/read-only and can interpret, research, visualize, navigate resources and triage events.
- Agent Events is the preferred inbound system notification surface.
- TargetGateway remains the outbound target-action boundary.
- Tailscale Serve remains preferred for private mobile access.
- Cloudflare Tunnel + Access remains an optional separate public-web plane.
- Existing MANOJOS3 Action remains untouched and may later serve compatibility/recovery.

## Corrections to supplied proposals

1. GitHub Models must not be included in the provider pool: it was fully retired on 2026-07-30.
2. Cerebras should be treated as trial/promotional rather than durable zero-cost capacity.
3. SambaNova is not currently admitted as zero-cost because its current plan page requires payment/credits.
4. Pollinations no longer fits the simple "no key" assumption for generation; current key/Pollen economics must be verified.
5. OpenRouter Free is useful as reserve, but the current published free limit is 50 requests/day rather than assuming a higher fixed RPD.
6. Groq rate limits are model-specific; never encode one universal RPM/RPD value.
7. Google Gemini free limits are model/project-specific and should be read from AI Studio.
8. Mistral Free mode is valid, but exact quotas belong to the account Limits view, not a hard-coded table.

## Useful additions discovered during reconciliation

### Cloudflare Access in front of AI Gateway

AI Gateway supports a custom domain protected by Cloudflare Access. This can reduce reliance on directly handing the application an account-scoped AI Gateway Run token. It should be evaluated during LIVE binding.

### Cloudflare dynamic routing absorbs router complexity

Dynamic Routes already provide conditions, model fallback, rate/budget nodes, versions and rollback. Therefore the future Router Steward should be a small registry/route compiler + canary/deploy controller, not a new routing daemon.

### Remote Agents permissions

LibreChat's `interface.remoteAgents` can seed Agents API use/create permissions. Ongoing permission management should use the Admin Panel rather than treating YAML as the permanent authority.

## Web research stack

Baseline:
- Keenable search + fetch keyless;
- reranker none;
- no extra daemon.

Optional upgrade:
- SearXNG when privacy/control/search quality justifies self-hosting;
- Firecrawl when clean extraction materially improves results.

Do not deploy SearXNG + Firecrawl merely because they are supported.

## Event modes

Baseline notifications use Agent Events `fire`.
`continue` and `steer` remain optional until conversation-control semantics are canary-tested.

## Provider truth

See `config/provider_candidates.current.json`.
No provider row is LIVE-admitted until current credentials/account limits and zero-cost status are probed.
