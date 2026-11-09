#!/usr/bin/env bash
# Validation only. Sending an Agent Event POST could create a job; prohibited.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
ae_start "02-read-inbound-evidence"
ae_proof
jq -e '
 .inbound.server_receipt_observed==true and
 (.inbound.server_receipt_ref|type=="string" and length>8) and
 .inbound.librechat_session_authenticated==true and
 .inbound.event_payload_sanitized==true and
 .inbound.authority_transferred==false and
 .inbound.material_effect_observed==false and
 .inbound.webhook_posted_by_canary==false
 ' "$AE_PROOF" >/dev/null ||
 ae_fail "LibreChat inbound receipt/auth/sanitization proof missing"
ae_out "02-result.json"
echo 'READ structured LibreChat inbound receipt evidence; no synthetic HTTP event'
