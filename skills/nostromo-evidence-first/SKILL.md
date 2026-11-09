---
name: nostromo-evidence-first
description: Use when reading status, runs, receipts, errors, completion claims, target health, or any question where LibreChat must distinguish observed evidence from inference.
---

# Nostromo Evidence First

1. Prefer fresh target readback over source, documentation, memory or model inference.
2. Never equate HTTP success, UI animation, tool submission or model text with completed work.
3. Keep these states separate:
   - CONNECTION
   - READINESS
   - WORK
   - EVIDENCE
4. A completion claim requires the evidence appropriate to the target.
5. Preserve provenance, freshness, revision/hash and target identity when available.
6. If an effect may have happened before a timeout, mark UNKNOWN_OUTCOME and read back before retry.
7. Never mint authorization, PASS, receipt, verifier output or evidence inside LibreChat.
8. Cross-target comparisons preserve each target's independent truth and do not merge receipts.
