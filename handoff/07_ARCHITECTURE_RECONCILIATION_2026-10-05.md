# ARCHITECTURE RECONCILIATION — TENTÁCULO HUD / NOSTROMO / MANOJOS3

Date: 2026-10-05
Status: SOURCE_DESIGN_RECONCILED / LIVE_NO_VERIFICADO / MATERIAL_VERIFIED=NO

## Decision

The external architecture review is accepted selectively. Its strongest contributions are adopted as SOURCE design:
- Tentáculo HUD as a read-only operational truth projection inside LibreChat.
- Independent CONNECTION / READINESS / WORK / EVIDENCE lanes.
- Provider Mesh separated from material authority.
- Event-driven projection with cursor/dedupe/gap/snapshot recovery.
- UNKNOWN_OUTCOME as a hard fence before any material retry.
- Decision Inbox, provider/context/tool/trace lazy panels.
- TargetCapabilityProjection, CrossTargetTruthEnvelope, SkillMirrorManifest, EvidenceRef, ReceiptRef, RecoveryEnvelope and TrustedSurfaceIntent.
- Tool Search descriptor-first with lazy schema fetch.
- BackgroundTask/Subagent/Agent controls explicitly separated from TargetRun.
- mobile/PC recovery without mutation replay.
- latency path kept to browser -> LibreChat -> provider route -> inference for normal chat.

## Corrections against current source

The external review is NOT copied literally where it invents runtime facts.

### MANOJOS3 current source-backed endpoints
Current MANOJOS3 source exposes:
- MCP gateway default: `http://127.0.0.1:8790/mcp`.
- MCP gateway -> control-plane default: `http://127.0.0.1:8787`.
- LiteLLM managed loopback: `http://127.0.0.1:4000/v1`.
- host-control is a separate MANOJOS3 host surface historically observed on 8791 and is NOT a LibreChat direct contract.
LibreChat must receive deployment-reachable service URLs; it must never assume host loopback works from another container.

The external proposed 7001/7002/7101/7201 assignments are design placeholders only and are rejected as canon.

### MANOJOS3 MCP contract
Do not invent parallel semantic tool names such as `m3.target.describe` as real tools.
The current published MCP source maps to:
- `manojos_status`
- `manojos_capabilities`
- `manojos_skills`
- `manojos_attach`
- `manojos_prepare`
- `manojos_submit`
- `manojos_run`
- `manojos_authorization_requirement`
- `manojos_authorization`
- `manojos_resume`
- `manojos_advance`
- `manojos_pause`
- `manojos_cancel`
- `manojos_receipt`

LibreChat may expose a stable internal adapter interface, but it maps to those real tools and does not create another execution API.

### Authorization semantics
The external review assumed R2/R3 always require a per-operation human grant. Current MANOJOS3 source says the live `grant_interface` decides:
- `OPERATOR_MODE_AUTONOMOUS`: Policy/Kernel govern declared R2/R3 without per-step human grants.
- `LOCAL_CLI_AUTHORIZE_STEP_ONLY`: exact local authorization gate remains required.
Tentáculo HUD must therefore PROJECT the live authorization requirement instead of inventing a fixed human-approval rule.

### Provider aliases
Current MANOJOS3 source/config contains semantic aliases including:
- `manojos-general-free`
- `manojos-coding-free`
- `manojos-reasoning-free`
- `manojos-fast-free`
- `manojos-long-context-free`
Their LIVE availability is never inferred from config. ProviderHealth + canary decides usability.

### Cache/runtime simplification
The external review proposed Redis as mandatory HUD cache/fan-out. This is NOT adopted as a new mandatory service until LibreChat baseline/source and measured need prove it.
Canon:
- Tentáculo Projection Module is in-process with LibreChat.
- operational truth stays in MANOJOS3/VX13/provider owners.
- use existing/native cache/event facilities first.
- add Redis only if already part of the chosen LibreChat deployment or a benchmark proves it is needed.
No HUD database is ever introduced.

