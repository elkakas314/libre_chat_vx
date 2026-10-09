#!/usr/bin/env bash
# Admin authenticated status only, no POST /sync/run and no configuration writes.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
ss_start "03-admin-sync-status"
ss_need "01-source.json"; ss_need "02-inventory.json"; ss_stage; ss_secret LC_ADMIN_JWT
: "${LC_BASE_URL:?LC_BASE_URL required}"
: "${LC_SKILL_SOURCE_ID:?LC_SKILL_SOURCE_ID from admin readback required; never guess}"
[[ "$LC_BASE_URL" =~ ^https://[a-zA-Z0-9.-]+(:[0-9]+)?$ ]] || ss_fail "Invalid HTTPS LC_BASE_URL"
SS_BASE_URL="$LC_BASE_URL"
ss_get "$SS_BASE_URL/api/admin/skills/sync/status" "$SS_DIR/03-admin-status.json" "$LC_ADMIN_JWT"
count="$(if [[ "$LC_SKILL_STAGE" == "1" ]]; then echo 12; else echo 10; fi)"
tenant="${LC_EXPECTED_TENANT_ID:-}"
jq -e --arg source "$LC_SKILL_SOURCE_ID" --arg tenant "$tenant" --arg ref "$SS_REF" \
 --arg owner "$LC_SKILL_REPO_OWNER" --arg repo "$LC_SKILL_REPO_NAME" --argjson stage "$LC_SKILL_STAGE" --argjson count "$count" --slurpfile inv "$SS_DIR/02-inventory.json" '
 .enabled==true and .runOnStartup==false and (.sources|type=="array") and
 ([.sources[]|select(.sourceId==$source)]|length)==1 and
 ([.sources[]|select(.sourceId!=$source and .owner==$owner and .repo==$repo)]|length)==0 and
 ([.sources[]|select(.sourceId==$source)][0] as $s |
 $s.provider=="github" and $s.owner==$owner and $s.repo==$repo and
 $s.ref==$ref and ($s.tenantId // "")==$tenant and $s.credentialPresent==true and
 $s.status=="succeeded" and $s.syncedSkillCount==$count and
 $s.skippedSkillCount==0 and $s.skippedFileCount==0 and
 (if $stage==1 then $s.deletedSkillCount==0 else $s.deletedSkillCount==2 end) and
 (($s.paths|sort)==(if $stage==1 then $inv[0].stage1_paths else $inv[0].stage2_paths end)) and
 ($s.finishedAt|type=="string"))' "$SS_DIR/03-admin-status.json" >/dev/null ||
 ss_fail "Status/sourceId/tenant/paths/counts ambiguous or not succeeded; stop"
finish="$(jq -r --arg id "$LC_SKILL_SOURCE_ID" '.sources[]|select(.sourceId==$id)|.finishedAt' "$SS_DIR/03-admin-status.json")"
ss_fresh "$finish"
jq -n --arg id "$LC_SKILL_SOURCE_ID" --argjson stage "$LC_SKILL_STAGE" \
 --arg finished "$finish" --arg now "$(date -u +%FT%TZ)" '
 {schema:"libre-chat-vx.skill-sync-status-probe.v1",source_id:$id,stage:$stage,
 finished_at_utc:$finished,observed_at_utc:$now,authenticated_admin_status:true,
 mirror_sha_verified:false,acl_verified:false,live_gate_closed:false}' > "$SS_DIR/03-status-probe.json"
chmod 600 -- "$SS_DIR/03-status-probe.json"
echo "READ admin sync status stage=$LC_SKILL_STAGE synced=$count; no POST"
echo 'Admin counters alone do not prove mirrored file hashes, ACL or visibility'
