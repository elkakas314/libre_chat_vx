#!/usr/bin/env bash
# Common fail-closed helpers. No network call occurs on source.
set -euo pipefail
WR_HOME="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
WR_ROOT="$(cd -- "$WR_HOME/../.." && pwd)"
WR_DIR="${WEB_RESEARCH_EVIDENCE_DIR:-${XDG_RUNTIME_DIR:-/tmp}/lc-web-research-$(id -u)}"
WR_STATUS="PASS"
WR_REASON=""
wr_finish() {
  local rc="$1"
  if ((rc!=0)); then
    printf 'FAIL %s (exit=%s)%s\n' "$WR_STEP" "$rc" "${WR_REASON:+ — $WR_REASON}" >&2
  elif [[ "$WR_STATUS" == "SKIP" ]]; then
    printf 'SKIP %s: %s\n' "$WR_STEP" "$WR_REASON"
  else
    printf 'PASS %s (SOURCE/LIVE probe only; gate OPEN)\n' "$WR_STEP"
  fi
}
wr_fail() { WR_REASON="$*"; printf 'DETAIL: %s\n' "$WR_REASON" >&2; exit 1; }
wr_skip() { WR_STATUS=SKIP; WR_REASON="$*"; exit 0; }
wr_start() {
  WR_STEP="$1"
  trap 'wr_finish "$?"' EXIT
  umask 077
  for bin in bash jq date sha256sum; do
    command -v "$bin" >/dev/null 2>&1 || wr_fail "Missing dependency: $bin"
  done
  [[ ! -L "$WR_DIR" ]] || wr_fail "Evidence directory is a symlink"
  mkdir -p -- "$WR_DIR"; chmod 700 -- "$WR_DIR"
  [[ -d "$WR_DIR" && -w "$WR_DIR" ]] || wr_fail "Private evidence directory unavailable"
}
wr_require() { command -v "$1" >/dev/null 2>&1 || wr_skip "Missing dependency $1; nothing installed"; }
wr_need() { [[ -s "$WR_DIR/$1" ]] || wr_skip "Previous readback $1 absent; host/pipeline not verified"; }
wr_json() { jq -e 'type=="object"' "$1" >/dev/null 2>&1 || wr_fail "Invalid JSON object"; }
wr_keenable_url() {
  local url="$1" suffix="$2"
  # Explicit origin+path allowlist: never send requests or secrets to arbitrary URLs.
  [[ "$url" == "https://api.keenable.ai/$suffix" ]] ||
    wr_fail "Keenable endpoint override outside allowlisted public route"
}
wr_safe_baseline() {
  wr_need "01-result.json"
  jq -e '.searchProvider=="keenable" and .scraperProvider=="keenable" and
    .rerankerType=="none" and .safeSearch==1' "$WR_DIR/01-result.json" >/dev/null ||
    wr_fail "Host YAML does not match the required Keenable/safeSearch baseline"
}
wr_code() {
  local tmp="$1" code="$2"
  if [[ "$code" == 200 ]]; then
    wr_json "$tmp"
    return 0
  fi
  if [[ -z "${KEENABLE_API_KEY:-}" && ( "$code" == 401 || "$code" == 403 || "$code" == 429 ) ]]; then
    wr_skip "Keenable HTTP $code without key; keyless is supported but this request was NOT verified"
  fi
  wr_fail "Keenable HTTP $code; expected 200 with parseable response"
}
wr_fresh() {
  local timestamp="$1" limit="${WEB_RESEARCH_MAX_AGE_SECONDS:-86400}" now then
  [[ "$limit" =~ ^[1-9][0-9]*$ ]] || wr_fail "Invalid freshness TTL"
  then="$(date -u -d "$timestamp" +%s 2>/dev/null)" || wr_fail "Invalid observation timestamp"
  now="$(date -u +%s)"
  ((then<=now && now-then<=limit)) || wr_fail "Observation is stale or future-dated"
}
