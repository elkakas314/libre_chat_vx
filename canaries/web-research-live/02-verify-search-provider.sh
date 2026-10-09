#!/usr/bin/env bash
# Keenable keyless POST /v1/search/public: a QUERY, never an admin/config POST.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
wr_start "02-verify-search-provider"; wr_require curl; wr_safe_baseline
url="${KEENABLE_API_URL:-https://api.keenable.ai/v1/search/public}"
wr_keenable_url "$url" "v1/search/public"
# The public API has no safeSearch parameter: level 1 is checked in mounted
# LibreChat YAML, never silently misrepresented as a provider-side argument.
[[ "${KEENABLE_API_KEY:-}" == "" ]] ||
  echo 'NOTE optional KEENABLE_API_KEY present but NOT used in keyless baseline' >&2
tmp="$(mktemp "$WR_DIR/.search.XXXXXXXX")"
if ! code="$(curl --proto '=https' --tlsv1.2 --silent --show-error \
  --connect-timeout 8 --max-time 20 --max-redirs 0 \
  --request POST --header 'Content-Type: application/json' \
  --header 'X-Keenable-Title: LibreChat-VX-Canary' \
  --data '{"query":"test"}' --output "$tmp" --write-out '%{http_code}' "$url")"; then
  rm -f -- "$tmp"; wr_fail "Keenable keyless search transport failed"
fi
wr_code "$tmp" "$code"
jq -e '.results|type=="array" and length>0 and any(.[];
  (.url|type=="string" and startswith("https://")) and
  (.title|type=="string" and length>0) and
  ((.snippet//.description//"")|type=="string" and length>0))' "$tmp" >/dev/null ||
  wr_fail "HTTP 200 but Keenable results lack HTTPS URLs/titles/snippets"
count="$(jq '.results|length' "$tmp")"
jq -n --argjson count "$count" --arg time "$(date -u +%FT%TZ)" '
 {schema:"libre-chat-vx.web-research-keenable-search.v1",
 provider:"keenable",endpoint:"/v1/search/public",http_code:200,query:"test",
 safe_search_yaml:1,provider_parameter_safe_search_verified:false,
 keyless:true,result_count:$count,observed_at_utc:$time,
 config_mutated:false,gate_closed:false}' > "$WR_DIR/02-result.json"
chmod 600 -- "$WR_DIR/02-result.json"
# Retain public response readback privately for manual corroboration.
mv -- "$tmp" "$WR_DIR/02-search-response.PRIVATE.json"
chmod 600 -- "$WR_DIR/02-search-response.PRIVATE.json"
echo "READ Keenable keyless search: HTTP 200, $count results; no config mutation"
