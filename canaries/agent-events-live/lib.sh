#!/usr/bin/env bash
# Helpers: source-only and validation of privately obtained LIVE readbacks.
set -euo pipefail
AE_HOME="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
AE_ROOT="$(cd -- "$AE_HOME/../.." && pwd)"
AE_DIR="${AGENT_EVENTS_EVIDENCE_DIR:-${XDG_RUNTIME_DIR:-/tmp}/lc-agent-events-$(id -u)}"
AE_STATUS="PASS"
AE_REASON=""
ae_finish() {
  local rc="$1"
  if ((rc!=0)); then
    printf 'FAIL %s (exit=%s)%s\n' "$AE_STEP" "$rc" "${AE_REASON:+ — $AE_REASON}" >&2
  elif [[ "$AE_STATUS" == "SKIP" ]]; then
    printf 'SKIP %s: %s\n' "$AE_STEP" "$AE_REASON"
  else
    printf 'PASS %s (READ_ONLY; LC-AGENT-EVENTS-LIVE remains OPEN)\n' "$AE_STEP"
  fi
}
ae_fail() { AE_REASON="$*"; printf 'DETAIL: %s\n' "$AE_REASON" >&2; exit 1; }
ae_skip() { AE_STATUS=SKIP; AE_REASON="$*"; exit 0; }
ae_start() {
  AE_STEP="$1"; trap 'ae_finish "$?"' EXIT; umask 077
  for bin in jq date sha256sum; do
    command -v "$bin" >/dev/null 2>&1 || ae_fail "Missing dependency: $bin"
  done
  [[ ! -L "$AE_DIR" ]] || ae_fail "Evidence directory symlink refused"
  mkdir -p -- "$AE_DIR"; chmod 700 -- "$AE_DIR"
  [[ -d "$AE_DIR" && -w "$AE_DIR" ]] || ae_fail "Private evidence directory unavailable"
}
ae_proof() {
  AE_PROOF="${AGENT_EVENTS_HOST_PROOF_FILE:-}"
  [[ -n "$AE_PROOF" && -f "$AE_PROOF" && -s "$AE_PROOF" ]] ||
    ae_skip "No authenticated LibreChat inbound receipt/readback supplied; no event POST performed"
  jq -e 'type=="object" and .schema=="libre-chat-vx.agent-events-host-proof.v1" and
    .source=="LIBRECHAT_INTERNAL" and .endpoint=="/api/agents/v1/events" and
    .authenticated_backend_readback==true and .operator_authenticated_evidence==true and
    (.observed_at_utc|type=="string") and
    (.source_readback_ref|type=="string" and length>8) and
    .authority==false' "$AE_PROOF" >/dev/null ||
    ae_fail "Malformed or unauthenticated-declared LibreChat host readback"
  ae_fresh "$(jq -r '.observed_at_utc' "$AE_PROOF")"
}
ae_fresh() {
  local stamp="$1" limit="${AGENT_EVENTS_MAX_AGE_SECONDS:-86400}" seen now
  [[ "$limit" =~ ^[1-9][0-9]*$ ]] || ae_fail "Invalid evidence freshness TTL"
  seen="$(date -u -d "$stamp" +%s 2>/dev/null)" || ae_fail "Unparseable evidence UTC timestamp"
  now="$(date -u +%s)"
  ((seen<=now && now-seen<=limit)) || ae_fail "Evidence future-dated or stale"
}
ae_out() {
  local name="$1"
  jq -n --arg time "$(date -u +%FT%TZ)" --arg step "$AE_STEP" '
  {schema:"libre-chat-vx.agent-events-structural-check.v1",
   checked_at_utc:$time,step:$step,evidence_shape_verified:true,
   evidence_independently_authenticated:false,events_posted_by_canary:false,
   target_material_executed:false,gate_closed:false}' > "$AE_DIR/$name"
  chmod 600 -- "$AE_DIR/$name"
}
