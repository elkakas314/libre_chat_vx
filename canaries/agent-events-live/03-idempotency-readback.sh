#!/usr/bin/env bash
# Server-side deduplication proof, distinct from deterministic SOURCE keys.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
ae_start "03-idempotency-readback"
ae_proof
jq -e '
 .idempotency.two_deliveries_same_event_key==true and
 .idempotency.idempotency_key=="LIBRECHAT_INTERNAL:test.event-1" and
 .idempotency.server_received_attempts==2 and
 .idempotency.unique_server_effects==1 and
 .idempotency.duplicate_was_suppressed==true and
 (.idempotency.readback_ref|type=="string" and length>8) and
 .idempotency.material_effect_replayed==false
 ' "$AE_PROOF" >/dev/null ||
 ae_fail "No authenticated server-side deduplication readback"
ae_out "03-result.json"
echo 'READ external deduplication observation; SOURCE idempotency keys alone do not prove delivery'
