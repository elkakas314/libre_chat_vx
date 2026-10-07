# LibreChat VX — semantic model CURRENT

## Core vocabulary

### LibreChat

The external conversation/UI platform. It owns presentation, conversation continuity and native UI/tool surfaces. It is not VX13 and it is not MANOJOS3.

### Nostromo / cabina

The compositional shell inside LibreChat: conversation + StatusRail + CurrentFocus + DecisionInbox + ArtifactDock + contextual windows.

NOSTROMO is primarily the user's interpreter, explainer and visual cockpit. It is not a material executor or authority.

### Tentáculo HUD

The visible mascot/HUD and visual proxy. It follows focus, attention and evidence and can change **view scope** between VX13, MANOJOS3, BOTH or AUTO.

The HUD itself remains presentation only.

### Tentáculo Companion

A lightweight cognitive companion associated with the HUD. It may interpret intent, perform read-only observation, research public information, navigate resources, compose visualizations/Artifacts and triage incoming events.

It is not a target authority and cannot execute material work.

### Tentáculo Link

VX13 ingress/frontdoor. It is unrelated to the visual Tentáculo HUD/Companion except by product naming. HUD/Companion must never be treated as Tentáculo Link.

## Scope versus target

- `TargetScope = AUTO | BOTH | VX13 | MANOJOS3`.
- `ConcreteTargetId = VX13 | MANOJOS3`.
- AUTO and BOTH are read/view scopes only.
- A material request always requires one concrete target.
- TargetOverride is one-turn READ only and never changes primary scope.

## Cognitive profiles

Internal semantic profiles are:
- RAPIDO
- NORMAL
- PENSAR
- INVESTIGAR
- VISUALIZAR
- CONTEXTO_LARGO
- VISION

There is no dedicated CODIGO identity/profile. Coding execution belongs to specialist systems, while NOSTROMO can still understand and route the user's coding-related intent.

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

LibreChat, Tentáculo HUD/Companion, model text, Artifacts, MCP transport and UI animation own none of those authorities.

## Artifact semantics

- Artifact = presentation/content surface.
- Interactive Artifact = local preview or UiIntent projection.
- TrustedSurfaceHost = separately hardened operational surface.
- Slider/knob/button movement never directly mutates a target.
- `AUTHORIZATION_RESPONSE` responds to an owner-issued challenge; it never creates authorization.

## Research semantics

- public web research may use LibreChat Web Search directly;
- target operational truth uses target readback;
- file/document questions prefer File Search/Context;
- browser automation is reserved for interaction that search/read cannot perform.

## Event semantics

Authenticated Agent Events may wake/continue a LibreChat Agent for notifications or triage.

An event is information, not authorization and not a receipt.

## ORÁCULO

ORÁCULO is an advisory provider, not a peer material target in the VX13/MANOJOS3 target selector. It can be shown as advisory provenance or routed through the target architecture when admitted.

## Truth lanes

Keep independent:
- CONNECTION
- READINESS
- WORK
- EVIDENCE

`UNKNOWN` is a real state. `NOT_APPLICABLE` evidence is different from `MISSING`.

## Canonical semantic invariants

1. HUD/Companion != Link.
2. Scope != target.
3. Readiness != completion.
4. Approval UI != authorization authority.
5. Artifact != TrustedSurfaceHost.
6. Subagent != hija.
7. Background task != target run.
8. Source != live observation.
9. Health/HTTP 200 != work success.
10. Work success != material verification.
11. Event != authorization/receipt.
12. LibreChat interprets/presents; target systems execute.
