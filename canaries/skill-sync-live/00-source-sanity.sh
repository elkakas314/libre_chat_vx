#!/usr/bin/env bash
# Purely offline self-test for the existing Skill Sync canary library and fixtures.
set -euo pipefail
here="$(cd -- "$(dirname -- "$0")" && pwd)"
finish() {
  local rc="$1"
  if (( rc == 0 )); then echo 'PASS 00-skill-sync-source-sanity (offline SOURCE only)'
  else echo "FAIL 00-skill-sync-source-sanity (exit=$rc)" >&2; fi
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
pass="$(bash -c 'source "$1"; SS_STEP=selftest; ss_finish 0' bash "$here/lib.sh")"
[[ "$pass" == 'PASS selftest (READ_ONLY; gate OPEN)' ]]
fail="$(bash -c 'source "$1"; SS_STEP=selftest; ss_finish 7' bash "$here/lib.sh" 2>&1)"
[[ "$fail" == 'FAIL selftest (exit=7)' ]]
bash -c 'source "$1"; ss_sha 0000000000000000000000000000000000000000' bash "$here/lib.sh"
if bash -c 'source "$1"; ss_sha invalid' bash "$here/lib.sh" >/dev/null 2>&1; then
  echo 'Invalid git hash unexpectedly accepted' >&2
  exit 1
fi
# Assert no explicitly mutating HTTP method in Skill Sync probe scripts.
if grep -Eq -- '--request[[:space:]]+(POST|PUT|PATCH|DELETE)' "$here"/*.sh; then
  echo 'A Skill Sync canary script declares a mutating HTTP method' >&2
  exit 1
fi
# No curl is invoked by this self-test; no host, tokens or network calls.
