# LIBRECHAT HANDOFF CURRENT

Mode: `SOURCE_ONLY`.

## Active architecture

`NOSTROMO_HYBRID`

There is one active LLM architecture, not five.

```text
LibreChat
→ Nostromo local voice (~1–2 GB)
   ├─ MANOJOS3 LiteLLM free reasoning when needed
   └─ MANOJOS3 MCP for governed actions
→ same personality to user
```

## MANOJOS3 GPT semantics imported

Bootstrap is read-only:
`manojos_gpt_migration_profile → status → capabilities → skills → optional attach`.

Do not submit an objective just to acquire context.

Human input is a natural objective. Capabilities are internal drivers.

Technical slots are resolved/inferred when possible. Ask the user only for true semantic ambiguity, real risk/authorization, irreversible choice or unavailable required data.

MCP and LLM routing have `authority=false`.

Material success requires verified receipt + current evidence + readback.

Ambiguous effects require readback/reconcile before retry.

## Tentáculo HUD

HUD state is model-independent.

It derives from structured target state:
status/capabilities/skills/Interflow/run/authorization/receipt/readback.

Therefore a small local model does not reduce HUD correctness.

## Native LibreChat surfaces / visor

Pinned upstream:
`LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`.

Current source bindings:

| Surface | Mode | Source state | Role |
|---|---|---|---|
| SIDE_PANEL | WRAP_NATIVE | SOURCE_WRAPPER_IMPLEMENTED | One shared native side panel; Artifact > Subagent > Nostromo |
| ARTIFACTS | WRAP_NATIVE | SOURCE_PINNED | Native artifact/interactive presentation; no direct target effect |
| TOOL_APPROVAL | EVENT_BRIDGE | SOURCE_WRAPPER_IMPLEMENTED | Native approve/reject/edit/respond UI; never mints target authorization |
| MCP_UI | WRAP_NATIVE | SOURCE_PINNED | Native sandboxed HTML visor/renderer below TrustedSurfaceHost gates |
| TOOLS_DROPDOWN | PROJECTION_ONLY | SOURCE_WRAPPER_IMPLEMENTED | Native LibreChat permission AND target capability/binding gate |
| FILES | WRAP_NATIVE | SOURCE_PINNED | Native file listing/view; edit/delete/move stay separately governed |
| SUBAGENTS | EVENT_BRIDGE | SOURCE_PINNED | Cognitive child-task projection only; not MANOJOS3 workers |
| BACKGROUND_TASKS | EVENT_BRIDGE | SOURCE_PINNED | LibreChat background task projection; not TargetRun proof |
| RESUMABLE_STREAMS | EVENT_BRIDGE | SOURCE_WRAPPER_IMPLEMENTED | Conversation/tool/subagent resume; never replays target material effects |

Additional VX source views already exist:
- ArtifactDockView;
- InteractiveArtifactView;
- ModuleIndexView;
- NativeSurfaceStatusView;
- FilesPanelView;
- BrowserPanelView;
- AudioPanelView;
- BuildPanelView;
- BackgroundTasksView;
- TargetRunView;
- InterflowLensView;
- CapabilityLensView;
- DecisionInboxView;
- ContextInspectorView;
- MinimalTruthView;
- TentacleHud;
- NostromoHybridView.

Important truth boundary:
`SOURCE_BINDINGS_IMPLEMENTED_RUNTIME_UNVERIFIED`.

The current overlay has not been revalidated after the latest source changes.

## Who moves each part

The local voice LLM does **not** move the HUD, panels or target state.

```text
USER TEXT
   │
   ├─ simple conversation ──> Nostromo local voice
   │
   ├─ deep/coding/long-context ──> MANOJOS3 LiteLLM free advisor
   │
   └─ action objective ──> MANOJOS3 MCP
                              │
                              ▼
                    Semantic/Intent/Interflow
                              │
                    Governor/Policy/Kernel
                              │
                       driver + readback
                              │
                     Verifier / Receipt
```

UI movement/ownership:

- `windowRouter.ts` derives the focus domain and chooses which Nostromo windows are visible.
- `NostromoCockpit.tsx` composes those windows.
- Native LibreChat owns native Artifact/Files/ToolApproval/Subagent/Background/SSE lifecycle.
- MANOJOS3 structured readbacks feed TargetRun, Interflow, authorization, evidence and Tentáculo HUD.
- `InteractiveArtifactView` emits UI intents/previews only; it never performs a direct target mutation.
- `ArtifactDock` presents artifacts/evidence/receipts and enforces local ACL freshness for UI operations.
- Local Nostromo voice turns structured state/results into one stable conversational personality.
- MANOJOS3 LiteLLM supplies reasoning only.
- MANOJOS3 Policy/Kernel remain the material authority/executor path.

## Information flow

There are five separate information lanes:

1. **Conversation lane**  
   User → local Nostromo voice → optional free reasoner → answer.

2. **Objective/action lane**  
   Natural objective → MANOJOS3 MCP → Semantic/Intent/Interflow → Policy/Kernel → readback/receipt.

3. **Projection/HUD lane**  
   MANOJOS3 status/capabilities/skills/run/authorization/receipt → structured projection → Tentáculo HUD / TargetRun / Interflow / Capability lenses.

4. **Native LibreChat lane**  
   Native events/state → Artifacts / MCP UI / Files / ToolApproval / Subagents / Background Tasks / resumable streams.

5. **Evidence lane**  
   receipts + readback + artifacts + evidence refs → ArtifactDock / Evidence views.

A viewer, artifact or button may display/prepare a request, but does not become target authority.

## Runtime degradation

- `FULL`: local voice + free reasoner + MANOJOS3 MCP.
- `LOCAL_PLUS_ACTIONS`: local voice + MCP; reduced deep reasoning.
- `LOCAL_ONLY`: conversation only; no live MANOJOS3 actions/HUD.
- `HUD_ONLY`: local voice unavailable but structured MCP read model still available.
- `UNAVAILABLE`: LibreChat shell unavailable.

## Drive CURRENT

- Start Here: `10sokDQr6eFQGSceTl0KYwfVinmF8ixTUz-XG0e8RyjQ`
- Nostromo Hybrid: `1PqXk7nM8M_arbI472RU5n4T0rFQI1Yt-MH54VSapYc8`
- MANOJOS3 GPT Semantic Bridge: `1gAbtU0XISM4GWuspp-6wWEZACAycWtZBqzMrEJUu6y0`
- MANOJOS3 entrypoints: `19WZ2DM3pXyIe9-mhyq_3oVXQ63QmvDBf7i720mGW1N4`
- VX13 parity: `1i_sw3ZYXdu3-wFrmAxTw42PppT6wxMOK8G2jKI4onF8`

The old five-topology Drive documents are marked SUPERSEDED.

## Proof boundary

Current source tests: `NOT_RUN / STALE_PROOF`.

Last material proof remains `26 PASS @ 94c632762f7afee7d9fa9d0f0c23c80d7494d2d2`.

No local host was touched.

## Next boundary

`WAIT_FOR_LOCAL_REVALIDATION_PERMISSION_OR_LIVE_BINDING`
