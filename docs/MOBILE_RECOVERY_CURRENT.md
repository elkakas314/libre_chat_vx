# Mobile / Recovery — CURRENT

Upstream pin: `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`.

Status: `SOURCE_IMPLEMENTED / RUNTIME_UNVERIFIED`.

## One backend, two surfaces

Desktop web and mobile web are views over the same LibreChat conversation/backend.

There is no second mobile control plane and no client-side target executor.

A device handoff preserves:

- conversationId;
- server history;
- target provenance already stored server-side.

It does not copy local execution state or replay a target action.

## Native resume reuse

Pinned upstream provides:

- `useResumeOnLoad.ts` — checks stream/job state when a conversation is opened and can construct a resume submission.
- `useResumableSSE.ts` — reconnects/reconciles the existing generation stream, including pending UI/tool/approval state.

LibreChat VX reuses these for **conversation/UI stream continuity**.

They do not create target authority and do not replay target material effects.

## State model

### Network unavailable

If a local snapshot exists:

`OFFLINE_READONLY`

Only cached/read-only presentation plus an optional minimal local text draft.

Without a snapshot:

`UNAVAILABLE`

### Network available but LibreChat backend unavailable

`UNAVAILABLE`

This remains true even if MANOJOS3/VX13 work continues remotely. The UI must not imply that the run stopped merely because LibreChat is unreachable.

### Backend reachable, stale snapshot

`STALE_READONLY` until fresh status/snapshot/resume reconciliation completes.

### Backend reachable, authenticated, fresh

`INTERACTIVE`

La proyección `mobileLibreChatState` exige `authenticated === true` explícito,
además de backend alcanzable y snapshot fresco. La omisión del dato o una
sesión no autenticada devuelve `UNAVAILABLE`; HTTP/TCP por sí solos no
demuestran autenticación. Es un contrato SOURCE: no verifica ninguna sesión real.

## Offline draft

Allowed:

- minimal user text draft tied to conversation.

Forbidden:

- target mutation outbox;
- authorization response outbox;
- automatic UiAction replay;
- automatic material retry.

Reconnect revalidates session, ACL, current target/binding, revision/preimage and any required target authorization before a new material request.

## Possible target effect during disconnect

If an operation might have crossed the material boundary before disconnect:

`UNKNOWN_OUTCOME`

Retry is blocked.

Target readback is mandatory first.

## Push

Push contains only an opaque reference and requests a fresh authenticated fetch.

Push never carries:

- authorization;
- secret payload by design contract;
- proof of material completion.

## Voice

Voice remains input/presentation only.

Voice authorization stays disabled.

## PWA

No PWA/Service Worker is required by this design and no native PWA surface is assumed.

If PWA is added later, BackgroundMutationFence remains mandatory and target-effect replay stays forbidden.

## Proof boundary

This is source-only development. It has not been revalidated on the local host after the no-local restriction.
