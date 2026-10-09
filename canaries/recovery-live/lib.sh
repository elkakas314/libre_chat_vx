#!/usr/bin/env bash
# Helpers comunes: salidas uniformes, pruebas externas privadas y fail-closed.
set -euo pipefail
RC_HOME="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
RC_ROOT="$(cd -- "$RC_HOME/../.." && pwd)"
RC_DIR="${RECOVERY_EVIDENCE_DIR:-${XDG_RUNTIME_DIR:-/tmp}/lc-recovery-$(id -u)}"
RC_STATUS=PASS
RC_REASON=""
rc_finish() {
  local code="$1"
  if (( code != 0 )); then
    printf 'FAIL %s (exit=%d): %s\n' "$RC_STEP" "$code" "${RC_REASON:-check failed}" >&2
  elif [[ "$RC_STATUS" == SKIP ]]; then
    printf 'SKIP %s: %s\n' "$RC_STEP" "$RC_REASON"
  else
    printf 'PASS %s (partial check; LC-RECOVERY-LIVE OPEN)\n' "$RC_STEP"
  fi
}
rc_fail() { RC_REASON="$*"; exit 1; }
rc_skip() { RC_STATUS=SKIP; RC_REASON="$*"; exit 0; }
rc_start() {
  RC_STEP="$1"
  trap 'rc_finish "$?"' EXIT
  umask 077
  for bin in jq date sha256sum; do
    command -v "$bin" >/dev/null 2>&1 || rc_fail "Missing dependency: $bin"
  done
  [[ ! -L "$RC_DIR" ]] || rc_fail 'Evidence directory symlink refused'
  mkdir -p -- "$RC_DIR"
  chmod 700 -- "$RC_DIR"
  [[ -d "$RC_DIR" && -w "$RC_DIR" ]] || rc_fail 'Private evidence directory unavailable'
}
rc_require() { command -v "$1" >/dev/null 2>&1 || rc_skip "Missing $1; no installation attempted"; }
rc_need() { [[ -s "$RC_DIR/$1" ]] || rc_skip "Missing readback $1; no LIVE conclusion"; }
rc_unit() {
  local unit="${RECOVERY_SERVICE_UNIT:-}"
  [[ "$unit" =~ ^librechat(-vx)?(-[a-zA-Z0-9_-]+)?\.service$ ]] ||
    rc_fail 'RECOVERY_SERVICE_UNIT must identify the dedicated LibreChat service; no other unit allowed'
  [[ ! "${unit,,}" =~ manojos|host.control|mcp ]] || rc_fail 'Protected target name refused'
  printf '%s' "$unit"
}
rc_stamp() { date -u +%FT%TZ; }
rc_fresh() {
  local timestamp="$1" now then
  then="$(date -u -d "$timestamp" +%s 2>/dev/null)" || rc_fail 'Invalid observed_at_utc'
  now="$(date -u +%s)"
  (( then <= now && now - then < 900 )) || rc_fail 'Evidence is future-dated or >=15 minutes old'
}
rc_json() { jq -e 'type=="object"' "$1" >/dev/null || rc_fail 'Invalid JSON evidence object'; }
rc_bool_ref() { jq -e "$1" "$2" >/dev/null || rc_fail 'Required authenticated readback fields absent'; }
