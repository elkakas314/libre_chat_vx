# LibreChat VX alignment with MANOJOS3 — CURRENT

## Source

MANOJOS3 remote source inspected: `cb772cca141f7ae5ae03af9655b3c5186f5826f6`.

## Alignment rule

LibreChat aligns with MANOJOS3 by semantic layers, not by mirroring its raw registry.

```text
OBJECTIVE
→ DOMAIN
→ INTENT FAMILY
→ INTERFLOW
→ OPERATION
→ POLICY/KERNEL
→ DRIVER CAPABILITIES
→ VERIFIER/RECEIPT
```

### Current semantic surface

- 31 semantic domains.
- 14 classic router domains.
- 12 domains marked EXTEND_ROUTER.
- 4 standalone/no-route domains.
- 1 composite semantic delegation domain.
- 6 operation gateways.
- 252 rows in the current capability execution matrix, of which 189 are AVAILABLE and 63 UNCONFIGURED.

The execution matrix is not a functional parity proof and reports zero functional effects established by that matrix.

## LibreChat behaviour

Nostromo/Tentáculo shows Interflow/domain lenses first.

Raw capabilities are drill-down details used for:

- driver provenance;
- risk/effect display;
- live capability checks;
- readback/evidence linkage.

The UI must never treat a capability count as the set of user actions.

## Authority

MANOJOS3 remains:

`Intent/Interflow → Governor/Policy → Kernel → adapter/driver → readback → Verifier/Receipt`

LibreChat remains authority=false.
