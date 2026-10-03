# LibreChat native-surface binding — CURRENT

Upstream pin: `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`.

Status: `SOURCE_BINDINGS_IMPLEMENTED / RUNTIME_UNVERIFIED / OVERLAY_REVALIDATION_PENDING`.

## Principle

Nostromo is not a second frontend. It composes native LibreChat surfaces and adds VX13/MANOJOS3 truth, focus and governed intent around them.

## Shared panel

Pinned upstream `Presentation.tsx` currently resolves:

`artifactsElement ?? subagentElement`

and passes the result to `SidePanelGroup`.

VX source preserves that priority and adds Nostromo as a third claimant:

`Artifact > Subagent > Nostromo > None`.

If Nostromo was requested while Artifact/Subagent is active, it is **deferred**, not duplicated in a second panel. HUD/StatusRail may remain outside the shared panel.

## ToolApproval

Native ToolApproval supports approve/reject/edit/respond, batch decisions by `actionId`, submission status, expiration and resume submission.

LibreChat VX uses it only as an interaction/resume surface.

`native approval response != target authorization`

A target-owned challenge retains:

- ConcreteTargetId;
- capabilityRef;
- challengeRef;
- authorizationAuthorityRef.

The projected response has `authority=false` and `directEffect=false`. Any subsequent `authorizationRef` must come from Madre/Policy.

## MCP UI

Pinned renderer restricts the legacy MCP UI path to sandboxed inline `text/html`.

LibreChat VX reuses that renderer for visual resources but does not equate it with TrustedSurfaceHost. Operational visual actions still require:

- allowed origin/action;
- schema validation;
- provenance validation;
- target capability/binding/policy;
- normal governed mutation path.

## Tool visibility

Native `ToolsDropdown.tsx` already applies LibreChat access checks to web search, code, file search, MCP, Skills and related surfaces.

VX composes:

`nativeAllowed AND targetToolGate`

Never `OR`.

## Files

Native Files Panel remains the file-listing UI. External cloud resources are represented as `ExternalResourceRef`; preview/download/edit/delete/move permissions remain separate.

## Subagents

Native SubagentThreadPanel has its own activity, task identity, controls and receipts.

It remains a cognitive LibreChat task surface.

It is never:

- VX13 hija;
- MANOJOS3 Kernel/worker;
- proof of a target material run.

## Background Tasks

Native BackgroundTasks remain LibreChat tool/task projections. TargetRun remains separately provenance-bound.

## Resumable streams

Pinned `useResumableSSE.ts` already handles reconnect/resume/reconciliation of generation/tool/approval state.

VX uses this for UI/conversation continuity only.

Never resume/replay:

- target mutation request;
- material side effect;
- target authorization.

If a network interruption may have happened after a material effect, target readback is required before retry.

## Proof boundary

These are source-backed bindings. They are not proof that the overlay currently builds/runs on a host. Current-head tests and overlay revalidation remain separate gaps because the user prohibited local changes.
