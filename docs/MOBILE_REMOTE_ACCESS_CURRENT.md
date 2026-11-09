# MOBILE AND REMOTE ACCESS — CURRENT

Status: SOURCE_COMPLETE / LIVE_CANARY_PENDING

## Goal

One NOSTROMO, one backend and one conversation history across local desktop, remote desktop browser and mobile.

## Access routes

### LOCAL
Same LibreChat instance on the host/local path.

### TAILSCALE_PRIVATE — baseline remote path
Mobile/PC -> Tailscale identity + ACL -> Tailscale Serve -> LibreChat :3080.

This is the preferred personal remote path because it stays inside the tailnet.

### CLOUDFLARE_ACCESS_PUBLIC — optional
Browser -> Cloudflare Access -> dedicated LibreChat Tunnel -> LibreChat :3080.

Use only when browser access without joining the tailnet is useful.

The user does not select a transport inside NOSTROMO. Infrastructure resolves an authorized route.

## Conversation continuity

LibreChat native resumable streams can survive:
- dropped connection;
- page refresh;
- tab switch;
- device switch.

Single instance uses the built-in in-memory stream backend.
Redis is only required for cross-instance continuity when multiple LibreChat replicas are introduced.

## Offline behavior

Allowed:
- cached read-only state when available;
- local text draft.

Forbidden:
- queued target mutation;
- queued approval;
- queued authorization;
- automatic submit after reconnect.

## Reconnect

1. recover an authorized network route;
2. re-authenticate session if required;
3. refresh ACL;
4. refresh target readiness/work/evidence;
5. resume cognitive stream if supported;
6. never replay material target work;
7. possible prior effect -> UNKNOWN_OUTCOME -> readback.

## Push and Agent Events

A notification is an opaque hint.
It never carries authorization or proves completion.
Opening it triggers authenticated fresh fetch/readback.

Agent Events is the preferred inbound event surface.
A secondary channel such as ntfy/Telegram stays optional until mobile canary demonstrates a real gap.

## Tailscale

Serve is baseline.
Services is optional when stable service identity, multiple hosts or HA provides measurable value.
Tailscale SSH is the recovery/admin plane.

## Cloudflare

Tunnel + Access is optional public access.
The tunnel must never expose:
- MongoDB;
- internal MCP listeners;
- host-control;
- administration endpoints;
- target-private control planes.

## Source implementation

Existing:
- mobileContinuity.ts;
- mobileRecovery.ts;
- offlineDraft.ts;
- pushRefresh.ts;
- BackgroundMutationFence;
- session/ACL/cache policies.

Added:
- remoteAccess.ts route policy;
- mobile_access.current.json;
- mobile-access.schema.json;
- mobile-remote-access.test.ts.

## Live test gates

- desktop -> mobile same conversation;
- mobile -> desktop same conversation;
- Wi-Fi -> mobile data reconnect;
- device/tab switch during streaming;
- Tailscale revoke;
- Cloudflare Access revoke if enabled;
- offline draft survives;
- no offline material queue;
- possible effect becomes UNKNOWN_OUTCOME;
- push -> fresh fetch;
- backend down -> explicit unavailable;
- recovery works while LibreChat itself is down.
