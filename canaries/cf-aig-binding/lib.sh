#!/usr/bin/env bash
# Library for LC-CF-AIG-BINDING: read-only Cloudflare API helpers.
set -euo pipefail
CF_AIG_HOME="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CF_AIG_API="https://api.cloudflare.com/client/v4"
CF_AIG_ROUTES=(rapido normal pensar investigar visualizar contexto-largo vision)
CF_AIG_EVIDENCE_DIR="${CF_AIG_EVIDENCE_DIR:-${XDG_RUNTIME_DIR:-/tmp}/lc-cf-aig-canary-$(id -u)}"
cf_finish() {
  local code="$1"
  if (( code == 0 )); then printf 'PASS %s\n' "$CF_AIG_STEP"
  else printf 'FAIL %s (exit=%s)\n' "$CF_AIG_STEP" "$code" >&2; fi
}
cf_start() {
  CF_AIG_STEP="$1"
  trap 'cf_finish "$?"' EXIT
  umask 077
  for bin in curl jq date; do
    if ! command -v "$bin" >/dev/null 2>&1; then
      printf 'Missing dependency: %s\n' "$bin" >&2
      exit 1
    fi
  done
  : "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID required}"
  : "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN required}"
  : "${CLOUDFLARE_AI_GATEWAY_ID:?CLOUDFLARE_AI_GATEWAY_ID required}"
  [[ "$CLOUDFLARE_ACCOUNT_ID" =~ ^[a-fA-F0-9]{32}$ ]] || { echo 'Invalid account ID shape' >&2; exit 1; }
  [[ "$CLOUDFLARE_AI_GATEWAY_ID" =~ ^[a-zA-Z0-9_-]+$ ]] || { echo 'Invalid gateway ID shape' >&2; exit 1; }
  mkdir -p -- "$CF_AIG_EVIDENCE_DIR"
  chmod 700 -- "$CF_AIG_EVIDENCE_DIR"
  CF_AIG_BASE="$CF_AIG_API/accounts/$CLOUDFLARE_ACCOUNT_ID"
  CF_AIG_GATEWAY="$CF_AIG_BASE/ai-gateway/gateways/$CLOUDFLARE_AI_GATEWAY_ID"
}
cf_fail() { printf '%s\n' "$*" >&2; exit 1; }
cf_get() {
  local url="$1" dest="$2" temp code
  temp="$(mktemp "$CF_AIG_EVIDENCE_DIR/.response.XXXXXXXX")"
  if ! code="$(curl --proto '=https' --tlsv1.2 --silent --show-error --max-time 45 --request GET \
     --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     --output "$temp" --write-out '%{http_code}' "$url")"; then
    rm -f -- "$temp"; cf_fail "Transport failure on authenticated GET"
  fi
  if [[ "$code" != 200 ]] || ! jq -e '.success == true' "$temp" >/dev/null 2>&1; then
    rm -f -- "$temp"; cf_fail "Cloudflare GET failed (HTTP=$code or success!=true)"
  fi
  mv -- "$temp" "$dest"
  chmod 600 -- "$dest"
}
cf_check_file() {
  [[ -f "$CF_AIG_EVIDENCE_DIR/$1" ]] || cf_fail "Missing prerequisite evidence: $1"
}
cf_route_id() {
  jq -r --arg n "nostromo-$1" '[.data.routes[] | select(.name == $n)] | if length == 1 then .[0].id else empty end' \
    "$CF_AIG_EVIDENCE_DIR/01-routes.json"
}
