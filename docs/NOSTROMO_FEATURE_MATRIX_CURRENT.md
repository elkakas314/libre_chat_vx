# Nostromo / Tentáculo feature matrix — CURRENT

Status: `SOURCE_CORE_IMPLEMENTED / UPSTREAM_BINDING_PARTIAL / TARGET_RUNTIME_PENDING`

## Core feature map

| Feature | Source state | LIVE | Implementation / contract |
|---|---|---|---|
| One voice / no operator modes | IMPLEMENTED_SOURCE | NO_VERIFICADO | `NostromoCockpit`, focus + contextual windows |
| Tentáculo HUD | IMPLEMENTED_SOURCE | NO_VERIFICADO | HUD model + React projection; authority=false |
| StatusRail / truth lanes | IMPLEMENTED_SOURCE | NO_VERIFICADO | connection/readiness/work/evidence separated |
| CurrentFocus / referential continuity | IMPLEMENTED_SOURCE | NO_VERIFICADO | focus + short memory/TTL |
| Automatic contextual windows | IMPLEMENTED_SOURCE | NO_VERIFICADO | Files/audio/browser/external-work/runtime/model/plan/security/interflow |
| ArtifactDock / evidence projection | IMPLEMENTED_SOURCE | NO_VERIFICADO | artifacts/evidence/receipt presentation only |
| Interactive UI intent | IMPLEMENTED_SOURCE | NO_VERIFICADO | preview/UiIntent; no direct target effect |
| DecisionInbox | SOURCE_COMPOSED | NO_VERIFICADO | native ToolApproval reused as interaction surface |
| ActiveFlow | IMPLEMENTED_SOURCE | NO_VERIFICADO | observed/evidenced edges only |
| PlanGraph | IMPLEMENTED_SOURCE | NO_VERIFICADO | plan != material completion |
| TargetRun | IMPLEMENTED_SOURCE | NO_VERIFICADO | same shell, distinct target authorities |
| Files panel | IMPLEMENTED_SOURCE + NATIVE_REUSE | NO_VERIFICADO | ExternalResourceRef + governed mutations |
| Resource Tree | IMPLEMENTED_SOURCE | NO_VERIFICADO | generic lazy hierarchy for Drive/OneDrive/LibreChat/VX13/MANOJOS3 resource nodes |
| Adapter compatibility report | IMPLEMENTED_SOURCE | NO_VERIFICADO | fail-closed upstream commit/blob/cleanliness/overlay compatibility contract |
| SHUB/REAPER panel | IMPLEMENTED_SOURCE | NO_VERIFICADO | project/track/plugin/parameter/readback/A-B projection |
| Browser panel | IMPLEMENTED_SOURCE | NO_VERIFICADO | remote DOM untrusted; UNKNOWN_OUTCOME on ambiguous effect |
| External work/evidence panel | IMPLEMENTED_SOURCE | NO_VERIFICADO | existing BuildPanel reused only to visualize external plan/package/test/material evidence; not a coding worker |
| Background tasks | NATIVE_REUSE + SOURCE_PROJECTION | NO_VERIFICADO | cognitive/tool task != target run |
| Mobile continuity | IMPLEMENTED_SOURCE | NO_VERIFICADO | same backend/history; offline read-only |
| Voice | SOURCE_CONTRACT | NO_VERIFICADO | input/presentation only; authorization disabled |
| PWA mutation replay | FORBIDDEN | FORBIDDEN | BackgroundMutationFence |
| Semantic inference profiles | IMPLEMENTED_SOURCE_V2 | NO_VERIFICADO | Rápido/Normal/Pensar/Investigar/Visualizar/Contexto largo/Visión; no dedicated coding profile |
| Provider capability model | IMPLEMENTED_SOURCE | NO_VERIFICADO | TEXT/VISION/AUDIO/STRUCTURED_OUTPUT/TOOLS/LONG_CONTEXT |
| Zero-cost provider admission | IMPLEMENTED_SOURCE | NO_VERIFICADO | fail-closed health/quota/privacy/freshness/capability |
| Cloudflare AI Gateway client | IMPLEMENTED_SOURCE | NO_VERIFICADO | OpenAI-compatible request contract + no-wholesale guard |
| NOSTROMO identity | IMPLEMENTED_SOURCE | NO_VERIFICADO | versioned provider-independent identity |
| Structured output guard | IMPLEMENTED_SOURCE | NO_VERIFICADO | rejects model-authored material authority fields |
| Provider status projection | IMPLEMENTED_SOURCE | NO_VERIFICADO | provider/model/caps/health/latency/quota/freshness |
| Provider status → HUD bridge | IMPLEMENTED_SOURCE | NO_VERIFICADO | separate inference lane projected into Tentáculo HUD; target truth remains separate |
| NostromoTargetGateway facade | IMPLEMENTED_SOURCE | NO_VERIFICADO | in-process facade; authority=false; AUTO unresolved fails closed; no material retry |
| MANOJOS3 TargetAdapter | IMPLEMENTED_SOURCE | UNCONFIGURED | injectable MANOJOS3 MCP transport; R0 reads supported; material path fail-closed until binding |
| VX13 TargetAdapter | DESIGNED_CURRENT | GATE_EXTERNAL | future Tentáculo Link/canonical frontdoor binding; intentionally not fabricated |
| ORÁCULO advisory | DOCUMENTED_CURRENT | NO_VERIFICADO | advisory/provider only; authority=false |
| Intent Interpreter | IMPLEMENTED_SOURCE | NO_VERIFICADO | conversation/research/visualization/target read/target command/clarify |
| Presentation Planner | IMPLEMENTED_SOURCE | NO_VERIFICADO | chat/tree/timeline/table/Mermaid/evidence/interactive Artifact |
| Tentáculo Companion | IMPLEMENTED_SOURCE | NO_VERIFICADO | lightweight cognitive helper; material execution forbidden |
| Public research policy | IMPLEMENTED_SOURCE + NATIVE_REUSE | NO_VERIFICADO | target truth→readback, docs→File Search, public→Web Search, browser only when interaction is needed |
| Agent Events bridge | IMPLEMENTED_SOURCE + NATIVE_REUSE | NO_VERIFICADO | idempotent inbound notifications from M3/VX13/ORÁCULO; events never authorize |
| Model Registry active+reserve pool | IMPLEMENTED_SOURCE | NO_VERIFICADO | broad verified-zero-cost catalog; target 6 active/profile + admitted reserves |

## Native LibreChat reuse

Do not duplicate:
- Agents;
- Artifacts;
- MCP/MCP UI;
- ToolApproval;
- Skills;
- Subagents;
- background tool calls;
- Files/RAG;
- Speech;
- resumable streams;
- ACL;
- SidePanel.

## Router rule

Cloudflare AI Gateway is the inference gateway only.

Target actions use:
```text
LibreChat -> NostromoTargetGateway -> TargetAdapter -> target frontdoor
```

For MANOJOS3 the TargetAdapter uses MCP. For VX13 the future adapter uses Tentáculo Link.

## Materiality

Source implementation does not prove target binding or LIVE provider routing.

Exact-head source tests and pinned-upstream overlay build PASS under GitHub Actions run `37562733264` on the 2026-10-07 interpreter-first refactor HEAD lineage; `build-test=SUCCESS`, `overlay-smoke=SUCCESS`.
