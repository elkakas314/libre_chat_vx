# LIBRECHAT HANDOFF CURRENT

Mode: `SOURCE_ONLY`.
Live: `NO_VERIFICADO`.
Material verified: `false`.
Authority: `false`.

## Canonical architecture

```text
User
  ↓
LibreChat / NOSTROMO
  ├─ Conversation + Context + Files/RAG + native LibreChat surfaces
  ├─ Tentaculo HUD / Cockpit
  ├─ NostromoInferenceGateway
  │    ↓
  │  Cloudflare AI Gateway
  │    ↓
  │  admitted provider/model
  └─ NostromoTargetGateway (in-process, authority=false)
       ├─ MANOJOS3 adapter -> MANOJOS3 MCP -> Governor/Policy/Kernel -> Verifier/Receipt
       └─ VX13 adapter -> Tentaculo Link/canonical VX13 frontdoor (future)
```

Cloudflare AI Gateway and NostromoTargetGateway are different things:
- Cloudflare routes cognitive inference.
- NostromoTargetGateway decouples the LibreChat UI from target-specific transports.
- Neither owns material authority.

## Inference

Primary LibreChat inference: `CLOUDFLARE_AI_GATEWAY`.

Semantic profiles:
- RAPIDO;
- NORMAL;
- PENSAR;
- INVESTIGAR;
- VISUALIZAR;
- CONTEXTO_LARGO;
- VISION.

Provider capabilities:
- TEXT;
- VISION;
- AUDIO;
- STRUCTURED_OUTPUT;
- TOOLS;
- LONG_CONTEXT.

Admission is fail-closed on health, quota, capability, context fit, privacy, freshness and verified zero-cost route. Paid automatic fallback is forbidden.

NOSTROMO identity belongs to LibreChat and must remain stable across provider/model/profile changes.

MANOJOS3 LiteLLM remains internal/advisory/OpenCode/compatibility infrastructure and is not the primary LibreChat router.

## LibreChat capabilities

### Implemented in SOURCE
- conversation/Nostromo cockpit;
- Tentaculo HUD model and StatusRail/truth lanes;
- CurrentFocus and referential continuity;
- contextual window routing;
- ArtifactDock and evidence/receipt projection;
- Interactive Artifact -> UiIntent;
- PlanGraph, ActiveFlow and TargetRun projections;
- Files/Audio/Browser/external-work/Background panels;
- mobile/recovery semantics;
- resumable UI/conversation streams without material replay;
- semantic inference profiles;
- strict zero-cost provider admission;
- Cloudflare AI Gateway client contract;
- versioned NOSTROMO identity;
- structured cognitive-output validation;
- provider status projection;
- MANOJOS3 entrypoint descriptors and semantic projection.

### Native LibreChat surfaces to reuse
- Agents;
- Artifacts;
- MCP/MCP UI;
- ToolApproval;
- Skills;
- Subagents;
- background tool calls;
- Files/RAG;
- Speech;
- resumable streams;
- ACL;
- SidePanel.

### SOURCE additions CURRENT
- Intent Interpreter;
- Presentation Planner;
- Tentaculo Companion (cognitive, authority=false);
- public-research policy using Web Search/read before browser interaction;
- Agent Events delivery envelope for MANOJOS3/VX13/ORACULO notifications;
- Model Registry with broad zero-cost candidate catalog, active pool and reserve pool;
- GitHub Skill Sync catalog for intent/visualization/research/event triage;
- provider status -> Tentaculo HUD bridge;
- NostromoTargetGateway implementation;
- exact-head source and pinned-upstream overlay revalidation: PASS.

### Live/external gates
- real Cloudflare AI Gateway binding;
- zero-cost/readiness/capability canaries;
- MANOJOS3 R0 binding/readback/receipt from LibreChat;
- mobile/backend live verification;
- VX13 runtime/frontdoor binding;
- ORACULO live advisory path;
- first governed R2 material canary.

## Target boundary

MANOJOS3 current path:
`LibreChat -> NostromoTargetGateway -> MANOJOS3 adapter -> MANOJOS3 MCP -> target governance/readback/receipt`.

VX13 future path:
`LibreChat -> NostromoTargetGateway -> VX13 adapter -> Tentaculo Link/canonical VX13 frontdoor -> VX13 authority chain`.

MCP therefore stays below the target gateway as a MANOJOS3-specific transport. LibreChat UX does not depend on every future target speaking MCP.

## Safety and truth invariants

- connection != readiness != work != evidence;
- provider READY != target READY;
- work finished != material verified;
- ToolApproval != target authorization;
- model output never mints authorization, PASS, receipt or evidence;
- provider failover/reconnect/device handoff never replays a material request;
- UNKNOWN_OUTCOME requires target readback before retry;
- AUTO/BOTH never mutate;
- no secrets in repo/Drive/HUD/receipts;
- local model is optional;
- no automatic paid fallback.

## Current gaps in order

1. Cloudflare AI Gateway LIVE binding + Model Registry discovery + semantic-route canaries;
2. native Web Search/research canary;
3. GitHub Skill Sync canary;
4. Agent Events notification canary;
5. private/mobile transport canary and reconnect/rollback proof;
6. MANOJOS3 R0 only after the parallel LibreChat stack is frozen;
7. VX13 adapter remains feature-gated until VX13 runtime/frontdoor is canonical;
8. first governed material canary only after the previous gates.

## Proof boundary

Current-head full test suite: `PASS` — GitHub Actions run `37562733264`.
Pinned-upstream overlay build/install/uninstall: `PASS` — GitHub Actions run `37562733264`.
Cloudflare live: `NO_VERIFICADO`.
MANOJOS3 touched by this LibreChat consolidation: `NO`.
VX13 touched by this LibreChat consolidation: `NO`.


## Purpose consolidation — 2026-10-07

LibreChat VX / NOSTROMO is now explicitly optimized for conversation, intent interpretation, referential understanding, unified visualization, public research and event/notification coordination.

Dedicated coding specialization was removed from the inference identity. NOSTROMO can understand coding-related requests but translates them to the appropriate specialist target instead of acting as a coding worker.

Internal semantic profiles are now:
`RAPIDO / NORMAL / PENSAR / INVESTIGAR / VISUALIZAR / CONTEXTO_LARGO / VISION`.

Tentaculo Companion is a lightweight cognitive helper for read-only observation, research, resource navigation, visual composition and event triage. It remains authority=false.

Canonical Skills are distributed directly from GitHub Skill Sync. Inbound external notifications use LibreChat Agent Events. Public research uses native Web Search/read before browser interaction.

Cloudflare AI Gateway uses a broad zero-cost candidate registry with an active target of 6 admitted models per profile and additional admitted reserve candidates. Route changes are versioned, canaried and rollback-capable.

Parallel transport remains isolated from MANOJOS3 until LibreChat LIVE canaries pass.
