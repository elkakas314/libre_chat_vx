# MANOJOS3 entrypoints for LibreChat — CURRENT

Status: `SOURCE_DESIGN_CONSOLIDATED / LIVE_BINDING_NO_VERIFICADO`

## Application boundary

LibreChat must not expose MANOJOS3 MCP as a UI concept.

Canonical application path:

```text
LibreChat / NOSTROMO
 -> NostromoTargetGateway
 -> Manojos3TargetAdapter
 -> MANOJOS3 MCP
 -> MANOJOS3 authority chain
```

`NostromoTargetGateway` is an in-process facade with `authority=false`. It is not another proxy service, MCP, Governor, Policy, Kernel, executor or ledger.

Its purpose is only to keep the LibreChat cockpit independent from target-specific transport.

## MANOJOS3 action adapter

The Manojos3TargetAdapter speaks the real MANOJOS3 MCP contract.

Source endpoint currently documented by MANOJOS3:
- `http://127.0.0.1:8790/mcp`;
- streamable HTTP;
- deployment variable `MANOJOS3_MCP_URL`.

The loopback source address is not assumed reachable from a LibreChat container or remote backend.

Read/bootstrap surface:
- `manojos_gpt_migration_profile`;
- `manojos_status`;
- `manojos_capabilities`;
- `manojos_skills`;
- `manojos_attach`;
- `manojos_run`;
- `manojos_authorization_requirement`;
- `manojos_authorization`;
- `manojos_receipt`.

Controlled surface:
- `manojos_submit`;
- `manojos_resume`;
- `manojos_advance`;
- `manojos_pause`;
- `manojos_cancel`.

Objective flow:

```text
LibreChat
 -> NostromoTargetGateway
 -> Manojos3TargetAdapter
 -> manojos_submit
 -> MANOJOS3 Intent/Interflow
 -> Governor/Policy
 -> Kernel/driver
 -> readback
 -> Verifier/Receipt
 -> adapter projection
 -> LibreChat
```

LibreChat never calls private MANOJOS3 control-plane HTTP as its normal contract.

## Deployment transport profiles

The adapter can bind to different transports without changing the LibreChat UX:

### A — same host
`LibreChat backend -> 127.0.0.1:8790/mcp`

### B — remote private
`LibreChat backend -> authenticated private/Tailnet MCP path -> 8790`

### C — remote public
`LibreChat backend -> dedicated authenticated Cloudflare MCP edge -> MANOJOS3_VPC/tunnel -> 8790`

The edge remains transport-only and `authority=false`.

Legacy GPT Action Proxy is not the LibreChat contract.

## Inference is separate

LibreChat primary inference path is:

```text
LibreChat -> Cloudflare AI Gateway -> admitted provider/model
```

MANOJOS3 managed LiteLLM remains internal/advisory/compatibility infrastructure.

Do not configure `MANOJOS3_LLM_BASE_URL` as LibreChat's primary inference contract.

## Future VX13

The same LibreChat TargetGateway facade will host another adapter:

```text
NostromoTargetGateway
 -> VX13TargetAdapter
 -> Tentáculo Link
 -> VX13 authority chain
```

This is why the product boundary is TargetGateway/TargetAdapter rather than MCP itself.

## Gates before LIVE

1. exact action transport readback;
2. authentication/ACL boundary;
3. MANOJOS3 MCP initialize/tools/read path;
4. status/capabilities/skills projection;
5. one R0 objective + readback + receipt;
6. no host-control bypass;
7. no Action Proxy dependency;
8. Cloudflare inference path remains independent;
9. only later, one minimal reversible governed mutation.
