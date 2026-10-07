# LibreChat VX — Parallel Transport Architecture CURRENT

Date: 2026-10-07
Status: SOURCE_PREPARED / LIVE_NOT_DEPLOYED
Authority: false

## Decision

LibreChat VX will be validated on a completely parallel transport stack before any MANOJOS3 transport is changed.

No existing MANOJOS3 tunnel, Worker, hostname, port, Action route, MCP listener, Tailscale Serve/Funnel entry or host-control route is reused during this phase.

## Architecture

```text
                         LIBRECHAT VX PARALLEL STACK

Local:
Browser / app
   -> LibreChat VX :3080

Private remote:
Tailnet client
   -> Tailscale Serve [LibreChat-owned]
   -> 127.0.0.1:3080

Optional public remote:
Browser
   -> Cloudflare Access [LibreChat-owned app/policy]
   -> Cloudflare Tunnel: librechat-vx-web
   -> 127.0.0.1:3080

Inference:
LibreChat VX
   -> Cloudflare AI Gateway: LibreChat-owned gateway
   -> dynamic/nostromo-*
   -> admitted model/provider

Target plane during parallel validation:
LibreChat VX TargetGateway
   -> fixtures/mocks only
   -> NO MANOJOS3 production binding
```

## Why this is safer

- no blast radius on the current MANOJOS3 Action/plugin/MCP transport;
- DNS, tunnel tokens and policies can be changed without affecting MANOJOS3;
- LibreChat can be installed, upgraded, rolled back and mobile-tested independently;
- Cloudflare AI Gateway remains a separate inference plane;
- Tailscale Serve remains private and ACL-controlled;
- a future MANOJOS3 migration becomes a single deliberate adapter/binding change instead of a transport rebuild.

## Cloudflare design

Cloudflare Tunnel is outbound-only from the LibreChat host and should use a dedicated tunnel identity and hostname. The public path is not promoted until Cloudflare Access protects it.

Do not use the existing MANOJOS3 Cloudflare tunnel or Action Worker.

AI Gateway is a distinct resource. Dynamic route versions can be changed/rolled back without changing the web tunnel.

## Tailscale design

Tailscale Serve is the preferred private path. Funnel is intentionally disabled for the baseline because Funnel publishes to the broader Internet.

The LibreChat Serve configuration must be captured separately so it can be removed without resetting unrelated services.

## Isolation contract

Reserved MANOJOS3 ports:
- 8787
- 8790
- 8791
- 4000
- 8931
- 9223

LibreChat VX baseline:
- 3080 web/backend.

No production target binding exists in this phase.

## Canary sequence

1. validate repository isolation contract;
2. build/test LibreChat VX;
3. run LibreChat locally and prove health/login/chat shell;
4. enable a LibreChat-owned Tailscale Serve route and prove private access;
5. optionally create a dedicated Cloudflare Tunnel + Access app and prove authenticated web access;
6. connect Cloudflare AI Gateway and prove semantic routes, zero-cost guard and rollback;
7. verify mobile/reconnect and no material replay;
8. freeze topology/readback;
9. only then prepare the MANOJOS3 adapter migration.

## Rollback

Each plane is independently removable:
- disable/remove the LibreChat Tailscale Serve route;
- stop the LibreChat cloudflared process/tunnel;
- disable the LibreChat Access app/hostname;
- revert AI Gateway route version;
- stop LibreChat VX.

No rollback step touches MANOJOS3.

## LIVE truth

Nothing in this document means a tunnel has been created or enabled.
The stack remains LIVE_NOT_DEPLOYED until host/account readback proves otherwise.
