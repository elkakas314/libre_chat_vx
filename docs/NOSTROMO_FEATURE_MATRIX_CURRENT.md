# Nostromo / Tentáculo feature matrix — CURRENT

Status: `SOURCE_IMPLEMENTED / UPSTREAM_BINDING_PARTIAL / TARGET_RUNTIME_PENDING`

This matrix consolidates project-thread requirements into concrete LibreChat VX locations.

| Feature | Behaviour | Implementation |
|---|---|---|
| One voice / no operator modes | Conversation remains the primary interface; target and windows move underneath it | `NostromoCockpit`, `TargetNavigator`, `windowRouter` |
| Tentáculo HUD | Same HUD moves across MANOJOS3, VX13, BOTH or AUTO; authority always false | `tentacleHud.ts`, `TentacleHud.tsx` |
| StatusRail | Connection/readiness/freshness/source truth remain separate | existing `statusRail.ts` + `StatusRailView` |
| MinimalTruth | Show only target, readiness, source/live alignment and material readiness | `MinimalTruthView.tsx` |
| CurrentFocus / "eso" | Focus + short referential memory with TTL; ambiguous refs require input | currentFocus/referentialContinuity + `shortMemory.ts` |
| ContextInspector | Surface system/module/capability/run/artifact refs without granting power | `ContextInspectorView.tsx` |
| Automatic windows | Files, audio, browser, build, runtime, model, plan, security open from conversational focus | `windowRouter.ts` |
| Green controls | Explain, refresh, evidence, copy context, read gap; readonly only | `controlDeck.ts` |
| Yellow controls | Prepare proposal/audit/quarantine/evolution; no material effect | `controlDeck.ts` |
| Red controls | Execute/delete/move/patch/restart are only governed material-request preparation | `controlDeck.ts`; blocked unless live material target + authority ref |
| DecisionInbox | Owner-issued decisions only; UI never mints authorization | existing DecisionInbox + native LibreChat ToolApproval reuse |
| ArtifactDock | Open/pin/compare/timeline/export under fresh ACL | existing ArtifactDock |
| Interactive Artifacts | Buttons/sliders/knobs/decisions/authorization project UiIntent; never direct target effects | `interactiveArtifact.ts`, `InteractiveArtifactView.tsx` |
| ActiveFlow | Only executed edges with evidence, never blueprint-only graph | existing ActiveFlow |
| PlanGraph | PLAN_CREATED ≠ SCHEDULED ≠ MATERIAL_VERIFIED | existing PlanGraph |
| TargetRun | Same run view for VX13/MANOJOS3, backed by distinct chains | `targetRun.ts`, `TargetRunView.tsx` |
| MANOJOS3 capability parity | 134 current capabilities collapse to bounded lenses | `capabilityLens.ts`; browser/runtime/connectors/build/repo/models/MCP/threads/host/state |
| VX13 parity | Same external truth/safety slots; current source remains DESIGN_CONSOLIDATION | `targetParity.ts` |
| Files / OneDrive-like view | Project ExternalResourceRef permissions, never direct delete/move | `FilesPanelView.tsx` |
| SHUB / REAPER | Show project/track/plugin/parameter/readback/A-B evidence | `AudioPanelView.tsx` |
| Browser / Playwright | Remote DOM untrusted; show screenshot/ref; ambiguous POST timeout -> UNKNOWN_OUTCOME | `BrowserPanelView.tsx` |
| Build / construction | Separate plan/package/artifact/test-declared/test-reproduced/material integration | `BuildPanelView.tsx` |
| Background work | Present LibreChat/MANOJOS3/VX13 task state and supported controls; not public authority | `BackgroundTasksView.tsx` |
| Mobile | Same conversation/history; backend-off explicit unavailable; offline read-only | existing mobile contracts |
| Voice | Input/presentation only; voice authorization deferred | existing pushVoice contract |
| PWA/offline mutations | No background replay | existing BackgroundMutationFence |
| Renderer failure | Local circuit-breaker, not target-down | existing RendererFailureIsolation |
| Privacy | REDACT/MINIMAL are presentation, not ACL; avoid sensitive prefetch | existing PrivacyPresentation + egress policy |
| Accessibility | Keyboard/screen reader/text+color/reduced motion/non-invasive aria-live | existing accessibility contract |

## Native LibreChat reuse

Do not duplicate these upstream surfaces:

- Agents and agent capabilities;
- Artifacts (React, HTML, SVG, Markdown, Mermaid);
- MCP and MCP UI resources;
- Tool Approval / human-in-the-loop;
- Skills;
- Subagents;
- background tool calls;
- Files / file context / file search / RAG integration;
- speech input/output surfaces;
- resumable streams;
- ACL/permissions;
- SidePanel / Presentation integration points.

## Materiality

The source code above is not proof that a target runtime is connected. VX13 remains DESIGN_CONSOLIDATION/UNCONFIGURED. MANOJOS3 remains PREPARED_UNCONFIGURED from LibreChat's side until a real binding is admitted and read back.
