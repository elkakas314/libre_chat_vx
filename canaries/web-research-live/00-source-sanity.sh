#!/usr/bin/env bash
# Offline self-test: Bash syntax, JSON templates and PASS/FAIL/SKIP helpers.
set -euo pipefail
here="$(cd -- "$(dirname -- "$0")" && pwd)"
end() {
  local rc="$1"
  if ((rc==0)); then echo 'PASS 00-web-research-source-sanity (offline SOURCE)'
  else echo "FAIL 00-web-research-source-sanity (exit=$rc)" >&2; fi
}
trap 'end "$?"' EXIT
command -v jq >/dev/null
for script in "$here"/*.sh; do
  bash -n "$script"
  grep -Eq '^[[:space:]]*set -euo pipefail[[:space:]]*$' "$script"
done
for doc in "$here"/*.json "$here"/expected-outputs/*.json; do
  jq -e 'type=="object"' "$doc" >/dev/null
done
jq -e '.gate_id=="LC-WEB-RESEARCH-LIVE" and .gate_state=="OPEN" and
 .runtime_status=="NO_DEPLOYMENT_EVIDENCE"' "$here/evidence-template.json" >/dev/null
bash -c 'source "$1"; WR_STEP=test; wr_finish 0' bash "$here/lib.sh" |
  grep -qx 'PASS test (SOURCE/LIVE probe only; gate OPEN)'
bash -c 'source "$1"; WR_STEP=test; WR_STATUS=SKIP; WR_REASON=no_host; wr_finish 0' bash "$here/lib.sh" |
  grep -qx 'SKIP test: no_host'
bash -c 'source "$1"; WR_STEP=test; wr_finish 4' bash "$here/lib.sh" 2>&1 |
  grep -qx 'FAIL test (exit=4)'
bash -c 'source "$1"; wr_keenable_url https://api.keenable.ai/v1/search/public v1/search/public' bash "$here/lib.sh"
if bash -c 'source "$1"; wr_keenable_url http://127.0.0.1:8787/v1/search/public v1/search/public' bash "$here/lib.sh" >/dev/null 2>&1; then
  echo 'Unsafe endpoint was accepted' >&2
  exit 1
fi
# No network, provider quota, service credentials or host calls in CI.
echo 'SOURCE syntax/fixtures/return states checked; LIVE gate remains OPEN'
