#!/usr/bin/env bash
# Native LibreChat pipeline proof. On pinned upstream, chat initiation would
# POST a conversation/inference request; this read-only canary NEVER does so.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
wr_start "04-canary-search-query"
wr_safe_baseline
proof="${LIBRECHAT_PIPELINE_PROOF_FILE:-}"
[[ -n "$proof" && -f "$proof" && -s "$proof" ]] ||
  wr_skip "No authenticated read-only native pipeline output; pinned LibreChat has no safe GET query invocation"
wr_json "$proof"
jq -e '
 .schema=="libre-chat-vx.web-research-pipeline-proof.v1" and
 .authenticated_librechat_readback==true and
 .pipeline_available==true and
 .provider=="keenable" and .scraper=="keenable" and
 .source=="LIBRECHAT_NATIVE_WEB_SEARCH" and
 .search.completed==true and
 (.search.readback_ref|type=="string" and length>8) and
 (.search.results|type=="array" and length>0 and all(.[];
   (.url|type=="string" and startswith("https://")) and
   (.snippet|type=="string" and length>0))) and
 (.observed_at_utc|type=="string") and .config_modified==false
 ' "$proof" >/dev/null ||
  wr_fail "Supplied pipeline search proof missing real URLs/snippets or readback"
when="$(jq -r '.observed_at_utc' "$proof")"; wr_fresh "$when"
jq -n --arg when "$when" '
 {schema:"libre-chat-vx.web-research-pipeline-search.v1",
 proof_observed_at_utc:$when,verified_proof_shape:true,
 evidence_independently_authenticated:false,pipeline_invoked_by_canary:false,
 gate_closed:false}' > "$WR_DIR/04-result.json"
chmod 600 -- "$WR_DIR/04-result.json"
echo 'READ existing authenticated pipeline search evidence; no new generation'
