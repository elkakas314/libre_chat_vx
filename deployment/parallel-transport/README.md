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

## Promotion order and independent gates

The **only canonical active priority order** is `operating/GAPS_CURRENT.json:gaps[]` and its derived `operating/BOOTSTRAP_CURRENT.json`. Do not copy a divergent hardcoded chain into a deployment document.

- First active LIVE gate: Cloudflare AI Gateway zero-cost account/provider/7-route canary + rollback. This is **inference**, not a web tunnel, and may be tested independently of a public LibreChat hostname.
- Second: GitHub Skill Sync authenticated admin canary (12 physical roots before a controlled switch to the 10 active roots). No tunnel/Worker required.
- Third: Tailscale Serve private mobile session/reconnect/revoke canary, after a separate **local LibreChat health check** on `127.0.0.1:3080`. Inspect existing Serve state and prevent resource collisions.
- Then: native Web Research, Agent Events and out-of-band recovery, with independent work progressing whenever another gate is blocked.
- Optional Cloudflare Tunnel + Access public route is **not** a prerequisite for AI Gateway, GitHub Skill Sync, or private Tailscale Serve. Promote only on measured need and after explicit identity/access review.
- Only after the parallel LibreChat gates: MANOJOS3 R0 read-only binding; a material canary remains separately governed, never inferred from these transports.

If one LIVE gate is inaccessible, preserve its reason/readback and continue safe SOURCE or other independent work under `LC-CONTINUITY-NO-STOP`. Do not combine tunnel creation, DNS cutover, credential rotation and target migration in one change.
