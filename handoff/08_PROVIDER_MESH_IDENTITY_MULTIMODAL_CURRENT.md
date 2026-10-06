# PROVIDER MESH / NOSTROMO IDENTITY / MULTIMODAL CURRENT

Date: 2026-10-06
Status: SOURCE_DESIGN / LIVE_PROVIDER_BINDINGS_REQUIRE_READBACK
Authority: false

## Decision

LibreChat/NOSTROMO must never depend on one provider, one concrete model, or a mandatory local model.

Canonical split:

```text
User
 -> LibreChat / NOSTROMO identity + Model Specs
 -> semantic profile
 -> MANOJOS3 LiteLLM semantic alias
 -> one admitted provider deployment
 -> streamed cognitive answer

Material intent
 -> MANOJOS3 MCP
 -> Governor / Policy / Kernel / driver
 -> readback / Verifier / Receipt
```

The semantic alias is stable. Provider/model deployment is replaceable.

## Current MANOJOS3 source baseline

Current MANOJOS3 source already defines:
- `manojos-general-free`
- `manojos-coding-free`
- `manojos-reasoning-free`
- `manojos-fast-free`
- `manojos-long-context-free`

Current managed gateway is LiteLLM on loopback `:4000`, with `llm_router.no_paid_only=true` in MANOJOS3 config.

Therefore LibreChat does NOT create a second alias namespace such as `manojos-gemini-flash` or `manojos-gemini-pro` as the canonical UX. Gemini, OpenRouter, local models or another provider are deployments behind semantic aliases.

`vision` is a desired semantic capability/profile but is not claimed as a currently served MANOJOS3 alias until source/live implementation proves it.

## Provider category model

User-facing profiles:
- Rápido -> `manojos-fast-free`
- Normal -> `manojos-general-free`
- Pensar -> `manojos-reasoning-free`
- Código -> `manojos-coding-free`
- Contexto largo -> `manojos-long-context-free`
- Visión -> capability-routed profile; alias implementation gated until source/live proof

Each alias may have multiple candidate deployments.

ProviderAdmission requires, per deployment:
- provider/model reachable;
- capability readback compatible with profile;
- context limit sufficient;
- structured output/tool/vision/audio support measured when required;
- privacy policy allowed;
- zero-cost/free-tier status verified for the actual account/route;
- no automatic paid upgrade/fallback;
- quota/rate-limit state known enough to route safely;
- authority=false.

A provider marketing label or model name is never sufficient evidence.

## Gemini

Gemini is accepted as an OPTIONAL provider family, not a dependency.

Do not hard-code Gemini 2.0 models: they are retired. Model IDs are chosen through current provider discovery + canary.

Illustrative LiteLLM deployment shape only:

```yaml
model_list:
  - model_name: manojos-general-free
    litellm_params:
      model: gemini/<ADMITTED_CURRENT_MODEL>
      api_key: os.environ/GEMINI_API_KEY
    model_info:
      provider_family: google_ai_studio
      authority: false
      admission: LIVE_ZERO_COST_AND_CAPABILITY_REQUIRED
```

The same semantic alias can retain an OpenRouter deployment and add a Gemini deployment. Router policy chooses only among admitted deployments.

Do NOT manually assert `input_cost_per_token: 0` / `output_cost_per_token: 0` for Gemini merely because a free tier exists. Zero-cost is an account/runtime admission fact, not a permanent model property.

Do NOT rely on a non-canonical LiteLLM `paid_fallback: false` flag. Current MANOJOS3 safety remains:
- `llm_router.no_paid_only=true`;
- fallback chains contain only admitted zero-cost aliases/deployments;
- negative test proves a paid route cannot be selected;
- provider-side billing/spend controls should also fail closed where available.

## Nostromo identity

Canonical identity owner: LibreChat/NOSTROMO, not LiteLLM.

Reason:
- LiteLLM is shared inference infrastructure and may serve OpenCode/other clients.
- a gateway-global persona would contaminate unrelated clients;
- prompt instructions are not a security boundary.

Preferred mechanism:
- LibreChat Model Specs `promptPrefix` and/or Agent instructions;
- one versioned `NOSTROMO_IDENTITY_PROFILE`;
- same identity applied across semantic profiles.

