#!/usr/bin/env bash
# Authenticated LibreChat GET: proves runtime advertises configured providers.
# Does NOT perform a search or scrape.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
wr_start "01-authenticated-config"; wr_base
wr_get "/api/user" "$WR_DIR/01-user-full.PRIVATE.json"
wr_get "/api/config" "$WR_DIR/01-config-full.PRIVATE.json"
jq -e '(._id//.id|type=="string" and length>0) and (.role|type=="string" and length>0)'  "$WR_DIR/01-user-full.PRIVATE.json" >/dev/null || wr_fail "Authenticated LibreChat user identity not established"
jq -e '.webSearch.searchProvider=="keenable" and .webSearch.scraperProvider=="keenable" and
 .webSearch.rerankerType=="none"' "$WR_DIR/01-config-full.PRIVATE.json" >/dev/null ||
 wr_fail "Authenticated runtime webSearch providers differ from SOURCE"
jq -n --slurpfile config "$WR_DIR/01-config-full.PRIVATE.json"  --arg now "$(date -u +%FT%TZ)" '
 {schema:"libre-chat-vx.web-research-runtime-config.v1",
 search_provider:$config[0].webSearch.searchProvider,
 scraper_provider:$config[0].webSearch.scraperProvider,
 reranker_type:$config[0].webSearch.rerankerType,
 user_authenticated:true,role_present:true,web_search_acl_verified:false,
 native_search_performed:false,native_fetch_performed:false,
 observed_at_utc:$now,gate_closed:false}' > "$WR_DIR/01-result.json"
chmod 600 -- "$WR_DIR/01-result.json"
# Prevent residual user identity, app config or credentials in evidence outputs.
rm -f -- "$WR_DIR/01-user-full.PRIVATE.json" "$WR_DIR/01-config-full.PRIVATE.json"
echo 'READ authenticated LibreChat webSearch config and session; no search/POST'
