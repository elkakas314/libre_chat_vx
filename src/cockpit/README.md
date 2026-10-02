# Cockpit

The cockpit is presentation plus intent routing.

Core surfaces:
- CurrentFocus
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

Rules:
- lazy/allowlisted renderers;
- generic read-only fallback;
- event-driven updates and backpressure;
- four independent truth lanes;
- no PowerLease/start/stop from view interest;
- no material completion from animation/click/HTTP 200;
- privacy/accessibility first-class;
- offline does not replay effects.
