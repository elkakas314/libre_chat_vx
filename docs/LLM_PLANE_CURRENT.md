# LLM Plane — CURRENT

## Purpose

LibreChat is the conversation/UI plane. It needs a model path for language/reasoning, while MANOJOS3 remains the governed action/Interflow plane.

These are separate connections.

## Supported topologies

### 1. Direct provider

```text
LibreChat -> provider/model
```

Useful for chat-only or as the model half of a later Agent+MCP topology.

### 2. Local OpenAI-compatible model

```text
LibreChat -> local OpenAI-compatible endpoint
          -> local model
```

LibreChat officially supports OpenAI-compatible custom endpoints; Ollama is one documented example.

### 3. External OpenAI-compatible router

```text
LibreChat -> router/gateway -> selected model
```

The router owns model selection/fallback only. It has no MANOJOS3 material authority.

### 4. MANOJOS3-managed LiteLLM model plane

```text
LibreChat -> MANOJOS3_LLM_BASE_URL
          -> LiteLLM/OpenAI-compatible model plane
```

MANOJOS3 source currently documents LiteLLM at loopback `127.0.0.1:4000/v1`, with managed aliases. This loopback is source provenance, not a LibreChat deployment URL.

A deployment must provide a reachable `MANOJOS3_LLM_BASE_URL`.

### 5. Model + MANOJOS3 MCP

```text
                         +-> model endpoint
LibreChat Agent --------|
                         +-> MANOJOS3 MCP -> Intent/Interflow -> Policy/Kernel -> Verifier/Receipt
```

This is the important separation. The model thinks/talks. MANOJOS3 executes governed work.

## Advisory use of MANOJOS3 LLM Router

MANOJOS3 already has:

- `llm.router.status`
- `llm.models.free`
- `llm.route.select`
- `llm.complete.free`
- `llm.litellm.status`
- `llm.litellm.complete.free`
- `llm.huggingface.status`

These are internal capabilities. The inbound MCP does not expose a generic “call arbitrary capability” tool.

LibreChat therefore requests advisory reasoning by submitting a bounded objective through `manojos_submit`. MANOJOS3 chooses the `llm.models` or repair/advisory Interflow internally.

## Free/no-paid rule

No automatic paid fallback.

A route may become usable only after:

- endpoint is reachable;
- exact served model is known;
- zero-cost/no-paid status is verified;
- canary passes;
- deployment binding is known.

## Source conflict

Current MANOJOS3 source is internally inconsistent about free-model promotion:

- `config/litellm.managed.yaml` labels multiple aliases `LIVE_VERIFIED_FREE`;
- `docs/llm-router/LLM_MODELS_CURRENT.md` says active verified free models: none;
- `docs/CONTROL_PLANE_STATUS_CURRENT.json` says `live_verified_free_models=0`.

LibreChat must not choose a winner from source-only evidence.

Status: `SOURCE_CONFLICT_REQUIRES_LIVE_READBACK`.

## LibreChat configuration

`config/librechat.llm-plane.example.yaml` contains secret-free examples for:

- local OpenAI-compatible model;
- external router;
- MANOJOS3-managed LiteLLM;
- MANOJOS3 MCP.

Environment names only are stored in source.

## Authority

Model route = reasoning transport.

MCP = tool transport.

Neither grants material authority.

Target actions still require MANOJOS3 Policy/Kernel and verifier/receipt.
