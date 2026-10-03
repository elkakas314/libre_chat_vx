# MANOJOS3 entrypoints for LibreChat — CURRENT

MANOJOS3 source inspected at `cb772cca141f7ae5ae03af9655b3c5186f5826f6`.

## Entrypoint A — action plane: inbound MCP

Canonical source:

- `src/manojos3/mcp_gateway.py`
- source endpoint: `http://127.0.0.1:8790/mcp`
- transport: streamable HTTP
- deployment variable: `MANOJOS3_MCP_URL`

The loopback address is not assumed reachable from a LibreChat container.

The MCP server is transport-only and forwards to the existing MANOJOS3 control plane.

### Exposed tool surface

Read/bootstrap:

- `manojos_gpt_migration_profile`
- `manojos_status`
- `manojos_capabilities`
- `manojos_skills`
- `manojos_attach`
- `manojos_run`
- `manojos_authorization_requirement`
- `manojos_authorization`
- `manojos_receipt`

Controlled:

- `manojos_submit`
- `manojos_resume`
- `manojos_advance`
- `manojos_pause`
- `manojos_cancel`

### Objective flow

```text
LibreChat Agent
  -> manojos_submit
  -> MANOJOS3 builds manojos3.ingress.v1
  -> POST /v1/objectives/submit inside MANOJOS3 transport
  -> Intent Router
  -> Slot Resolver
  -> Interflow / Operation Compiler
  -> Governor / Policy
  -> Kernel / driver
  -> readback
  -> Verifier / Receipt
  -> manojos_run / manojos_receipt
  -> LibreChat
```

LibreChat should not call private control-plane HTTP endpoints directly. The MCP gateway is the integration contract.

## Entrypoint B — inference/model plane

MANOJOS3 source contains `ModelRouterAdapter` and a managed LiteLLM configuration.

Source candidate:

`http://127.0.0.1:4000/v1`

This is an OpenAI-compatible inference plane, not the MANOJOS3 action plane.

For LibreChat the deployment contract is:

`MANOJOS3_LLM_BASE_URL`

plus a secret-managed key reference if required.

The loopback source address must never be copied blindly into a container deployment.

## Entrypoint C — advisory Interflow

If LibreChat is using another primary model, MANOJOS3 can still provide a second opinion.

Do not call internal `llm.*` capability IDs directly from LibreChat.

Use:

```text
manojos_submit(
  objective = advisory/review/model objective,
  risk_ceiling = R0/R1
)
```

MANOJOS3 routes the objective through `llm.models.intent.plan` / repair advisory and then its internal router as admitted.

## Non-canonical route

`127.0.0.1:20128/v1` belongs to the OmniRoute candidate matrix and is documented as attempted/not installed. It is not the current canonical inference endpoint.

## Deployment gates

Before either entrypoint becomes LIVE from LibreChat:

1. exact network route/readback;
2. authentication/ACL boundary;
3. LibreChat MCP private-address allowlist when applicable;
4. model route canary;
5. no-paid fallback verification;
6. MCP status/capabilities/skills read;
7. one R0 objective/readback/receipt;
8. only then material work.