## Tentáculo HUD final SOURCE contract

`CORE_MINIMUM`:
`TARGET | CONNECTION | READINESS | WORK | EVIDENCE | AUTH | PROVIDER | FRESHNESS`

Lazy panels:
1. Target & Run
2. Evidence
3. Decision Inbox
4. Provider Mesh
5. Context
6. Tools & Skills
7. Conversation Trace
8. Recovery / Alerts

Read models:
- `TargetStatusView`
- `ProviderStatusView`
- `ActiveRunView`
- `DecisionInboxView`
- `EvidenceView`
- `ContextUsageView`
- `ToolSkillView`
- `ConversationTraceView`

Rules:
- HUD has no authority.
- cached projection is never material truth.
- every operational field carries provenance + observed_at + freshness.
- CONNECTED != READY.
- FINISHED != VERIFIED.
- VERIFIED != RECEIPT_AVAILABLE.
- focus != ConcreteTargetId.
- AUTO/BOTH never mutate.
- UI task != TargetRun.
- cognitive trace != material evidence.
- Tool Approval != target authorization.
- UNKNOWN_OUTCOME blocks automatic retry.

## Event/recovery contract

Each target/provider projection event must carry:
- schema_version
- event_id
- stream_id
- monotonic sequence within stream
- target_id/run_id where applicable
- occurred_at/emitted_at/received_at
- provenance owner/source instance
- payload
- freshness metadata when source supplies it

Projector behavior:
- duplicate event_id => drop.
- sequence gap => mark stale/GAP_DETECTED.
- request missed events when possible.
- otherwise request authoritative snapshot.
- snapshot installs a source sequence/cursor.
- high-rate metrics may coalesce.
- authorization/evidence/terminal run transitions never coalesce.
- healthy event channel => no fixed polling.
- reconnect => cursor replay or snapshot/resync.
- no event replay may replay a material action.

## Provider Mesh SOURCE contract

Normal chat critical path:
`browser -> LibreChat -> ProviderRouteResolver -> selected inference route -> stream`.

Route policy:
1. classify task.
2. filter by required capabilities/context/vision/privacy.
3. exclude paid routes when `paid_fallback_allowed=false`.
4. exclude UNAVAILABLE routes.
5. prefer MANOJOS3 LiteLLM when its selected alias is LIVE/eligible.
6. allow explicitly configured free direct/local fallback for cognitive inference.
7. provider failover may repeat a cognitive request only when no material effect is outstanding.
8. provider/model change never changes target, authorization, run identity or receipt.

Local model remains optional and benchmark-gated.

## Build order after reconciliation

1. Freeze/version contracts and invariants.
2. Audit actual LibreChat upstream support for every claimed native feature before binding it.
3. Run exact source tests on current branch.
4. Revalidate pinned upstream + overlay.
5. Bind Provider Mesh aliases/health with no-paid invariant.
6. Bind current real MANOJOS3 MCP tools; bootstrap status/capabilities/skills.
7. Implement/readback Tentáculo read models and event recovery.
8. Implement CORE_MINIMUM + Decision Inbox.
9. Verify Tool Search/Skills/Trace/Context integration against actual upstream source.
10. Run M3 R0 with evidence.
11. Run provider failover + context/recovery/mobile tests.
12. Run first controlled M3 material mutation only after live authorization semantics are read from MANOJOS3.
13. Chaos: timeout after possible effect -> UNKNOWN_OUTCOME -> reconcile.
14. Only then add VX13 parity.

## Promotion truth

All of the above is DESIGN/SOURCE intent until tests/readback prove otherwise.
Do not convert architectural “PASS BY DESIGN” into LIVE/VERIFIED/MATERIAL_VERIFIED.

NEXT_IMPLEMENTATION_ACTION=Freeze the reconciled contracts and run SOURCE_READY audit/tests on the exact branch HEAD, then bind the real MANOJOS3 MCP and Provider Mesh without inventing additional runtime services.
