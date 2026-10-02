# HANDOFF CURRENT

## Estado
`SEMANTIC_MODEL_RECONCILED_V2_SOURCE_ONLY`

## Semántica canónica

- LibreChat = plataforma Conversation/UI externa.
- Nostromo = cabina/shell dentro de LibreChat.
- Tentáculo HUD = mascota/proxy visual sin autoridad.
- Tentáculo Link = ingress/frontdoor VX13; no es el HUD.
- AUTO/BOTH = TargetScope de lectura/vista; nunca ConcreteTargetId.
- VX13/MANOJOS3 = targets materiales.
- ORÁCULO = advisory provider.
- GREEN/YELLOW/RED = control_class; R0/R1/R2/R3 = risk.
- ToolApproval UI != target authorization.
- authorizationRef = referencia a decisión/grant/challenge emitido por la autoridad del target.
- UiAction/Artifact interaction != efecto material.
- path readiness != ejecución != MATERIAL_VERIFIED.
- MATERIAL_VERIFIED = readback + verification + receipt.
- policy authority != executor != verifier.
- LibreChat subagent != VX13 hija != target run.

## Fixes estructurales

- CockpitWindow incluye EVIDENCE.
- target/source/integration/live separados.
- actionLifecycle deja de insinuar efectos materiales por click.
- DecisionInbox/MutationFence usan authorizationRef.
- ModuleVisualCard separa policy/executor/verifier.
- UiAction schema separa control_class de risk.
- ConversationEnvelope usa targetScope.
- ReadOnlyTargetAdapter devuelve verification UNAVAILABLE, no FAILED.

## Materialidad

Último commit ejecutado en Lenovo: `94c632762f7afee7d9fa9d0f0c23c80d7494d2d2` con 26 tests PASS.

Este HEAD sigue GitHub-only:
- source tests = NOT_RUN;
- LibreChat runtime = NO_VERIFICADO;
- VX13 runtime = DESIGN_CONSOLIDATION;
- MANOJOS3 LibreChat binding = PREPARED_UNCONFIGURED.
