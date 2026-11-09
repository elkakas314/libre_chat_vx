#!/usr/bin/env bash
# Read status; upstream response uses sources[].sourceId (normalized to source_id).
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
ss_start "01-authenticated-readback"; ss_base; ss_secret LIBRECHAT_ADMIN_TOKEN
ss_get "$SS_BASE/api/admin/skills/sync/status" "$LIBRECHAT_ADMIN_TOKEN" "$SS_DIR/01-admin-status.json"
jq -e '.sources|type=="array" and length>0 and
 all(.[]; (.sourceId|type=="string" and length>0) and
 (.paths|type=="array" and length>0 and all(.[];type=="string" and length>0)))' \
 "$SS_DIR/01-admin-status.json" >/dev/null ||
 ss_fail "HTTP 200 but missing sources[].sourceId or paths"
source_id="${SKILL_SYNC_SOURCE_ID:-}"
if [[ -z "$source_id" ]]; then
 count="$(jq '.sources|length' "$SS_DIR/01-admin-status.json")"
 (( count==1 )) || ss_fail "Multiple sources: SKILL_SYNC_SOURCE_ID must come from authenticated admin status"
 source_id="$(jq -r '.sources[0].sourceId' "$SS_DIR/01-admin-status.json")"
fi
jq -e --arg id "$source_id" '[.sources[]|select(.sourceId==$id)]|length==1' \
 "$SS_DIR/01-admin-status.json" >/dev/null || ss_fail "source_id missing or ambiguous in readback"
jq -n --arg id "$source_id" --slurpfile status "$SS_DIR/01-admin-status.json" '
 ($status[0].sources|map(select(.sourceId==$id))[0]) as $s |
 {schema:"libre-chat-vx.skill-sync-admin-readback.v1",source_id:$s.sourceId,
  paths:$s.paths,owner:($s.owner//null),repo:($s.repo//null),ref:($s.ref//null),
  tenant_id:($s.tenantId//null),sync_status:($s.status//null),
  synced_skill_count:($s.syncedSkillCount//null),skipped_skill_count:($s.skippedSkillCount//null),
  skipped_file_count:($s.skippedFileCount//null),deleted_skill_count:($s.deletedSkillCount//null),
  finished_at:($s.finishedAt//null),enabled:($status[0].enabled//false),
  run_on_startup:($status[0].runOnStartup//null),
  observed_at_utc:(now|todateiso8601),gate_closed:false}' > "$SS_DIR/01-source.json"
chmod 600 -- "$SS_DIR/01-source.json"
echo 'READ authenticated admin status with source_id and paths; HTTP 200 is not LIVE_VERIFIED'
