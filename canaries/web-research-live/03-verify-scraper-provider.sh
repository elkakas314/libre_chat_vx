#!/usr/bin/env bash
# Keenable public GET fetch for stable public URL. No host config modification.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
wr_start "03-verify-scraper-provider"; wr_require curl; wr_safe_baseline
url="${KEENABLE_FETCH_URL:-https://api.keenable.ai/v1/fetch/public}"
wr_keenable_url "$url" "v1/fetch/public"
[[ "${KEENABLE_API_KEY:-}" == "" ]] ||
  echo 'NOTE optional KEENABLE_API_KEY present but NOT used in keyless baseline' >&2
tmp="$(mktemp "$WR_DIR/.fetch.XXXXXXXX")"
if ! code="$(curl --proto '=https' --tlsv1.2 --silent --show-error \
  --connect-timeout 8 --max-time 20 --max-redirs 0 \
  --get --header 'X-Keenable-Title: LibreChat-VX-Canary' \
  --data-urlencode 'url=https://example.com/' --data-urlencode 'live=true' \
  --output "$tmp" --write-out '%{http_code}' "$url")"; then
  rm -f -- "$tmp"; wr_fail "Keenable keyless fetch transport failed"
fi
wr_code "$tmp" "$code"
jq -e '(.url|type=="string" and startswith("https://")) and
  (.content|type=="string" and length>=40)' "$tmp" >/dev/null ||
  wr_fail "HTTP 200 but Keenable scraper returned no substantial text content"
chars="$(jq -r '.content|length' "$tmp")"
sha="$(jq -rj '.content' "$tmp" | sha256sum | cut -d ' ' -f1)"
jq -n --argjson chars "$chars" --arg sha "$sha" --arg when "$(date -u +%FT%TZ)" '
 {schema:"libre-chat-vx.web-research-keenable-fetch.v1",provider:"keenable",
 endpoint:"/v1/fetch/public",url:"https://example.com/",http_code:200,
 content_type:"text/markdown",content_chars:$chars,content_sha256:$sha,
 keyless:true,observed_at_utc:$when,config_mutated:false,gate_closed:false}' > "$WR_DIR/03-result.json"
chmod 600 -- "$WR_DIR/03-result.json"
mv -- "$tmp" "$WR_DIR/03-fetch-response.PRIVATE.json"
chmod 600 -- "$WR_DIR/03-fetch-response.PRIVATE.json"
echo "READ Keenable keyless fetch: HTTP 200, $chars text chars; no config mutation"
