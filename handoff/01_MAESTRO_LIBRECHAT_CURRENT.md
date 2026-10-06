# MAESTRO LIBRECHAT CURRENT

RESULTADO=SOURCE_ARCHITECTURE_CONSOLIDATED
LIVE=NO_VERIFICADO
MATERIAL_VERIFIED=NO
AUTHORITY=false

## Product role

LibreChat VX is the single conversation/UI/cockpit plane. It does not replicate MANOJOS3, VX13 or ORACULO authority.

## Final CURRENT topology

```text
LibreChat / NOSTROMO
  ├─ Native conversation, context, Files/RAG, tools and UI surfaces
  ├─ Tentaculo HUD / truth projections
  ├─ Inference Gateway
  │    -> Cloudflare AI Gateway
  │    -> admitted providers/models by semantic profile/capability
  └─ Target Gateway (in-process, authority=false)
       ├─ MANOJOS3 adapter -> MCP -> MANOJOS3
       └─ VX13 adapter -> Tentaculo Link/frontdoor (future)
```

## Router

PRIMARY_LIBRECHAT_INFERENCE=CLOUDFLARE_AI_GATEWAY
LOCAL_MODEL_REQUIRED=false
PAID_AUTO_FALLBACK=false
MANOJOS3_LITELLM_ROLE=INTERNAL_ADVISORY_COMPATIBILITY

Profiles:
RAPIDO | NORMAL | PENSAR | CODIGO | CONTEXTO_LARGO | VISION

Capabilities:
TEXT | VISION | AUDIO | STRUCTURED_OUTPUT | TOOLS | LONG_CONTEXT

Provider admission requires fresh LIVE readiness/capability/quota/privacy/context/zero-cost evidence before promotion.

## Target gateway

NOSTROMO_TARGET_GATEWAY is a LibreChat in-process facade only.
It is not:
- an MCP server;
- a proxy authority;
- Policy/Governor/Kernel;
- executor;
- verifier;
- receipt authority;
- ledger.

Purpose: let MANOJOS3 use MCP today and VX13 use its own frontdoor tomorrow without redesigning the cockpit.

## LibreChat feature status

Implemented SOURCE:
Conversation, Nostromo identity/cockpit, Tentaculo HUD model, StatusRail, focus/referential continuity, contextual windows, ArtifactDock, Interactive Artifacts as UiIntent, ActiveFlow, PlanGraph, TargetRun, Files/Audio/Browser/Build/Background panels, mobile/recovery contracts, resumable UI streams, provider router/admission, Cloudflare client contract, structured output validation, provider status projection, MANOJOS3 semantic/entrypoint projection.

Native upstream reuse:
Agents, Artifacts, MCP UI, ToolApproval, Skills, Subagents, background tool calls, Files/RAG, Speech, resumable streams, ACL and SidePanel.

Partial/open:
provider-status HUD bridge; TargetGateway source implementation; semantic Model Specs to Cloudflare routes; AUDIO live route; overlay/build revalidation.

External/LIVE:
Cloudflare binding/canaries; MANOJOS3 R0; VX13 binding; ORACULO advisory canary; first governed R2.

## Truth

Provider state and target state are separate truth lanes.
Cloudflare inference cannot authorize material work.
NOSTROMO prompt is not a security boundary.
Target-owned readback/verifier/receipt remains required for material completion.

## Next sequence

SOURCE tests -> provider HUD bridge -> TargetGateway facade -> upstream overlay/build -> Cloudflare live binding -> MANOJOS3 R0 -> future VX13 binding -> first governed material canary.
