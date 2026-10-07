# LibreChat VX parallel transport stack

Status: SOURCE_PREPARED / LIVE_NOT_DEPLOYED.

This directory defines a transport stack owned only by LibreChat VX.

## Planes

1. **Local application**
   - LibreChat VX binds to `127.0.0.1:3080`.
   - No external tunnel is required for local use.

2. **Private web access**
   - Tailscale Serve -> `127.0.0.1:3080`.
   - Tailnet ACLs apply.
   - Tailscale Funnel is not the baseline.

3. **Optional public web access**
   - dedicated Cloudflare Tunnel named `librechat-vx-web`;
   - dedicated hostname;
   - Cloudflare Access identity gate required before promotion;
   - origin `127.0.0.1:3080`.

4. **Inference**
   - LibreChat VX -> Cloudflare AI Gateway -> admitted provider/model.
   - AI Gateway does not traverse the web tunnel.

5. **Target actions**
   - source/CI fixtures only during the parallel phase.
   - no MANOJOS3 production binding in this stack.

## Non-collision contract

The validator rejects a LibreChat-owned route if it reuses known MANOJOS3 ports or resource names.

MANOJOS3 is a later migration target, not a dependency of this parallel validation stack.

## Promotion order

```text
SOURCE VALIDATION
  -> local LibreChat health
  -> private Serve canary
  -> optional Cloudflare Tunnel + Access canary
  -> AI Gateway canary
  -> mobile/reconnect/rollback
  -> freeze evidence
  -> only then design MANOJOS3 cutover
```

Do not combine tunnel creation, DNS cutover, credential rotation and target migration in one change.