Identity profile contains:
- conversational tone/persona;
- language/user-experience rules;
- `authority=false` self-description;
- never invent material success, authorization, readback, evidence or receipt;
- target truth comes from structured projections;
- when material work is requested, hand off to the target owner.

MANOJOS3 continues to enforce authority server-side. Even if a model ignores the identity prompt, it cannot gain execution authority.

Tentáculo HUD advanced details may expose:
- identity profile version/hash;
- semantic alias;
- concrete provider/model;
- locality;
- capability set;
- provider health/freshness.

## Large context

Large context is a capability, not a default strategy.

Routing order:
1. metadata + targeted file reads;
2. File Context/RAG/retrieval;
3. compact relevant context;
4. `long-context` alias only when the task materially benefits from whole-corpus context.

Never dump an entire repo/history into a million-token model by default.

`ContextCapabilityProbe` reads actual provider/model context capacity; documentation values are hints, not runtime proof.

Protected operational state is never discarded by compaction:
- ConcreteTargetId;
- active run IDs;
- pending authorization IDs;
- UNKNOWN_OUTCOME;
- EvidenceRef/ReceiptRef IDs;
- reconciliation references;
- user decisions constraining current work.

## Multimodality

Capability-driven, provider-agnostic:
- image input -> vision-capable admitted route;
- audio input/output -> admitted audio/live route when enabled;
- diagrams/screenshots -> vision route;
- normal text -> standard semantic alias.

Multimodal analysis remains cognitive. A screenshot interpretation never becomes material readback or receipt.

Tentáculo HUD Provider panel shows capability flags such as:
`TEXT | VISION | AUDIO | STRUCTURED_OUTPUT | TOOLS | LONG_CONTEXT`
with source/readback freshness.

## Structured output / JSON

Structured model output is useful for routing, UI projections and adapter inputs, but remains UNTRUSTED until validated.

Flow:
```text
model output
 -> StructuredCognitiveEnvelope
 -> JSON/schema validation
 -> semantic validation
 -> target binding check
 -> (if material) MANOJOS3 MCP submission
```

A model-generated field named `authorized`, `verified` or `receipt` has no authority.

Only target-originated AuthorizationProjection / EvidenceRef / ReceiptRef can populate material truth in Tentáculo HUD.

## Local model policy

Local model is fully optional.

Allowed states:
- OFF/UNINSTALLED: system still operates through admitted remote routes;
- AVAILABLE_COLD: load on demand;
- READY: eligible for profiles it actually supports;
- DEGRADED/UNAVAILABLE: automatic cognitive failover may occur.

No promotion gate may require local voice/model unless local mode is explicitly enabled for that deployment.

## LibreChat integration

LiteLLM is configured in LibreChat as one OpenAI-compatible custom endpoint using a deployment-reachable base URL and gateway key reference.

Model Specs present semantic profiles rather than concrete provider brands.

`fetch: true` may expose raw aliases/models for diagnostics, but the default user experience should prioritize curated Model Specs.

Secrets remain environment/secret-store references and are never committed.

## New invariants

1. semantic alias != concrete provider.
2. identity != provider.
3. prompt persona != authority.
4. free-tier documentation != zero-cost LIVE proof.
5. provider failover != material replay.
6. large context != upload everything by default.
7. multimodal output != target evidence.
8. structured JSON != trusted material state.
9. local model != deployment prerequisite.
10. Model Specs/profile change != target/grant change.

## Build impact

Before implementing a new Gemini route:
1. discover current Gemini models;
2. verify LiteLLM support in the deployed LiteLLM version or upgrade through a governed change;
3. enroll GEMINI_API_KEY as SecretRef/environment only;
4. prove account/route cannot incur unintended paid usage;
5. canary capabilities + context + structured output + multimodality as needed;
6. add deployment behind existing semantic alias;
7. test provider failover;
8. expose provider/model only as advanced HUD detail;
9. keep material action route unchanged.

NEXT_IMPLEMENTATION_ACTION=Implement semantic profile/identity contracts in LibreChat source, then validate current MANOJOS3 aliases and one remote provider route LIVE before adding any new provider deployment.
