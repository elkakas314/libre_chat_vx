# Nostromo / Tentáculo feature matrix — CURRENT

Status: `SOURCE_IMPLEMENTED / UPSTREAM_BINDING_PARTIAL / TARGET_RUNTIME_PENDING`

## Core feature map

| Feature | Behaviour | Implementation |
|---|---|---|
| One voice / no operator modes | Conversation remains primary; target and windows move underneath it | `NostromoCockpit`, `TargetScopeNavigator`, `windowRouter` |
| Tentáculo HUD | Same visual HUD moves across MANOJOS3, VX13, BOTH or AUTO; authority always false | `tentacleHud.ts`, `TentacleHud.tsx` |
| MANOJOS3 Interflow map | Domain → intent family → operation → internal driver; not raw capability navigation | `manojos3/interflowProjection.ts`, `InterflowLensView.tsx` |
| Capability drilldown | Driver/evidence detail only, grouped into bounded lenses | `capabilityLens.ts` |
| StatusRail | Connection/readiness/freshness/source truth remain separate | `statusRail.ts` + `StatusRailView` |
| MinimalTruth | Binding/runtime/source alignment without inventing material completion | `MinimalTruthView.tsx` |
| CurrentFocus / "eso" | Focus + short referential memory with TTL | currentFocus/referentialContinuity + `shortMemory.ts` |
| ContextInspector | System/module/capability/run/artifact refs without power | `ContextInspectorView.tsx` |
| Automatic windows | Files/audio/browser/build/runtime/model/plan/security/interflow from focus | `windowRouter.ts` |
| GREEN controls | Explain/refresh/evidence/context/read-gap; read/local only | `controlDeck.ts` |
| YELLOW controls | Prepare proposal/audit/quarantine/evolution | `controlDeck.ts` |
| RED controls | Prepare governed material request only | `controlDeck.ts` |
| DecisionInbox | Owner-issued decisions only | native ToolApproval reuse + DecisionInbox |
| Interactive Artifacts | buttons/sliders/knobs/decision/authorization response → UiIntent | `interactiveArtifact.ts`, `InteractiveArtifactView.tsx` |
| ActiveFlow | Executed/evidenced edges only | `ActiveFlowView` |
| PlanGraph | PLAN_CREATED != MATERIAL_VERIFIED | `PlanGraphView` |
| TargetRun | Same projection shell, distinct target authority chains | `targetRun.ts`, `TargetRunView.tsx` |
| Files | ExternalResourceRef operations remain separately authorized | `FilesPanelView.tsx` |
| SHUB/REAPER | Project/track/plugin/parameter/readback/A-B evidence | `AudioPanelView.tsx` |
| Browser | Remote DOM untrusted; ambiguous effect timeout → UNKNOWN_OUTCOME | `BrowserPanelView.tsx` |
| Build | plan/package/test/material stages remain distinct | `BuildPanelView.tsx` |
| Background tasks | LibreChat cognitive/tool task != target run | `BackgroundTasksView.tsx` |
| Mobile | same conversation/backend; offline read-only | mobile contracts |
| Voice | input/presentation only | pushVoice contract |
| PWA mutation replay | forbidden | BackgroundMutationFence |

## MANOJOS3 current source projection

Current source inspected at `cb772cca...`:

- 31 semantic domains;
- 6 operation gateways;
- target stack: Intent Router → Slot Resolver → Operation Compiler → Operation Gateway → Policy/Kernel → Driver Adapters → Verifier/Receipt;
- capability execution matrix: 252 rows, not a functional parity claim.

## Native LibreChat reuse

Do not duplicate Agents, Artifacts, MCP/MCP UI, ToolApproval, Skills, Subagents, background tool calls, Files/RAG, Speech, resumable streams, ACL or SidePanel.

## Materiality

Source implementation does not prove target binding. Current-head tests remain NOT_RUN under the no-local restriction.
