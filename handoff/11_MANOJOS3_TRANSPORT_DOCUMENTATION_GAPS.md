# MANOJOS3 TRANSPORT DOCUMENTATION GAPS — 2026-10-06

Status: SOURCE_AUDIT / REPAIR_TARGET_IS_MANOJOS3 / NO_RUNTIME_MUTATION_PERFORMED

## Confirmed contradiction

### M3-DOC-001 — Action Proxy origin conflict

`docs/CLOUDFLARE_EDGE.md`, `docs/HANDOFF_CURRENT.md` and later transport audits describe the CURRENT preferred GPT Actions path as:

`Worker manojos2-action-proxy -> MANOJOS3_VPC -> token-managed Cloudflare Tunnel -> MANOJOS3 :8787`

with Tailscale as compatibility/recovery fallback.

But:

`deployment/cloudflare/action-proxy/README.md`

still says:

`Current origin transport is the existing Tailscale Funnel`

and says the token-managed cloudflared tunnel is not repurposed.

These statements cannot both be CURRENT.

Repair rule:
- determine LIVE route using governed readback first;
- update the stale document(s) only after readback;
- preserve history as superseded evidence if useful;
- do not alter Worker/Tunnel runtime merely to make documentation match.

## Probable source/live drift requiring readback

### M3-DOC-002 — plugin/MCP migration status may be stale

Current source in `src/manojos3/mcp_gateway.py` hardcodes:
- `registration_status=NOT_MIGRATED`
- `public_endpoint=None`
- recommended connection = OpenAI Secure MCP Tunnel.

`CURRENT.json` also carries a NOT_MIGRATED registration status.

Recent external/plugin observations may be newer than this source snapshot. Therefore this is NOT automatically repaired from chat evidence.

Required:
- read actual installed ChatGPT plugin/app identity and current Secure MCP Tunnel/profile state;
- compare registered App ID/release/tool count with source package manifest;
- if migrated LIVE, make migration status derived/readback-backed rather than stale hardcoded metadata;
- if not migrated LIVE, keep NOT_MIGRATED and reconcile external package claims.

### M3-DOC-003 — `cloudflare.public_origin` semantics are ambiguous

`config/default.json` currently contains a Tailscale URL in `cloudflare.public_origin`, while CURRENT docs say MANOJOS3_VPC + Cloudflare Tunnel is preferred and Tailscale is compatibility fallback.

This may be intentional compatibility metadata, not a runtime error.

Required:
- identify every consumer of `cloudflare.public_origin` / `MANOJOS3_ORIGIN`;
- classify it as CURRENT_PRIMARY, COMPATIBILITY_FALLBACK or LEGACY;
- rename/document fields if needed so a future integrator cannot mistake fallback metadata for the preferred path;
- do not delete fallback before LIVE route and rollback are proven.

## LibreChat documentation drift corrected in this branch

The following older statements were stale and are being reconciled in LibreChat/Drive:
- primary reasoning owned by MANOJOS3 LiteLLM;
- local voice/model treated as baseline deployment requirement;
- LibreChat inference entrypoint = MANOJOS3 managed LiteLLM;
- old branch/head/tool-count snapshots.

New design:
- LibreChat primary inference = Cloudflare AI Gateway;
- MANOJOS3 LiteLLM = internal/advisory/compatibility;
- local model optional;
- LibreChat material actions = real MANOJOS3 MCP;
- binding profile depends on LibreChat backend location;
- LIVE remains unverified until readback.

## Repair acceptance

PASS requires:
1. exact branch/HEAD and clean/dirty state recorded;
2. governed R0 readback for Cloudflare/Tailscale/Secure MCP state;
3. source/docs/runtime topology table with one CURRENT row per plane;
4. contradiction M3-DOC-001 removed;
5. M3-DOC-002 classified from LIVE evidence;
6. M3-DOC-003 classified and documented;
7. tests for changed docs/config assumptions;
8. no runtime transport cutover unless independently required and authorized;
9. repo clean + remote synced if changes are committed;
10. regenerated CURRENT/handoff only from evidence.

Do not declare PASS from documentation consistency alone.
