#!/usr/bin/env bash
# Offline (<30s), no Tailscale daemon, host, network, account or credentials.
set -euo pipefail
here="$(cd -- "$(dirname -- "$0")" && pwd)"
end() { local rc="$1"; if ((rc==0)); then echo 'PASS 00-tailscale-source-sanity (SOURCE only)'; else echo "FAIL 00-tailscale-source-sanity (exit=$rc)" >&2; fi; }
trap 'end "$?"' EXIT
command -v jq >/dev/null
for sh in "$here"/*.sh; do
  bash -n "$sh"
  grep -Eq '^[[:space:]]*set -euo pipefail[[:space:]]*$' "$sh"
done
for jf in "$here"/*.json "$here"/expected-outputs/*.json; do jq -e 'type=="object"' "$jf" >/dev/null; done
jq -e '.gate_id=="LC-TAILSCALE-MOBILE-LIVE" and .gate_state=="OPEN" and .runtime_status=="NO_DEPLOYMENT_EVIDENCE"' "$here/evidence-template.json" >/dev/null
bash -c 'source "$1"; TM_STEP=selftest; tm_finish 0' bash "$here/lib.sh" | grep -qx 'PASS selftest (READ_ONLY; LIVE gate OPEN)'
bash -c 'source "$1"; TM_STEP=selftest; tm_finish 6' bash "$here/lib.sh" 2>&1 | grep -qx 'FAIL selftest (exit=6)'
bash -c 'source "$1"; tm_https "https://host.example.ts.net"' bash "$here/lib.sh"
if bash -c 'source "$1"; tm_https "https://host.example.com"' bash "$here/lib.sh" >/dev/null 2>&1; then
  echo 'Invalid public URL accepted' >&2; exit 1
fi
if grep -Eq '(tailscale[[:space:]]+(serve|funnel)[[:space:]]+(--bg|reset|off|set-config|clear|advertise)|curl[[:space:]].*--request[[:space:]]+(POST|PUT|PATCH|DELETE))' "$here"/0[1-4]-*.sh; then
  echo 'Material or public-exposure command found' >&2; exit 1
fi
echo 'Validated shell, fixtures and fail-closed helpers; no LIVE calls'
