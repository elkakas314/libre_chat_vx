#!/usr/bin/env bash
# Only controlled service start, with explicit human authorization and state restoration.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
lp_start "02-load-scenario-librechat-startup"
[[ "${LOWPOWER_ALLOW_STARTUP:-}" == YES ]] ||
  lp_skip "LOWPOWER_ALLOW_STARTUP=YES required"
lp_require systemctl
lp_require curl
lp_require flock
unit="${LOWPOWER_LIBRECHAT_SERVICE:-}"
[[ "$unit" =~ ^librechat(-vx)?[a-zA-Z0-9_.@-]*\.service$ ]] ||
  lp_fail "Explicit dedicated LibreChat systemd unit required"
health="${LOWPOWER_HEALTH_URL:-http://127.0.0.1:3080/}"
lp_loopback "$health"
seconds="$(lp_seconds)"
exec 9>"$LP_DIR/.startup.lock"
flock -n 9 || lp_skip "Another startup benchmark holds the lock"
systemctl show "$unit" -p LoadState --value 2>/dev/null | grep -qx loaded ||
  lp_fail "systemd service not loaded"
current="$(systemctl is-active "$unit" 2>/dev/null || true)"
[[ "$current" == inactive || "$current" == failed ]] ||
  lp_skip "Service is $current: refusing to restart/stop an already running instance"
[[ "$current" == inactive ]] ||
  lp_skip "Service is in failed state; manual recovery first"
# Refuse to take down running health endpoints (possibly a different service).
if curl --noproxy '*' --silent --output /dev/null --max-time 3 "$health"; then
  lp_skip "Health endpoint already serves traffic; avoid touching unknown process"
fi
started=no
sampler_pid=""
flag="$LP_DIR/.stop-startup-$BASHPID"
rm -f -- "$flag"
cleanup() {
  local rc="$1"
  : > "$flag"
  if [[ -n "$sampler_pid" ]]; then wait "$sampler_pid" >/dev/null 2>&1 || rc=1; fi
  if [[ "$started" == yes ]]; then
    systemctl stop "$unit" >/dev/null 2>&1 || { LP_REASON="Could not restore originally inactive service"; rc=1; }
  fi
  rm -f -- "$flag"
  lp_finish "$rc"
}
trap 'cleanup "$?"' EXIT
lp_snapshot startup-before
lp_sample "$seconds" "$LP_DIR/02-startup.json" "STARTUP" "$flag" &
sampler_pid="$!"
start_ms="$(date +%s%3N)"
started=yes
systemctl start "$unit" || lp_fail "systemctl start failed; cleanup attempts stop"
maxwait="${LOWPOWER_STARTUP_TIMEOUT_SECONDS:-90}"
[[ "$maxwait" =~ ^[1-9][0-9]*$ ]] && ((maxwait<=600)) || lp_fail "Invalid startup timeout"
healthy=no
for ((i=0;i<maxwait;i++)); do
  if systemctl is-active --quiet "$unit" &&
    [[ "$(curl --noproxy '*' --silent --max-time 3 --output /dev/null --write-out '%{http_code}' "$health" 2>/dev/null || true)" == 200 ]]; then
    healthy=yes; break
  fi
  sleep 1
done
[[ "$healthy" == yes ]] || lp_fail "Health did not return HTTP 200 before timeout"
latency_ms="$(( $(date +%s%3N) - start_ms ))"
: > "$flag"
wait "$sampler_pid" || lp_fail "Metrics collection failed"
sampler_pid=""
python3 - "$LP_DIR/02-startup.json" "$latency_ms" <<'PY'
import json,os,sys
path,ms=sys.argv[1],int(sys.argv[2])
with open(path,encoding='utf8') as f:d=json.load(f)
d['latency_ms']=ms;d['latency_kind']='systemctl_start_to_health_200'
d['service_original_state']='inactive';d['temporary_service_start']=True
d['service_restoration_attempted_on_exit']=True
tmp=path+'.tmp'
with open(tmp,'w',encoding='utf8') as f:json.dump(d,f,indent=2);f.write('\n')
os.chmod(tmp,0o600);os.replace(tmp,path)
PY
echo "MEASURED service startup until health HTTP 200; restoring original inactive state"
