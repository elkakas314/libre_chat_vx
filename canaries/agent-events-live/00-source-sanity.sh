#!/usr/bin/env bash
# Executes offline, no host/network/deployment credentials.
set -euo pipefail
here="$(cd -- "$(dirname -- "$0")" && pwd)"
end() {
  local rc="$1"
  if ((rc==0)); then echo 'PASS 00-agent-events-source-sanity (SOURCE only)'
  else echo "FAIL 00-agent-events-source-sanity (exit=$rc)" >&2; fi
}
trap 'end "$?"' EXIT
command -v jq >/dev/null
for sh in "$here"/*.sh; do
  bash -n "$sh"
  grep -Eq '^[[:space:]]*set -euo pipefail[[:space:]]*$' "$sh"
done
for jf in "$here"/*.json "$here"/expected-outputs/*.json; do
  jq -e 'type=="object"' "$jf" >/dev/null
done
jq -e '.gate_id=="LC-AGENT-EVENTS-LIVE" and .gate_state=="OPEN" and
  .runtime_status=="NO_DEPLOYMENT_EVIDENCE" and .m3_dependency.gap_id=="LC-M3-GAP-001" and
  .m3_dependency.state=="BLOCKED"' "$here/evidence-template.json" >/dev/null
jq -e '.inbound.endpoint=="/api/agents/v1/events" and .inbound.idempotency_required==true and
 .inbound.credentials_in_payload_forbidden==true and .authority==false' "$here/../../config/agent_events.current.json" >/dev/null
jq -e '.backlog.deferred_external|any(.[];
 type=="object" and .id=="LC-M3-GAP-001" and .estado=="BLOQUEADO" and
 (.bloquea|index("LC-AGENT-EVENTS-LIVE")))' "$here/../../SPEC.json" >/dev/null
bash -c 'source "$1"; AE_STEP=test; ae_finish 0' bash "$here/lib.sh" |
  grep -qx 'PASS test (READ_ONLY; LC-AGENT-EVENTS-LIVE remains OPEN)'
bash -c 'source "$1"; AE_STEP=test; AE_STATUS=SKIP; AE_REASON=m3_blocked; ae_finish 0' bash "$here/lib.sh" |
  grep -qx 'SKIP test: m3_blocked'
bash -c 'source "$1"; AE_STEP=test; ae_finish 7' bash "$here/lib.sh" 2>&1 |
  grep -qx 'FAIL test (exit=7)'
echo 'SOURCE event schema, blocker and PASS/FAIL/SKIP validated; no LIVE claims'
