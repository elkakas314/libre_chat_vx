# Architecture

## Purpose

`libre_chat_vx` owns the LibreChat-side integration and cockpit only. It does not own target-system policy, durable state or execution.

## Planes

### Conversation Plane
Chat, history, attachments, voice entry and upstream client capabilities.

### Cockpit Plane
CurrentFocus, contextual windows, StatusRail, DecisionInbox, RunView, Inspector, EvidenceViewer and ArtifactDock.

### Projection Plane
System adapters, capability projection, freshness, ACL-aware views and CrossTargetTruthEnvelope.

### Recovery Plane
Reconnect, STALE, RESYNC_REQUIRED, UNKNOWN_OUTCOME and reconciliation.

## Authority boundaries

- VX13: Tentáculo Link is frontdoor; Madre owns policy/authorization/closure; Spawner/hijas execute.
- MANOJOS3: Governor/Policy/Auth/Kernel/Verifier/State remain authoritative.
- ORÁCULO: advisory only, authority=false.
- LibreChat: conversation, presentation and intent transport only.

## Canonical client family U0–U23

U0 chat; U1 Artifact/ACL; U2 snapshot/cursor/resync; U3 auth/idempotency; U4 SHUB preview/readback; U5 browser/UNKNOWN_OUTCOME; U6 focus/accessibility; U7 renderer/capability; U8 high-rate projection; U9 mobile/remote; U10 Build; U11 cache revoke; U12 TrustedSurfaceHost; U13 client compatibility; U14 telemetry privacy; U15 resource budget/suspend; U16 Nostromo/windows; U17 referent/context; U18 ControlDraft; U19 ProjectionBackpressure; U20 RendererFailureIsolation; U21 PrivacyPresentation; U22 BackgroundMutationFence; U23 ViewInterestNegotiation.

## Truth lanes

Keep four independent lanes:
- CONNECTION
- READINESS
- WORK
- EVIDENCE

Never infer material work state from socket health, animation, model response or HTTP success.

## Panels and lenses

Lazy/allowlisted surfaces:
- StatusRail
- ActiveFlow
- DecisionInbox
- ModuleIndex
- PlanGraph
- Manojos3Run
- VX13DomainLenses
- SHUB AudioPanel
- BrowserPanel
- BuildPanel
- FilesView/Cloud
- Inspector
- EvidenceViewer
- ArtifactDock

Unknown renderers fall back to generic read-only presentation.

## Event and resource model

Baseline: event-driven updates + lazy views + ViewInterestProjection + ProjectionBackpressure/coalescing + snapshot/resync.

Fixed polling is not the baseline. Timers may exist only as bounded fallback and must not wake heavy models or workers merely because a panel is visible.

ViewInterest is an ephemeral demand hint, never ACL, PolicyDecision or PowerLease. CORE_MINIMUM truth cannot be suppressed.
