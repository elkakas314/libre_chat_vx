#!/usr/bin/env bash
# ONLY material step: exactly one authorized systemd restart of owned LibreChat.
# No MANOJOS3 calls. No retries, no killall, no global resets.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
rc_start '03-canary-service-restart'
[[ "${RECOVERY_CANARY_ALLOW_RESTART:-}" == YES ]] ||
  rc_skip 'RECOVERY_CANARY_ALLOW_RESTART=YES is required; no restart attempted'
rc_require systemctl
rc_require curl
rc_require flock
rc_need '01-result.json'
rc_need '02-result.json'
unit="$(rc_unit)"
jq -e --arg unit "$unit" '
  .method=="systemctl" and .service_unit==$unit and
  .active_state=="active" and .main_pid>0' "$RC_DIR/01-result.json" >/dev/null ||
  rc_fail 'Service is not positively identified as active from systemctl'
jq -e '.tailscale_backend_running==true and .tailnet_ssh_policy_exact_accept_rule==true' \
  "$RC_DIR/02-result.json" >/dev/null || rc_fail 'Missing authorized out-of-band SSH preflight'
rc_fresh "$(jq -r '.observed_at_utc' "$RC_DIR/01-result.json")"
rc_fresh "$(jq -r '.observed_at_utc' "$RC_DIR/02-result.json")"
rc_fresh "$(jq -r '.policy_captured_at_utc' "$RC_DIR/02-result.json")"
# Require a recent, authenticated connection from a separate OOB client
# and a previously approved rollback snapshot before any service effect.
preflight="${RECOVERY_SSH_PREFLIGHT_PROOF_FILE:-}"
[[ -n "$preflight" && -s "$preflight" && -f "$preflight" && -r "$preflight" && ! -L "$preflight" ]] ||
  rc_skip 'No authenticated independent-client SSH preflight and service rollback snapshot'
jq -e '.schema=="libre-chat-vx.recovery-ssh-preflight.v1" and
  .authenticated_from_independent_client==true and .ssh_separate_from_librechat_service==true and
  .operator_consents_to_maintenance==true and
  (.ssh_readback_ref|type=="string" and length>8) and
  (.rollback_snapshot_readback_ref|type=="string" and length>8) and
  (.observed_at_utc|type=="string")' "$preflight" >/dev/null ||
  rc_fail 'SSH preflight, maintenance authorization or rollback snapshot evidence invalid'
rc_fresh "$(jq -r '.observed_at_utc' "$preflight")"
# Concurrency fence for this canary only. Does NOT prove app-level job idempotency.
exec 9>"$RC_DIR/restart.lock"
flock -n 9 || rc_skip 'Another recovery canary holds the restart lock'
[[ "$(systemctl show --property=Id --value "$unit")" == "$unit" ]] ||
  rc_fail 'Host unit identity mismatch'
[[ "$(systemctl show --property=ActiveState --value "$unit")" == active ]] ||
  rc_fail 'Service not active immediately before controlled restart'
health="${RECOVERY_HEALTH_URL:-http://127.0.0.1:3080/api/health}"
case "$health" in
  http://127.0.0.1:3080/api/health|http://127.0.0.1:3080/) ;;
  *) rc_fail 'Health URL must be an allowlisted LibreChat local endpoint' ;;
esac
# Check health before touching service; no redirects and no external egress.
code="$(curl --noproxy '*' --proto '=http' --max-redirs 0 --silent \
  --connect-timeout 2 --max-time 4 -o /dev/null -w '%{http_code}' "$health")" ||
  rc_fail 'Pre-restart LibreChat health unavailable; no restart attempted'
[[ "$code" == 200 ]] || rc_fail 'Expected HTTP 200 before restarting; no restart attempted'
started="$(rc_stamp)"
# Exactly one restart call. If it fails/has unknown outcome, stop and require
# operator readback. Automatic material retries could duplicate jobs.
if ! systemctl --no-ask-password restart -- "$unit"; then
  rc_fail 'Restart failed or had unknown effect: manual recovery per 05-rollback.md'
fi
# Poll only the health endpoint; NEVER retry the material restart.
ok=NO
for _ in {1..15}; do
  if [[ "$(systemctl show --property=ActiveState --value "$unit")" == active ]] &&
     [[ "$(curl --noproxy '*' --proto '=http' --max-redirs 0 --silent \
       --connect-timeout 2 --max-time 3 -o /dev/null -w '%{http_code}' "$health" 2>/dev/null || true)" == 200 ]]; then
    ok=YES
    break
  fi
  sleep 2
done
[[ "$ok" == YES ]] || rc_fail 'LibreChat health did not return; manual rollback needed'
pid="$(systemctl show --property=MainPID --value "$unit")"
[[ "$pid" =~ ^[1-9][0-9]*$ ]] || rc_fail 'Restart healthy but main process PID invalid'
completed="$(rc_stamp)"
jq -n --arg unit "$unit" --arg started "$started" --arg completed "$completed" \
  --arg at "$(rc_stamp)" --arg health "$health" \
  '{schema:"libre-chat-vx.recovery-restart-readback.v1",service_unit:$unit,
   effect:"ONE_SYSTEMCTL_RESTART",restart_calls:1,
   restart_started_at_utc:$started,restart_completed_at_utc:$completed,
   health_url:$health,health_http_status:200,service_active_after:true,
   main_pid_observed:true,operator_restart_opt_in:true,
   ssh_during_downtime_verified:false,duplicate_jobs_verified:false,
   observed_at_utc:$at,gate_closed:false}' > "$RC_DIR/03-result.json"
chmod 600 -- "$RC_DIR/03-result.json"
echo 'READ post-restart 200/active; OOB SSH and job de-duplication need independent proof'
