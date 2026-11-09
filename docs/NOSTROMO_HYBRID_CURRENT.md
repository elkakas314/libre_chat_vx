# NOSTROMO HYBRID — CURRENT

Status: `SOURCE_DESIGN_CONSOLIDATED / LIVE_NO_VERIFICADO`

NOSTROMO_HYBRID is the only active LibreChat VX conversational architecture.

## Architecture

```text
User
  ↓
LibreChat / NOSTROMO
  ├─ optional local voice/presentation
  ├─ NostromoInferenceGateway
  │    ↓
  │  Cloudflare AI Gateway
  │    ↓
  │  admitted provider/model
  │
  └─ NostromoTargetGateway
       ├─ MANOJOS3 adapter → MANOJOS3 MCP
       └─ VX13 adapter → Tentáculo Link (future)
```

The user sees one NOSTROMO identity. Provider/model and target transports are replaceable implementation details.

## Local model

Local voice/model is optional:
- `LOCAL_MODEL_REQUIRED=false`;
- OFF/UNINSTALLED is a valid deployment;
- if enabled it may handle voice/presentation and lightweight continuity;
- it never owns target truth or material authority.

## Inference

Primary LibreChat inference is Cloudflare AI Gateway.

Semantic profiles:
- Rápido;
- Normal;
- Pensar;
- Código;
- Contexto largo;
- Visión.

Provider admission is fail-closed on health, quota, capability, privacy, freshness and verified zero-cost state.

MANOJOS3 LiteLLM remains internal/advisory/compatibility infrastructure and is not the primary LibreChat inference gateway.

## Actions

Cloudflare AI Gateway never executes target actions.

LibreChat sends target work through an in-process `NostromoTargetGateway` facade. That facade has `authority=false` and only selects the target adapter.

MANOJOS3 path:
```text
NostromoTargetGateway
 -> Manojos3TargetAdapter
 -> MANOJOS3 MCP
 -> Governor/Policy/Kernel
 -> readback
 -> Verifier/Receipt
```

VX13 future path:
```text
NostromoTargetGateway
 -> VX13TargetAdapter
 -> Tentáculo Link
 -> Madre/Spawner/hijas
 -> readback/verification
```

## Tentáculo HUD

HUD does not depend on one model.

Inference status comes from provider routing/readback.
Target truth comes only from structured target projections/readback.

HUD must keep connection, readiness, work and evidence separate and must never infer material completion from provider output.

## Recovery

Changing provider/model, reconnecting a stream or switching device never replays a material request.

If an external effect may have happened before disconnect, state becomes `UNKNOWN_OUTCOME` until target readback/reconciliation.

## Authority

LibreChat, NOSTROMO, Tentáculo HUD, Cloudflare AI Gateway, provider models, MCP transport and local voice all remain `authority=false`.

Material authority remains target-owned.
