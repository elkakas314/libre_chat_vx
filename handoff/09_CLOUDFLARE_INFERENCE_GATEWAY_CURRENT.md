# CLOUDFLARE INFERENCE GATEWAY CURRENT

Date: 2026-10-07
Status: SOURCE_IMPLEMENTED / LIVE_NO_VERIFICADO
Authority: false

## Decision

LibreChat/NOSTROMO will use Cloudflare AI Gateway as the preferred REMOTE inference gateway.

MANOJOS3 LiteLLM remains in MANOJOS3 during migration, but its role is narrowed:
- internal/advisory reasoning for MANOJOS3;
- compatibility with existing MANOJOS3 flows;
- optional fallback for governed internal consumers;
- NOT the primary inference gateway for LibreChat.

No removal of MANOJOS3 LiteLLM is allowed until migration + canaries + rollback are proven.

## Separation of planes

LibreChat/NOSTROMO owns:
- conversation UX;
- identity/personality;
- context;
- files/RAG;
- semantic profile selection;
- detection of conversational vs material intent;
- Tentáculo HUD rendering.

Cloudflare AI Gateway owns:
- remote inference routing;
- provider/model selection;
- provider fallback;
- rate/budget limits;
- gateway analytics/health;
- zero-cost route admission controls where enforceable.

MANOJOS3 owns:
- natural objectives;
- Intent/Interflow;
- Governor/Policy;
- Kernel/driver;
- authorization;
- readback;
- Verifier;
- Receipt;
- material recovery/reconciliation.

Tentáculo HUD observes all planes but has authority=false.

## Primary flow

Normal conversation:
LibreChat -> Cloudflare AI Gateway -> admitted provider/model -> stream -> LibreChat.

Material objective:
LibreChat/NOSTROMO may use inference to understand/classify, then sends the natural objective to MANOJOS3 MCP.
MANOJOS3 executes through Governor/Policy/Kernel/Verifier/Receipt.
Changing provider/model never changes target, grants, run id, or authority.

## Provider profiles

Profiles stay semantic and internal:
- Rápido
- Normal
- Pensar
- Investigar
- Visualizar
- Contexto largo
- Visión

There is no dedicated coding profile. NOSTROMO interprets coding-related intent and routes it to the appropriate specialist target.

Concrete provider/model names remain advanced diagnostic detail in Tentáculo HUD.

Cloudflare dynamic routes map semantic profiles to a bounded active pool of admitted provider/models while a broader Model Registry keeps additional zero-cost candidates in reserve.
The route name is configuration, not authority.

## Cloudflare transport and cost rules

Cloudflare AI Gateway core routing/caching/rate limiting may be used on the free plan, but upstream provider inference can still cost money.

Therefore:
- unified billing is NOT enabled by default;
- no preloaded paid credits as a prerequisite;
- provider keys are BYOK/SecretRef only;
- routes eligible for LibreChat default profiles must be zero-cost for the actual account at LIVE readback;
- budget/rate controls fail closed;
- no automatic escalation to paid provider/model;
- free-tier exhaustion returns degraded/unavailable or another admitted zero-cost route.

Workers AI can be a provider route, but its own free allocation is treated as quota, not permanent free capacity.

## Security

Cloudflare gateway authentication ON.
Secrets never stored in repo, Drive, prompt, HUD or receipts.
Cloudflare is transport/inference routing only and authority=false.
A Cloudflare Worker may optionally act as a thin edge policy/auth layer, but must not become:
- MANOJOS3 Governor;
- material executor;
- receipt authority;
- another orchestration kernel.

## Search/tools

Provider-native web search/tool features may be used for cognitive research only when capability-readback says available.

Operational truth continues to use explicit tools/connectors/MANOJOS3 readback.
LLM web search output is not material evidence.

## MANOJOS3 LiteLLM retention policy

Phase 1 — KEEP:
- leave current MANOJOS3 LiteLLM service/config untouched as working internal infrastructure;
- LibreChat stops depending on it for its main conversation path.

Phase 2 — DUAL CANARY:
- LibreChat primary = Cloudflare AI Gateway;
- MANOJOS3 internal reasoning = local LiteLLM;
- verify no circular dependency and no duplicated routing policy.

Phase 3 — REVIEW:
Measure whether MANOJOS3 still needs LiteLLM for:
- OpenCode/advisory agents;
- internal semantic/reasoning flows;
- local/offline fallback;
- compatibility.

Only if none require it, decommission through a separate governed change.
Default recommendation: keep LiteLLM internal unless it becomes demonstrably redundant.

## Failure behavior

Cloudflare unavailable:
- LibreChat may fall back only to another explicitly admitted inference route.
- MANOJOS3 material state remains unaffected.
- existing MANOJOS3 LiteLLM may be used only if explicitly configured as an inference fallback and proven reachable.

Upstream provider quota exhausted:
- the exhausted candidate leaves the active pool;
- another admitted zero-cost reserve candidate may be promoted through a versioned route update/canary;
- dynamic route may move only to another admitted zero-cost route;
- otherwise mark provider DEGRADED/UNAVAILABLE.

MANOJOS3 unavailable:
- conversation can continue through Cloudflare;
- material actions disabled;
- HUD shows target unavailable.

Lenovo offline:
- remote LibreChat conversation may continue if its backend is reachable;
- MANOJOS3 material actions unavailable until Lenovo/target returns;
- no offline mutation replay.

## New gates

- CF-AIG-CONFIG: authenticated gateway + versioned dynamic routes, no secrets in repo.
- CF-AIG-LIVE: LibreChat can stream through the gateway.
- CF-AIG-ZERO-COST: actual default route cannot select paid inference.
- CF-AIG-FAILOVER: provider failure switches only to admitted zero-cost route.
- CF-AIG-IDENTITY: Nostromo identity remains stable across providers.
- CF-AIG-AUTHORITY: provider/model/route change cannot alter target/grant/run.
- M3-LITELLM-INTERNAL: MANOJOS3 internal LiteLLM still serves existing internal consumers after LibreChat decoupling.
- DUAL-ROUTER-NO-LOOP: no request loop Cloudflare <-> MANOJOS3 LiteLLM.

## Promotion rule

Cloudflare design in SOURCE does not mean LIVE.
LibreChat remains LIVE_NO_VERIFICADO until all Cloudflare binding gates and existing M3 read/material gates pass.

NEXT_IMPLEMENTATION_ACTION=Discover and verify zero-cost model candidates, build versioned INVESTIGAR/VISUALIZAR and other semantic routes, canary the active+reserve pool, and keep MANOJOS3 LiteLLM unchanged until later target integration.


## Model Registry CURRENT

SOURCE implements a provider/model registry separate from route deployment.

Default source policy:
- broad candidate catalog;
- target 6 active admitted candidates per semantic profile;
- all other admitted candidates remain reserve;
- reject billable, exhausted, stale or unevidenced candidates;
- create a new Dynamic Route version before any route change;
- canary before deployment;
- keep rollback to the previous version.

LibreChat may propose route changes but does not store a broad Cloudflare administration credential.
