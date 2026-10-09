#!/usr/bin/env bash
# Run with no secrets: static Bash syntax and JSON sample syntax.
set -euo pipefail
here="$(cd -- "$(dirname -- "$0")" && pwd)"
end() { local rc="$1"; if ((rc==0)); then echo 'PASS 00-source-sanity (SOURCE only)'; else echo "FAIL 00-source-sanity (exit=$rc)" >&2; fi; }
trap 'end "$?"' EXIT
for p in "$here"/*.sh; do bash -n "$p"; done
for p in "$here"/*.json "$here"/expected-outputs/*.json; do jq -e 'type=="object"' "$p" >/dev/null; done
grep -qF 'NO_DEPLOYMENT_EVIDENCE' "$here/evidence-template.json"
echo 'Read-only syntax check; neither APIs nor host examined'
