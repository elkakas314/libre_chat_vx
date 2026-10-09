#!/usr/bin/env bash
# LC-TAILSCALE-MOBILE-LIVE: helpers for read-only host/client probes.
set -euo pipefail
TM_HOME="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TM_DIR="${TAILSCALE_CANARY_EVIDENCE_DIR:-${XDG_RUNTIME_DIR:-/tmp}/lc-tailscale-mobile-$(id -u)}"
tm_finish() {
  local rc="$1"
  if (( rc == 0 )); then printf 'PASS %s (READ_ONLY; LIVE gate OPEN)\n' "$TM_STEP"
  else printf 'FAIL %s (exit=%s)\n' "$TM_STEP" "$rc" >&2; fi
}
tm_fail() { printf 'DETAIL: %s\n' "$1" >&2; exit 1; }
tm_start() {
  TM_STEP="$1"; trap 'tm_finish "$?"' EXIT; umask 077
  for bin in jq date sha256sum; do command -v "$bin" >/dev/null 2>&1 || tm_fail "Missing dependency: $bin"; done
  [[ ! -L "$TM_DIR" ]] || tm_fail "Evidence directory symlink rejected"
  mkdir -p -- "$TM_DIR"; chmod 700 -- "$TM_DIR"
  [[ -d "$TM_DIR" && -w "$TM_DIR" ]] || tm_fail "Evidence directory unavailable"
}
tm_need() { [[ -s "$TM_DIR/$1" ]] || tm_fail "Missing private prerequisite: $1"; }
tm_require() { command -v "$1" >/dev/null 2>&1 || tm_fail "Missing dependency: $1"; }
tm_https() {
  [[ "$1" =~ ^https://[a-z0-9-]+(\.[a-z0-9-]+)+\.ts\.net(:443)?$ ]] ||
    tm_fail "Must use exact HTTPS MagicDNS origin under ts.net, no path or query"
}
tm_json() { jq -e 'type=="object"' "$1" >/dev/null 2>&1 || tm_fail "Invalid JSON object: $1"; }
tm_fresh() {
  local value="$1" limit="${TAILSCALE_CANARY_MAX_AGE_SECONDS:-86400}" epoch now
  [[ "$limit" =~ ^[1-9][0-9]*$ ]] || tm_fail "Invalid max age"
  epoch="$(date -u -d "$value" +%s 2>/dev/null)" || tm_fail "Unparseable UTC timestamp"
  now="$(date -u +%s)"
  ((epoch<=now && now-epoch<=limit)) || tm_fail "Stale or future-dated observation"
}
tm_sha256() { [[ "$1" =~ ^[0-9a-f]{64}$ ]] || tm_fail "Expected lowercase SHA256"; }
tm_capture() {
  local dest="$1"; shift
  local temp
  temp="$(mktemp "$TM_DIR/.read.XXXXXXXX")"
  if ! "$@" > "$temp"; then rm -f -- "$temp"; tm_fail "Read-only command failed"; fi
  mv -- "$temp" "$dest"; chmod 600 -- "$dest"
  tm_json "$dest"
}
tm_curl_code() {
  local dest="$1" url="$2"; shift 2
  local temp code
  tm_require curl
  temp="$(mktemp "$TM_DIR/.curl.XXXXXXXX")"
  code="$(curl --proto '=https' --tlsv1.2 --noproxy '*' --silent --show-error \
    --connect-timeout 8 --max-time 20 --output "$temp" --write-out '%{http_code}' \
    --request GET "$@" "$url")" || { rm -f -- "$temp"; tm_fail "HTTPS GET failed"; }
  mv -- "$temp" "$dest"; chmod 600 -- "$dest"
  printf '%s\n' "$code"
}
