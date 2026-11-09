#!/usr/bin/env bash
# Read-only systemctl status, fallback to sanitized ps. Never modifies a service.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
rc_start '01-read-host-service-state'
unit="$(rc_unit)"
if command -v systemctl >/dev/null 2>&1 && systemctl show --property=Id --value "$unit" >/dev/null 2>&1; then
  # Explicit status read requested; avoid leaking journal lines.
  systemctl status --no-pager --lines=0 "$unit" >/dev/null 2>&1 || true
  name="$(systemctl show --property=Id --value "$unit")"
  state="$(systemctl show --property=ActiveState --value "$unit")"
  sub="$(systemctl show --property=SubState --value "$unit")"
  pid="$(systemctl show --property=MainPID --value "$unit")"
  [[ "$name" == "$unit" ]] || rc_fail 'Systemd unit identity differs from selected LibreChat unit'
  [[ "$state" =~ ^(active|inactive|failed|activating|deactivating)$ ]] || rc_fail 'Unknown unit state'
  [[ "$pid" =~ ^[0-9]+$ ]] || rc_fail 'MainPID readback is invalid'
  jq -n --arg unit "$unit" --arg state "$state" --arg sub "$sub" \
    --argjson pid "$pid" --arg at "$(rc_stamp)" \
    '{schema:"libre-chat-vx.recovery-service-readback.v1",method:"systemctl",
      service_unit:$unit,active_state:$state,sub_state:$sub,main_pid:$pid,
      observed_at_utc:$at,read_only:true,gate_closed:false}' > "$RC_DIR/01-result.json"
else
  rc_require ps
  # The fallback reports only command names, never full argv/secrets.
  count="$(ps -eo comm= | grep -Eic '^(librechat|librechat-vx)$' || true)"
  [[ "$count" =~ ^[0-9]+$ ]] || rc_fail 'ps fallback invalid'
  jq -n --arg unit "$unit" --argjson count "$count" --arg at "$(rc_stamp)" \
    '{schema:"libre-chat-vx.recovery-service-readback.v1",method:"ps-observation-only",
      service_unit:$unit,matching_process_names:$count,active_state:"UNVERIFIED",
      observed_at_utc:$at,read_only:true,gate_closed:false}' > "$RC_DIR/01-result.json"
fi
chmod 600 -- "$RC_DIR/01-result.json"
echo 'READ dedicated LibreChat service state; ps fallback is NOT enough to restart'
