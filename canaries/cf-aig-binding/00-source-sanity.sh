#!/usr/bin/env bash
# Purely offline self-test for the existing Cloudflare canary library and fixtures.
set -euo pipefail
here="$(cd -- "$(dirname -- "$0")" && pwd)"
finish() {
  local rc="$1"
  if (( rc == 0 )); then echo 'PASS 00-cf-aig-source-sanity (offline SOURCE only)'
  else echo "FAIL 00-cf-aig-source-sanity (exit=$rc)" >&2; fi
}
trap 'finish "$?"' EXIT
command -v jq >/dev/null 2>&1
for script in "$here"/*.sh; do
  bash -n "$script"
  grep -Eq '^[[:space:]]*set -euo pipefail[[:space:]]*$' "$script"
done
for fixture in "$here"/*.json "$here"/expected-outputs/*.json; do
  jq -e 'type == "object"' "$fixture" >/dev/null
done
grep -qF '"gate_state": "OPEN"' "$here/evidence-template.json"
grep -qF '"runtime_status": "NO_DEPLOYMENT_EVIDENCE"' "$here/evidence-template.json"
pass="$(bash -c 'source "$1"; CF_AIG_STEP=selftest; cf_finish 0' bash "$here/lib.sh")"
[[ "$pass" == "PASS selftest" ]]
fail="$(bash -c 'source "$1"; CF_AIG_STEP=selftest; cf_finish 7' bash "$here/lib.sh" 2>&1)"
[[ "$fail" == 'FAIL selftest (exit=7)' ]]
# This file uses no curl or network; no host/cloud credentials needed.
