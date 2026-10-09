#!/usr/bin/env bash
# Native LibreChat fetch content proof; never re-executes chat/generation.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
wr_start "05-canary-fetch"
wr_safe_baseline
proof="${LIBRECHAT_PIPELINE_PROOF_FILE:-}"
[[ -n "$proof" && -f "$proof" && -s "$proof" ]] ||
  wr_skip "No authenticated read-only pipeline fetch evidence; no safe GET tool invocation"
wr_json "$proof"
jq -e '
 .schema=="libre-chat-vx.web-research-pipeline-proof.v1" and
 .authenticated_librechat_readback==true and .pipeline_available==true and
 .scraper=="keenable" and .source=="LIBRECHAT_NATIVE_WEB_SEARCH" and
 .fetch.completed==true and
 (.fetch.url|type=="string" and startswith("https://")) and
 (.fetch.text_length|type=="number" and .>=80) and
 (.fetch.content_sha256|type=="string" and test("^[a-f0-9]{64}$")) and
 (.fetch.readback_ref|type=="string" and length>8) and
 (.observed_at_utc|type=="string") and .config_modified==false
 ' "$proof" >/dev/null ||
  wr_fail "Supplied pipeline scraper proof lacks sufficient content/readback"
when="$(jq -r '.observed_at_utc' "$proof")"; wr_fresh "$when"
jq -n --arg when "$when" '
 {schema:"libre-chat-vx.web-research-pipeline-fetch.v1",
 proof_observed_at_utc:$when,verified_proof_shape:true,
 evidence_independently_authenticated:false,pipeline_invoked_by_canary:false,
 gate_closed:false}' > "$WR_DIR/05-result.json"
chmod 600 -- "$WR_DIR/05-result.json"
echo 'READ existing authenticated pipeline fetch evidence; no new generation'
