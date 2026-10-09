#!/usr/bin/env bash
# Validate private event-severity/notification readbacks; no push or approvals sent.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
ae_start "04-triage-notifications"
ae_proof
jq -e '
 .triage.severity=="ATTENTION" and
 .triage.provenance_source=="LIBRECHAT_INTERNAL" and
 .triage.attention_classified==true and
 .triage.notification_opaque_reference_only==true and
 .triage.notification_authorizes_nothing==true and
 .triage.fresh_authenticated_fetch_on_open==true and
 (.triage.event_readback_ref|type=="string" and length>8) and
 (.triage.notification_readback_ref|type=="string" and length>8) and
 .triage.secrets_in_notification==false
 ' "$AE_PROOF" >/dev/null ||
 ae_fail "Event triage/mobile notification lacks authenticated readback fields"
ae_out "04-result.json"
echo 'READ triage/opaque push evidence STRUCTURE; no notification or material request sent'
