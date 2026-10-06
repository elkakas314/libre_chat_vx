# TRANSPORT TOPOLOGY CURRENT — LibreChat + MANOJOS3

Date: 2026-10-06
Status: SOURCE_DESIGN / LIVE_BINDINGS_REQUIRE_READBACK
Authority: false

## Source-backed MANOJOS3 transport structure

Current MANOJOS3 source distinguishes several transport planes. They must not be collapsed.

### 1. Legacy/compatibility GPT Actions plane
ChatGPT Actions
-> public Cloudflare Worker `manojos2-action-proxy`
-> transport auth `X-Manojos-Token`
-> preferred `MANOJOS3_VPC` Workers VPC binding
-> existing token-managed Cloudflare Tunnel
-> MANOJOS3 control plane `127.0.0.1:8787`.

This is compatibility-only. The Worker is transport, never authority.
Tailscale origin remains compatibility/recovery fallback, not the preferred current Actions origin.

### 2. ChatGPT plugin/developer MCP plane
ChatGPT developer-mode App
-> OpenAI Secure MCP Tunnel
-> local MANOJOS3 MCP `127.0.0.1:8790/mcp`.

This keeps MCP on loopback. The Secure MCP Tunnel is specific transport for ChatGPT integration and is not assumed to be a generic LibreChat tunnel.

### 3. Tailscale plane
Tailscale Serve/Funnel remains separate from the Cloudflare VPC tunnel.

Canonical role:
- private/recovery/diagnostic transport;
- bounded fallback/compatibility;
- never authority.

Do not expose the current loopback MCP directly through a public Funnel without an authenticated MCP edge.

### 4. host-control plane
`host-control :8791` is an independent recovery/readback plane.
LibreChat must not use host-control as its normal action route and must never use it to bypass MANOJOS3 Governor/Policy/Kernel.

## New LibreChat inference plane

LibreChat/NOSTROMO
-> Cloudflare AI Gateway
-> admitted remote providers/models.

This path does NOT enter the Lenovo, does NOT traverse the MANOJOS3 Cloudflare Tunnel, and does NOT use the Action Proxy.
It is inference-only and `authority=false`.

Cloudflare AI Gateway and Cloudflare Tunnel may live in the same Cloudflare account, but they are separate resources and separate trust boundaries.

## LibreChat -> MANOJOS3 action binding

LibreChat must always speak to the real MANOJOS3 MCP contract, not to the legacy Action Proxy contract.

Choose binding by deployment topology:

### Profile A — LibreChat backend on Lenovo
Preferred:
`LibreChat backend -> http://127.0.0.1:8790/mcp`

No public tunnel is needed.

### Profile B — LibreChat backend remote but inside Tailnet
Preferred:
`LibreChat backend -> Tailscale Serve/private Tailnet endpoint -> authenticated MCP edge -> 8790`

Use private Tailscale routing. Do not use Funnel as baseline public exposure.

### Profile C — LibreChat backend remote/public
Preferred:
`LibreChat backend -> dedicated authenticated Cloudflare MCP edge Worker -> MANOJOS3_VPC -> existing Cloudflare Tunnel -> local 8790/mcp`

Requirements:
- separate resource/name from `manojos2-action-proxy`;
- MCP client authentication;
- no shell;
- only published MANOJOS3 MCP tools;
- same Governor/Policy/Kernel/Verifier/Receipt authority chain;
- Worker/Tunnel `authority=false`;
- no direct exposure of unauthenticated loopback MCP.

The repository already contains a governed isolated `manojos3-mcp-canary` Worker deployment pattern using `MANOJOS3_VPC`. That pattern is the preferred proof mechanism before any production LibreChat MCP edge is promoted.

## Why not reuse the Action Proxy for LibreChat

The Action Proxy exposes the legacy HTTP/OpenAPI compatibility contract.
LibreChat is designed against the real MCP contract.
Reusing the Action Proxy would:
- preserve legacy coupling unnecessarily;
- duplicate mapping between MCP and HTTP/OpenAPI;
- complicate receipts/provenance;
- make future removal of legacy Actions harder.

Therefore:
`Actions compatibility edge != LibreChat MCP edge`.

Both may reuse the same underlying Cloudflare Tunnel/VPC transport while remaining distinct edge contracts.

## Recommended final topology

Inference:
LibreChat -> Cloudflare AI Gateway -> remote providers.

Actions:
LibreChat -> MANOJOS3 MCP edge/direct binding -> 8790 -> MANOJOS3 -> Governor/Policy/Kernel -> readback/Verifier/Receipt.

Legacy GPT Actions:
ChatGPT Actions -> Action Proxy -> MANOJOS3_VPC -> Cloudflare Tunnel -> 8787.

ChatGPT plugin:
ChatGPT Secure MCP Tunnel -> 8790.

Recovery:
Tailscale Serve/Funnel + host-control according to their existing separate boundaries.

## Existing MANOJOS3 audit capabilities to reuse

Read-only governance already exists for:
- `edge.cli.status`
- `cloudflare.wrangler.status`
- `cloudflare.tunnel.metrics`
- `cloudflare.error1016.diagnose`
- `tailscale.status`
- `tailscale.netcheck`
- `tailscale.serve.status`
- `tailscale.funnel.status`

Material canary:
- `cloudflare.worker.canary.deploy` is constrained to isolated `manojos3-mcp-canary` and requires VPC/tunnel identity checks.

Because this structure exists, no ad-hoc shell audit script is added at this stage. Use the governed capabilities first.

## Documentation conflict

`docs/CLOUDFLARE_EDGE.md`, MANOJOS3 handoff and later transport audits say the CURRENT preferred Action path is:
`Worker -> MANOJOS3_VPC -> token-managed Cloudflare Tunnel -> :8787`.

`deployment/cloudflare/action-proxy/README.md` still says the current origin is Tailscale Funnel.

Treat the README statement as stale until MANOJOS3 itself reconciles the documentation. LibreChat integration must follow the later/current source-backed topology and verify LIVE before promotion.

## Gates

- TRANSPORT-M3-SOURCE: exact MANOJOS3 transport topology read from current source.
- TRANSPORT-M3-LIVE: actual Cloudflare/Tailscale/OpenAI tunnel states read back LIVE.
- LC-MCP-DIRECT: local profile reaches 8790 when colocated.
- LC-MCP-PRIVATE: Tailnet profile reaches authenticated MCP privately when used.
- LC-MCP-CF-EDGE: dedicated Cloudflare MCP edge initializes/lists tools/calls `manojos_status`.
- LC-MCP-NO-ACTION-PROXY: LibreChat action path does not depend on legacy Action Proxy.
- LC-MCP-AUTH: unauthenticated remote MCP request denied.
- LC-MCP-AUTHORITY: transport changes never alter target grants/authority.
- LC-MCP-NO-HOSTCONTROL-BYPASS: normal LibreChat flow cannot route material work through host-control.
- LC-CF-SEPARATION: AI Gateway resource and MANOJOS3 tunnel/Action Proxy remain separate planes.

NEXT_IMPLEMENTATION_ACTION=Audit LIVE tunnel/Serve/Secure-MCP state using existing governed MANOJOS3 R0 capabilities, then choose LibreChat action binding Profile A/B/C from actual deployment location.
