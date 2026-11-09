# LibreChat VX — Parallel Transport Architecture CURRENT

Date: 2026-10-07
Status: SOURCE_PREPARED / LIVE_NOT_DEPLOYED
Authority: false

## Decision

LibreChat VX is validated on a completely parallel transport stack before any MANOJOS3 transport is changed.

No existing MANOJOS3 tunnel, Worker, hostname, port, Action route, MCP listener, Tailscale Serve/Funnel entry or host-control route is reused during this phase.

## Planes

```text
                         LIBRECHAT VX PARALLEL STACK

Local web:
Browser/app -> LibreChat VX :3080

Private remote:
Tailnet client -> Tailscale Serve [LibreChat-owned] -> :3080

Optional public remote:
Browser -> Cloudflare Access -> dedicated CF Tunnel librechat-vx-web -> :3080

Inference:
LibreChat VX -> Cloudflare AI Gateway -> dynamic/nostromo-* -> admitted LLM pool

Skills:
LibreChat VX -> outbound HTTPS -> GitHub Skill Sync -> elkakas314/libre_chat_vx/skills

Public research:
LibreChat VX -> native Web Search/scrape providers

Inbound notifications:
MANOJOS3/VX13/ORACULO adapter
  -> Agent Events endpoint on the same LibreChat web plane
  -> Tentáculo event triage

Target actions during parallel validation:
fixtures/mocks only -> NO MANOJOS3 production binding
```

## Important separations

- AI Gateway is inference routing, not a tunnel.
- GitHub Skill Sync is outbound HTTPS and needs no dedicated tunnel.
- Agent Events use the LibreChat application surface; do not create a tunnel per source.
- Tailscale Serve is the baseline private path; Funnel remains off.
- Cloudflare Tunnel + Access is optional public web exposure.
- Target actions remain separate from inference and event notification.

## LLM router

The model catalog may contain many zero-cost candidates.

Each semantic profile activates a bounded healthy subset (target 6 in source config) and keeps other admitted candidates in reserve.

Route updates use versioned Cloudflare Dynamic Routes:
1. create/update candidate registry;
2. build a new route version;
3. canary;
4. deploy;
5. readback;
6. rollback to an earlier version if needed.

LibreChat may propose a route change but should not hold a broad Cloudflare administration credential.

## Skills

Canonical Skills live in GitHub and are mirrored by LibreChat GitHub Skill Sync.

A Worker is not required to keep Skills updated.

Repository mutation, if later automated, remains a separate governed path with CI/readback.

## Recovery

LibreChat cannot be its own only recovery path.

Out-of-band recovery should remain available through host service management and private administrative access.

The existing ChatGPT/MANOJOS3 Action can later remain as compatibility/recovery, but is not changed or depended on during the parallel LibreChat phase.

## Promotion order

1. repository isolation validation;
2. build/test LibreChat VX;
3. local LibreChat health/login/chat;
4. private Tailscale Serve canary;
5. optional Cloudflare Tunnel + Access canary;
6. AI Gateway model-pool canary;
7. Web Search/research canary;
8. Skill Sync canary;
9. Agent Events notification canary;
10. mobile/reconnect/rollback;
11. freeze evidence;
12. only then design MANOJOS3 cutover.

Nothing in this document means a tunnel or LIVE binding has been created.
