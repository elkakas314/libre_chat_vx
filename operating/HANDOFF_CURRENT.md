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
- CODIGO;
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
- Files/Audio/Browser/Build/Background panels;
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

### Partial / open source work
- provider status -> live Tentaculo HUD bridge;
- NostromoTargetGateway implementation;
- semantic Model Specs -> Cloudflare dynamic-route wiring;
- AUDIO route/canary;
- exact-head source revalidation;
- pinned upstream overlay revalidation.

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

1. exact-HEAD source tests;
2. provider-status -> HUD source bridge;
3. NostromoTargetGateway source facade;
4. pinned upstream overlay/build revalidation;
5. Cloudflare live binding + semantic routes + zero-cost proof;
6. MANOJOS3 R0 through target adapter;
7. VX13 adapter remains feature-gated until VX13 runtime/frontdoor is canonical;
8. first governed material canary only after the previous gates.

## Proof boundary

Current-head full test suite: `NOT_RUN`.
Overlay live/build: `NOT_RUN`.
Cloudflare live: `NO_VERIFICADO`.
MANOJOS3 touched by this LibreChat consolidation: `NO`.
VX13 touched by this LibreChat consolidation: `NO`.
