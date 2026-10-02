# LibreChat VX — semantic model CURRENT

## Core vocabulary

### LibreChat

The external conversation/UI platform. It owns presentation, conversation continuity and native UI/tool surfaces. It is not VX13 and it is not MANOJOS3.

### Nostromo / cabina

The compositional shell inside LibreChat: conversation + StatusRail + CurrentFocus + DecisionInbox + ArtifactDock + contextual windows. Nostromo is not a service, target, router, policy engine or authority.

### Tentáculo HUD

The visible mascot/HUD and visual proxy. It follows focus, attention and evidence and can change **view scope** between VX13, MANOJOS3, BOTH or AUTO. It is not an agent and does not execute work.

### Tentáculo Link

VX13 ingress/frontdoor. It is unrelated to the visual Tentáculo HUD except by product naming. HUD must never be treated as Tentáculo Link.

## Scope versus target

- `TargetScope = AUTO | BOTH | VX13 | MANOJOS3`.
- `ConcreteTargetId = VX13 | MANOJOS3`.
- AUTO and BOTH are read/view scopes only.
- A material request always requires one concrete target.
- TargetOverride is one-turn READ only and never changes primary scope.

## Source, integration and observation

These are independent layers:

1. **TargetParityDescriptor** — static source/design description.
2. **TargetIntegrationState** — LibreChat-side adapter/binding state.
3. **TargetRuntimeObservation** — fresh live observation with provenance.

A source document cannot create live observation. An installed adapter cannot imply target readiness.

## Readiness versus material completion

Forbidden shortcut: `materialReady`.

Use:

- `governedReadPathReady` — a live governed read path exists now.
- `governedMutationPathReady` — a live governed mutation path exists now.
- `MATERIAL_VERIFIED` — a specific run completed with readback + verification + receipt.

Target path readiness is not proof that any work was executed.

## Authority model

VX13:
- policy/authorization: Madre;
- execution: Spawner/hija;
- verification: Madre.

MANOJOS3:
- admission/orchestration: Governor;
- policy/authorization: Policy;
- execution: Kernel/adapter path;
- verification: Verifier.

LibreChat, Tentáculo HUD, model text, Artifacts, MCP transport and UI animation own none of those authorities.

## Approval versus authorization

LibreChat ToolApproval is an approval **interaction surface**. It may present/respond to a target-owned decision, but it is not itself Madre/Policy authorization.

Use `authorizationRef` only for a target-owned authorization/challenge/grant reference.

## Artifact semantics

- Artifact = presentation/content surface.
- Interactive Artifact = local preview or UiIntent projection.
- TrustedSurfaceHost = separately hardened operational surface.
- Slider/knob/button movement never directly mutates a target.
- `AUTHORIZATION_RESPONSE` responds to an owner-issued challenge; it never creates authorization.

## Run semantics

- Plan graph != active flow.
- ActiveFlow shows only observed/evidenced edges.
- Work `SUCCEEDED` != `MATERIAL_VERIFIED`.
- Material completion requires all of:
  - readback reference;
  - verification reference;
  - receipt reference.

## Subagents, hijas and background tasks

- LibreChat subagent = cognitive child task.
- VX13 hija = material executor under Spawner.
- MANOJOS3 worker/adapter task = target-owned execution path.
- LibreChat background tool call = UI/tool task.

These may be displayed together but must retain `taskClass`, `systemScope` and authority owner.

## ORÁCULO

ORÁCULO is an advisory provider, not a peer material target in the VX13/MANOJOS3 target selector. It can be shown as advisory provenance or routed through MANOJOS3 when admitted.

## Truth lanes

Keep independent:

- CONNECTION
- READINESS
- WORK
- EVIDENCE

`UNKNOWN` is a real state. `NOT_APPLICABLE` evidence is different from `MISSING`.

## UI colours

GREEN/YELLOW/RED classify UI intent only.

- GREEN: read/local explanation.
- YELLOW: prepare/draft/propose.
- RED: prepare a material request.

Colour never authorizes an effect.

## Canonical semantic invariants

1. HUD != Link.
2. Scope != target.
3. Readiness != completion.
4. Approval UI != authorization authority.
5. Artifact != TrustedSurfaceHost.
6. Subagent != hija.
7. Background task != target run.
8. Source != live observation.
9. Health/HTTP 200 != work success.
10. Work success != material verification.
