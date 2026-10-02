# VX13 ↔ MANOJOS3 target parity for LibreChat

## Decision

LibreChat treats VX13 and MANOJOS3 as peer targets at the UI/projection boundary. They share an external safety contract but retain different internal authority chains.

### Shared external guarantees

Both targets must expose or project:

- explicit identity;
- connection independently from readiness;
- source state independently from live state;
- capability discovery before tool/action exposure;
- readback after possible effects;
- verifier result before material completion;
- receipt/evidence references;
- no authority in LibreChat, renderer, model, MCP transport or visual state;
- UNKNOWN_OUTCOME instead of blind retry after an ambiguous material timeout.

### MANOJOS3

Authority chain:

`Governor → Policy → Kernel → Adapter → Readback → Verifier → Receipt`

Current source is implemented and exposes a large typed capability registry. Its own LibreChat adapter is deliberately fail-closed: `librechat.thread.read` and `librechat.message.send` remain unavailable until a real LibreChat binding exists.

### VX13

Authority chain from the current repository/master:

`Tentáculo Link → Switch → Madre → Manifestator if needed → Spawner/hija → Readback → Madre verification → receipt projection`

The VX13 GitHub repository is currently design/governance only. It must therefore remain `DESIGN_CONSOLIDATION / UNCONFIGURED / NO_VERIFICADO` in LibreChat. A future green health response alone must not upgrade it to material-ready.

## Parity rule

“Aligned” means equivalent external truth and safety semantics, not identical internals.

LibreChat must never collapse:
- Madre into MANOJOS3 Kernel;
- MANOJOS3 Governor into Switch;
- Spawner/hijas into MANOJOS3 adapters;
- ORÁCULO advisory output into target authority.

## Promotion gates

A target becomes materially actionable in LibreChat only when all are true:

1. binding is `BOUND_GOVERNED`;
2. connected/readiness is fresh;
3. source revision and live revision reconcile;
4. capability is present in live discovery;
5. target-owned authorization policy admits the operation;
6. readback, verification and receipt are available.

Until then the cockpit remains source/read-only or degraded according to observed truth.
