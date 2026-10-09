#!/usr/bin/env bash
# Read-only tailnet CLI status and an admin-exported, real SSH policy JSON.
# Tailscale status alone CANNOT prove SSH authorization.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
rc_start '02-read-tailscale-ssh-policy'
rc_require tailscale
rc_require python3
policy="${RECOVERY_TAILSCALE_SSH_POLICY_FILE:-}"
[[ -n "$policy" && -f "$policy" && -r "$policy" && -s "$policy" && ! -L "$policy" ]] ||
  rc_skip 'Tailnet admin SSH policy export unavailable; tailscale status alone is insufficient'
operator="${RECOVERY_OPERATOR_PRINCIPAL:-}"
dest="${RECOVERY_SSH_DESTINATION:-}"
login="${RECOVERY_SSH_OS_USER:-}"
ref="${RECOVERY_SSH_POLICY_READBACK_REF:-}"
captured="${RECOVERY_SSH_POLICY_CAPTURED_AT_UTC:-}"
[[ -n "$operator" && -n "$dest" && -n "$login" && ${#ref} -gt 8 && -n "$captured" ]] ||
  rc_skip 'Operator/destination/login and authenticated export reference required'
rc_fresh "$captured"
tmp="$(mktemp "$RC_DIR/.tailscale.XXXXXXXX")"
if ! tailscale status --json > "$tmp" 2>/dev/null; then
  rm -f -- "$tmp"
  rc_fail 'Tailscale status read failed'
fi
jq -e '.BackendState=="Running" and .Self.Online==true' "$tmp" >/dev/null ||
  rc_fail 'Tailscale is not online on this LibreChat host'
rm -f -- "$tmp"
# Only exact operator or a resolved group is accepted: no wildcard authorizations.
if ! python3 - "$policy" <<'PY'
import json
import os
import sys
path = sys.argv[1]
operator = os.environ["RECOVERY_OPERATOR_PRINCIPAL"]
dest = os.environ["RECOVERY_SSH_DESTINATION"]
login = os.environ["RECOVERY_SSH_OS_USER"]
with open(path, encoding='utf-8') as stream:
    doc = json.load(stream)
if not isinstance(doc, dict) or not isinstance(doc.get('ssh'), list):
    raise SystemExit('Missing normalized tailnet SSH policy')
groups = doc.get('groups') or {}
if not isinstance(groups, dict):
    raise SystemExit('Invalid groups in policy')

def permitted_source(source):
    if source == operator:
        return True
    return (source.startswith('group:') and isinstance(groups.get(source), list)
            and operator in groups[source])

rules = doc['ssh']
valid = any(
    isinstance(rule, dict)
    and rule.get('action') == 'accept'
    and isinstance(rule.get('src'), list)
    and isinstance(rule.get('dst'), list)
    and isinstance(rule.get('users'), list)
    and any(isinstance(src, str) and permitted_source(src) for src in rule['src'])
    and dest in rule['dst'] and login in rule['users']
    for rule in rules
)
if not valid:
    raise SystemExit('No exact accept rule for this operator, host and OS user')
PY
then
  rc_fail 'Tailnet SSH policy does not prove an exact authorized operator rule'
fi
sha="$(sha256sum "$policy" | cut -d ' ' -f1)"
jq -n --arg at "$(rc_stamp)" --arg captured "$captured" --arg sha "$sha" \
 --arg ref "$ref" '{schema:"libre-chat-vx.recovery-ssh-policy-readback.v1",
   tailscale_backend_running:true,tailnet_ssh_policy_exact_accept_rule:true,
   operator_principal_not_logged:true,policy_sha256:$sha,
   policy_captured_at_utc:$captured,policy_readback_ref:$ref,
   independent_ssh_during_downtime_verified:false,observed_at_utc:$at,
   read_only:true,gate_closed:false}' > "$RC_DIR/02-result.json"
chmod 600 -- "$RC_DIR/02-result.json"
echo 'READ online Tailscale and exact tailnet SSH allow rule; no SSH-live claim'
