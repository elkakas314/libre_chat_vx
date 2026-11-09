#!/usr/bin/env bash
# Read-only: evidence younger than 15 min, external OOB SSH and dedupe proof.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
rc_start '04-evidence-freshness'
rc_require python3
# Missing input means SKIP; OLD input is always FAIL.
for name in 01-result.json 02-result.json 03-result.json; do
  rc_need "$name"
  rc_json "$RC_DIR/$name"
  rc_fresh "$(jq -r '.observed_at_utc' "$RC_DIR/$name")"
done
rc_fresh "$(jq -r '.policy_captured_at_utc' "$RC_DIR/02-result.json")"
proof="${RECOVERY_OOB_PROOF_FILE:-}"
[[ -n "$proof" && -s "$proof" && -r "$proof" && -f "$proof" && ! -L "$proof" ]] ||
  rc_skip 'External SSH-during-downtime and job readback not supplied'
rc_json "$proof"
rc_fresh "$(jq -r '.observed_at_utc' "$proof")"
rc_fresh "$(jq -r '.ssh_observed_at_utc' "$proof")"
rc_fresh "$(jq -r '.librechat_down_observed_at_utc' "$proof")"
# Require timestamps inside actual documented restart window; readback alone
# is not independently authenticated by this script.
python3 - "$RC_DIR/03-result.json" "$proof" <<'PY' ||
  rc_fail 'OOB observations are outside the controlled restart window'
import datetime
import json
import sys
with open(sys.argv[1], encoding='utf-8') as f:
    restart = json.load(f)
with open(sys.argv[2], encoding='utf-8') as f:
    proof = json.load(f)
def ts(value):
    return datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))
start = ts(restart['restart_started_at_utc'])
end = ts(restart['restart_completed_at_utc'])
a = ts(proof['ssh_observed_at_utc'])
b = ts(proof['librechat_down_observed_at_utc'])
assert start <= a <= end and start <= b <= end
assert abs((a - b).total_seconds()) <= 3
PY
jq -e --slurpfile restart "$RC_DIR/03-result.json" '
 .schema=="libre-chat-vx.recovery-proof.v1" and
 .external_operator_authentication_asserted==true and
 .independent_client==true and
 .librechat_down_observed==true and
 .tailscale_ssh_authenticated_while_librechat_down==true and
 .ssh_separate_from_librechat_service==true and
 .service_recovers_after_restart==true and
 .no_duplicate_jobs_verified_by_target_readback==true and
 (.ssh_readback_ref|type=="string" and length>8) and
 (.service_down_readback_ref|type=="string" and length>8) and
 (.job_idempotence_readback_ref|type=="string" and length>8) and
 (.observed_at_utc|type=="string") and
 (.ssh_observed_at_utc|type=="string") and
 (.librechat_down_observed_at_utc|type=="string") and
 $restart[0].restart_calls==1 and
 $restart[0].service_active_after==true
' "$proof" >/dev/null || rc_fail 'External SSH/service/job evidence fields incomplete'
jq -n --arg at "$(rc_stamp)" '{schema:"libre-chat-vx.recovery-validation.v1",
  observed_at_utc:$at,evidence_shape_verified:true,
  proof_origin_independently_verified:false,
  external_ssh_during_downtime_asserted:true,
  no_duplicate_jobs_asserted:true,gate_closed:false}' > "$RC_DIR/04-result.json"
chmod 600 -- "$RC_DIR/04-result.json"
echo 'READ evidence freshness (<15m), OOB SSH and job-replay proof structure; gate OPEN'
