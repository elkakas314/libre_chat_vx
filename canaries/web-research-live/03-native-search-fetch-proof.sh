#!/usr/bin/env bash
# Validate authenticated, operator-collected native Web Search + fetch results.
# No POST/chat generation from this canary (material conversation/inference/quota effects).
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
wr_start "03-native-search-fetch-proof"; wr_need "01-result.json"; wr_need "02-host-config.json"
: "${WEB_RESEARCH_RESULT_PROOF_FILE:?Private native web search/fetch proof required}"
[[ -s "$WEB_RESEARCH_RESULT_PROOF_FILE" ]] || wr_fail "Missing authenticated search/fetch evidence"
wr_obj "$WEB_RESEARCH_RESULT_PROOF_FILE"
jq -e --slurpfile runtime "$WR_DIR/01-result.json" '
 .schema=="libre-chat-vx.web-research-results-proof.v1" and
 .authentic_librechat_ui_capture==true and
 .native_tool_name=="web_search" and
 .search_provider==$runtime[0].search_provider and
 .scraper_provider==$runtime[0].scraper_provider and
 (.observed_at_utc|type=="string") and
 (.user_query_class=="PUBLIC_WEB") and
 (.query_ref|type=="string" and length>8) and
 (.server_conversation_readback_ref|type=="string" and length>8) and
 (.search_tool_run_readback_ref|type=="string" and length>8) and
 (.search_results|type=="array" and length>=2 and
   all(.[];(.title|type=="string" and length>0) and
           (.url|type=="string" and test("^https://[^ /]+/?.*$")) and
           (.readback_ref|type=="string" and length>8))) and
 ([.search_results[].url]|unique|length)>=2 and
 (.fetch_results|type=="array" and length>=1 and all(.[]; . as $f |
   (.url|type=="string" and test("^https://[^ /]+/?.*$")) and
   (.content_sha256|type=="string" and test("^[a-f0-9]{64}$")) and
   (.fetch_readback_ref|type=="string" and length>8) and
   any($root.search_results[]; .url==$f.url))) and
 (.citations|type=="array" and length>=2 and
   all(.[]; . as $c | (.url|type=="string") and
     (.citation_ref|type=="string" and length>8) and
     any($root.search_results[]; .url==$c.url))) and
 .search_completed==true and .fetch_completed==true and
 .browser_interaction_used==false and .target_material_action_used==false
 ' --argjson root "$(cat "$WEB_RESEARCH_RESULT_PROOF_FILE")"  "$WEB_RESEARCH_RESULT_PROOF_FILE" >/dev/null ||
 wr_fail "Search/fetch/citation evidence incomplete or lacks references"
observed="$(jq -r '.observed_at_utc' "$WEB_RESEARCH_RESULT_PROOF_FILE")"; wr_fresh "$observed"
jq -n --arg now "$(date -u +%FT%TZ)" '
 {schema:"libre-chat-vx.web-research-search-validate.v1",validated_at_utc:$now,
 supplied_proof_structurally_valid:true,underlying_live_readback_independently_authenticated:false,
 native_search_executed_by_canary:false,native_fetch_executed_by_canary:false,gate_closed:false}'  > "$WR_DIR/03-result.json"
chmod 600 -- "$WR_DIR/03-result.json"
echo 'CHECKED external native Web Search/fetch/citations proof STRUCTURE; not independently verified LIVE'
