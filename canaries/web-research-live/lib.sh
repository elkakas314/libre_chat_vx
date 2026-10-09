#!/usr/bin/env bash
# LC-WEB-RESEARCH-LIVE: authenticated GET and private evidence validation only.
set -euo pipefail
WR_HOME="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
WR_ROOT="$(cd -- "$WR_HOME/../.." && pwd)"
WR_DIR="${WEB_RESEARCH_EVIDENCE_DIR:-${XDG_RUNTIME_DIR:-/tmp}/lc-web-research-$(id -u)}"
WR_BASE=""
wr_finish() {
  local rc="$1"
  if (( rc == 0 )); then printf 'PASS %s (READ_ONLY; gate OPEN)\n' "$WR_STEP"
  else printf 'FAIL %s (exit=%s)\n' "$WR_STEP" "$rc" >&2; fi
}
wr_fail() { printf 'DETAIL: %s\n' "$*" >&2; exit 1; }
wr_start() {
  WR_STEP="$1"; trap 'wr_finish "$?"' EXIT; umask 077
  for bin in bash jq date sha256sum mktemp; do
    command -v "$bin" >/dev/null 2>&1 || wr_fail "Missing dependency: $bin"
  done
  [[ ! -L "$WR_DIR" ]] || wr_fail "Evidence directory is a symlink"
  mkdir -p -- "$WR_DIR"; chmod 700 -- "$WR_DIR"
  [[ -d "$WR_DIR" && -w "$WR_DIR" ]] || wr_fail "Private evidence directory unavailable"
}
wr_need() { [[ -s "$WR_DIR/$1" ]] || wr_fail "Missing prerequisite evidence: $1"; }
wr_require() { command -v "$1" >/dev/null 2>&1 || wr_fail "Missing dependency: $1"; }
wr_origin() {
  [[ "$1" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]] || wr_fail "Only an HTTPS origin without path/query is allowed"
}
wr_base() {
  : "${LIBRECHAT_BASE_URL:?LIBRECHAT_BASE_URL required}"
  wr_origin "$LIBRECHAT_BASE_URL"; WR_BASE="$LIBRECHAT_BASE_URL"
}
wr_get() {
  local endpoint="$1" output="$2" tmp code
  [[ "$endpoint" == "/api/user" || "$endpoint" == "/api/config" ]] ||
    wr_fail "GET endpoint not on allowlist"
  : "${LIBRECHAT_READ_TOKEN:?LIBRECHAT_READ_TOKEN required}"
  wr_require curl
  tmp="$(mktemp "$WR_DIR/.read.XXXXXXXX")"
  if ! code="$(curl --proto '=https' --tlsv1.2 --silent --show-error --max-time 25 \
    --max-redirs 0 --request GET --header "Authorization: Bearer $LIBRECHAT_READ_TOKEN" \
    --header 'Accept: application/json' --output "$tmp" \
    --write-out '%{http_code}' "$WR_BASE$endpoint")"; then
    rm -f -- "$tmp"; wr_fail "Authenticated LibreChat GET transport failed"
  fi
  if [[ "$code" != 200 ]] || ! jq -e 'type=="object"' "$tmp" >/dev/null 2>&1; then
    rm -f -- "$tmp"; wr_fail "Authenticated LibreChat GET returned HTTP=$code or invalid JSON"
  fi
  jq -e '.' "$tmp" > "$output"; rm -f -- "$tmp"; chmod 600 -- "$output"
}
wr_fresh() {
  local iso="$1" max="${WEB_RESEARCH_MAX_AGE_SECONDS:-86400}" then now
  [[ "$max" =~ ^[1-9][0-9]*$ ]] || wr_fail "Invalid freshness TTL"
  then="$(date -u -d "$iso" +%s 2>/dev/null)" || wr_fail "Unparseable evidence timestamp"
  now="$(date -u +%s)"
  ((then<=now && now-then<=max)) || wr_fail "Evidence stale or dated in future"
}
wr_obj() { jq -e 'type=="object"' "$1" >/dev/null || wr_fail "Invalid JSON object"; }
