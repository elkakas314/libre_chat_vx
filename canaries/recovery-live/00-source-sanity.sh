#!/usr/bin/env bash
# Offline CI: no systemctl, Tailscale, SSH or network calls.
set -euo pipefail
here="$(cd -- "$(dirname -- "$0")" && pwd)"
finish() {
  if (( "$1" == 0 )); then echo 'PASS 00-recovery-source-sanity (offline SOURCE)'
  else echo 'FAIL 00-recovery-source-sanity' >&2; fi
}
trap 'finish "$?"' EXIT
command -v jq >/dev/null
for sh in "$here"/*.sh; do
  bash -n "$sh"
  grep -Eq '^[[:space:]]*set -euo pipefail[[:space:]]*$' "$sh"
done
for doc in "$here"/*.json "$here"/expected-outputs/*.json; do
  jq -e 'type=="object"' "$doc" >/dev/null
done
jq -e '.gate_id=="LC-RECOVERY-LIVE" and .gate_state=="OPEN" and
        .runtime_status=="NO_DEPLOYMENT_EVIDENCE" and .gate_closed==false' \
  "$here/evidence-template.json" >/dev/null
jq -e '.despliegue.procedimientos|type=="array" and length>0' "$here/../../SPEC.json" >/dev/null
jq -e '.backlog.active_live|any(.[]; .id=="LC-RECOVERY-LIVE" and .estado_gate=="OPEN")' \
  "$here/../../SPEC.json" >/dev/null
bash -c 'source "$1"; RC_STEP=test; rc_finish 0' bash "$here/lib.sh" |
  grep -qx 'PASS test (partial check; LC-RECOVERY-LIVE OPEN)'
bash -c 'source "$1"; RC_STEP=test; RC_STATUS=SKIP; RC_REASON=no_host; rc_finish 0' bash "$here/lib.sh" |
  grep -qx 'SKIP test: no_host'
bash -c 'source "$1"; RC_STEP=test; RC_REASON=bad; rc_finish 3' bash "$here/lib.sh" 2>&1 |
  grep -qx 'FAIL test (exit=3): bad'
# Ensure script 03 is opt-in and does not use unbounded retry loops.
grep -q 'RECOVERY_CANARY_ALLOW_RESTART' "$here/03-canary-service-restart.sh"
[[ "$(grep -El '^[[:space:]]*if ! systemctl.*restart --' "$here"/[0-9][0-9]-*.sh | wc -l)" -eq 1 ]]
echo 'SOURCE syntax, fixtures, opt-in, PASS/FAIL/SKIP validated; NO host effect'
