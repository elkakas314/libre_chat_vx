# Nostromo / Tentáculo feature matrix — CURRENT

Status: `SOURCE_CORE_IMPLEMENTED / UPSTREAM_BINDING_PARTIAL / TARGET_RUNTIME_PENDING`

## Core feature map

| Feature | Source state | LIVE | Implementation / contract |
|---|---|---|---|
| One voice / no operator modes | IMPLEMENTED_SOURCE | NO_VERIFICADO | `NostromoCockpit`, focus + contextual windows |
| Tentáculo HUD | IMPLEMENTED_SOURCE | NO_VERIFICADO | HUD model + React projection; authority=false |
| StatusRail / truth lanes | IMPLEMENTED_SOURCE | NO_VERIFICADO | connection/readiness/work/evidence separated |
| CurrentFocus / referential continuity | IMPLEMENTED_SOURCE | NO_VERIFICADO | focus + short memory/TTL |
| Automatic contextual windows | IMPLEMENTED_SOURCE | NO_VERIFICADO | Files/audio/browser/build/runtime/model/plan/security/interflow |
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
| Build panel | IMPLEMENTED_SOURCE | NO_VERIFICADO | plan/package/test/material stages separated |
| Background tasks | NATIVE_REUSE + SOURCE_PROJECTION | NO_VERIFICADO | cognitive/tool task != target run |
| Mobile continuity | IMPLEMENTED_SOURCE | NO_VERIFICADO | same backend/history; offline read-only |
| Voice | SOURCE_CONTRACT | NO_VERIFICADO | input/presentation only; authorization disabled |
| PWA mutation replay | FORBIDDEN | FORBIDDEN | BackgroundMutationFence |
| Semantic inference profiles | IMPLEMENTED_SOURCE | NO_VERIFICADO | Rápido/Normal/Pensar/Código/Contexto largo/Visión |
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

Exact-head TypeScript build and source tests PASS under GitHub Actions (`source-check`, run `37541743838` on `53c172863671a4396e773addf2ebb5b1e4ac6a46`). Upstream overlay revalidation, Cloudflare live binding and real target bindings remain separate gates. SOURCE/CI PASS does not prove LIVE.
