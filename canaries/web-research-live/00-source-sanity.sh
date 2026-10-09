#!/usr/bin/env bash
# Entirely offline; no host, provider network, API tokens, or web queries.
set -euo pipefail
here="$(cd -- "$(dirname -- "$0")" && pwd)"
end() { local rc="$1"; if ((rc==0)); then echo 'PASS 00-web-research-source-sanity (SOURCE only)'; else echo "FAIL 00-web-research-source-sanity (exit=$rc)" >&2; fi; }
trap 'end "$?"' EXIT
command -v jq >/dev/null 2>&1
for sh in "$here"/*.sh; do
  bash -n "$sh"
  grep -Eq '^[[:space:]]*set -euo pipefail[[:space:]]*$' "$sh"
done
for jf in "$here"/*.json "$here"/expected-outputs/*.json; do jq -e 'type=="object"' "$jf" >/dev/null; done
jq -e '.gate_id=="LC-WEB-RESEARCH-LIVE" and .gate_state=="OPEN" and .runtime_status=="NO_DEPLOYMENT_EVIDENCE"' "$here/evidence-template.json" >/dev/null
bash -c 'source "$1"; WR_STEP=selftest; wr_finish 0' bash "$here/lib.sh" | grep -qx 'PASS selftest (READ_ONLY; gate OPEN)'
bash -c 'source "$1"; WR_STEP=selftest; wr_finish 9' bash "$here/lib.sh" 2>&1 | grep -qx 'FAIL selftest (exit=9)'
bash -c 'source "$1"; wr_origin "https://host.example.org"' bash "$here/lib.sh"
if bash -c 'source "$1"; wr_origin "http://127.0.0.1:3080"' bash "$here/lib.sh" >/dev/null 2>&1; then
  echo 'Plaintext/loopback URL unexpectedly accepted' >&2; exit 1
fi
if grep -Eq -- '--request[[:space:]]+(POST|PUT|PATCH|DELETE)' "$here"/0[1-4]-*.sh; then
  echo 'Mutating HTTP command found in observation probe' >&2; exit 1
fi
echo 'Validated Bash, examples, helpers and only-read code path; LIVE not executed'
