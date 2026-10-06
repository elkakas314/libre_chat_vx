# Nostromo / Tentáculo feature matrix — CURRENT

Status: `SOURCE_IMPLEMENTED_PARTIAL / UPSTREAM_BINDING_PARTIAL / TARGET_RUNTIME_PENDING`

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
| Provider status → HUD bridge | PARTIAL_SOURCE | NO_VERIFICADO | projection exists; live cockpit bridge not connected |
| NostromoTargetGateway facade | DESIGNED_CURRENT | NOT_IMPLEMENTED | in-process target abstraction; authority=false |
| MANOJOS3 TargetAdapter | SOURCE_ENTRYPOINTS_PREPARED | UNCONFIGURED | adapter must use real MANOJOS3 MCP |
| VX13 TargetAdapter | DESIGNED_CURRENT | UNCONFIGURED | future Tentáculo Link binding |
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

Current-head full tests, upstream overlay revalidation, Cloudflare live binding, HUD provider bridge and target bindings remain separate gates.
