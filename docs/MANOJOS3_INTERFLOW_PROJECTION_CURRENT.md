# MANOJOS3 → LibreChat Interflow Projection — CURRENT

Source read: `elkakas314/manojos3@cb772cca141f7ae5ae03af9655b3c5186f5826f6`.

## Correct semantic hierarchy

LibreChat must present MANOJOS3 in this order:

```text
human objective
  → semantic domain
  → intent family
  → Interflow plan / slots / missing slots / risk gates
  → operation compiler
  → operation gateway
  → Policy / Kernel
  → internal driver capabilities
  → readback
  → Verifier / Receipt
```

Capabilities are internal drivers. Their count is not the functional ceiling and must not be the primary HUD navigation model.

## Canonical source facts

`SEMANTIC_MATRIX_CANONICAL_CURRENT.json` at the current repo HEAD declares:

- semantic domains: **31**
- classic router domains: **14**
- router actions:
  - `IN_ROUTER_14`: 14
  - `EXTEND_ROUTER`: 12
  - `STANDALONE_NO_ROUTE`: 4
  - `DELEGATE_SEMANTIC`: 1

The file itself records internal `source_head=e910fce...`; this provenance is preserved rather than silently rewritten.

The operation matrix exposes six semantic gateways:

- `operation.status`
- `operation.catalog`
- `operation.read`
- `operation.canary`
- `operation.act`
- `operation.sync`

The runtime-audit target stack is:

`Intent Router → Slot Resolver → Operation Compiler → Operation Gateway → Policy/Kernel → Driver Adapters → Verifier/Receipt`.

## Capability matrix relationship

`CAPABILITY_EXECUTION_MATRIX.json` currently contains 252 unique capability rows:

- AVAILABLE: 189
- UNCONFIGURED: 63
- R0: 141
- R1: 46
- R2: 54
- R3: 11
- material capabilities declared by its summary: 65
- functional effects verified by that matrix: **0**
- the matrix explicitly states it is **not a functional parity claim**

LibreChat therefore treats these 252 rows as drill-down/driver data, not 252 user-facing buttons and not proof of runtime parity.

## HUD projection

The 31 domains are grouped into bounded lenses:

- OBSERVABILITY
- CAPABILITIES
- COMMUNICATIONS
- CONNECTORS
- BROWSER
- THREADS
- REPO
- CONTINUITY
- BUILD
- REPAIR
- MODELS
- HOST
- SCHEDULER
- SECURITY
- TOOLBUS
- SKILLS
- MAINTENANCE
- STATE_EVIDENCE
- COMPOSITE
- INTERNAL

Each domain preserves:

- intent capability;
- provider;
- risk;
- availability declared by source;
- router action;
- source flow file;
- visibility.

## Visibility semantics

`PRIMARY`: normal domain navigation.

`CONTEXTUAL`: shown when relevant to focus or diagnostics.

`INTERNAL`: never presented as a normal human action; accessible through evidence/diagnostics only.

`STANDALONE_NO_ROUTE` does not mean unavailable. It means the classic/automatic router must not select it as a normal routed domain.

`DELEGATE_SEMANTIC` means multi-domain semantic composition, not material execution.

## Generic flow detail

LibreChat implements a generic projector for any current `*_INTENT_FLOW_CURRENT.json`. It preserves:

- `intent_families`
- `drivers`
- `downstream_interflows`
- `rules`
- `output_fields`
- `acceptance`

This avoids hardcoding every intent family and allows the HUD to follow MANOJOS3 source evolution.

## LLM/OpenCode

The operation matrix is explicit:

- deterministic routing first;
- LiteLLM/OpenCode only when routing is ambiguous, for draft/classification, high-risk plan review, or repeated failure analysis;
- OpenCode does not directly execute material actions or read secrets;
- Policy/Kernel remains decisive.

## Materiality

This projection is source-backed and GitHub-only.

It does **not** prove a LibreChat↔MANOJOS3 live binding, runtime readiness or material action. Those remain separate gaps.
