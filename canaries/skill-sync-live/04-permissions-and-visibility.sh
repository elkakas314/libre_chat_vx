#!/usr/bin/env bash
# Validate private evidence from authenticated mirror/read ACL, compared with Git blob hashes.
# A structural PASS is NOT independent authentication of supplied evidence.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
ss_start "04-mirror-permissions"
ss_need "01-source.json"; ss_need "02-inventory.json"; ss_need "03-status-probe.json"; ss_stage
: "${LC_SKILL_MIRROR_PROOF_FILE:?LC_SKILL_MIRROR_PROOF_FILE private JSON required}"
[[ -s "$LC_SKILL_MIRROR_PROOF_FILE" ]] || ss_fail "No private mirror proof file"
jq -e --argjson stage "$LC_SKILL_STAGE" --slurpfile src "$SS_DIR/01-source.json" \
 --slurpfile inv "$SS_DIR/02-inventory.json" --slurpfile sta "$SS_DIR/03-status-probe.json" '
 .schema=="libre-chat-vx.skill-sync-mirror-proof.v1" and
 .stage==$stage and .source_id==$sta[0].source_id and
 .authenticated_admin_readback==true and .permissions_verified==true and
 .scope_verified==true and .viewer_roles_tested==true and
 (.mirror_readback_ref|type=="string" and length>8) and
 (.viewer_proof_ref|type=="string" and length>8) and
 (.rollback_snapshot_ref|type=="string" and length>8) and
 (.observed_at_utc|type=="string") and (.mirrors|type=="array") and
 (.mirrors|length)==(if $stage==1 then 12 else 10 end) and
 ([.mirrors[].name]|unique|length)==(.mirrors|length) and
 (.mirrors as $mirrors |
   all((if $stage==1 then ($inv[0].active+$inv[0].legacy) else $inv[0].active end)[]; . as $name |
     any($mirrors[]; .name==$name and .root_path==("skills/"+$name) and
      .git_commit_sha==$src[0].git_commit_sha and
      (.skill_md_git_blob_sha as $blob |
        any($inv[0].physical[];.name==$name and .git_blob_sha==$blob)) and
      .visible_to_expected_principals==true and
      .hidden_from_unauthorized_principals==true and .scope_verified==true and
      (.readback_ref|type=="string" and length>8))
 ) and
 (if $stage==2 then .legacy_absence_confirmed==true and
     (.stage1_verified_proof_ref|type=="string" and length>8) and
     ([.mirrors[].name]|all(. != "nostromo-intent-translation" and . != "nostromo-tool-budget"))
   else .legacy_absence_confirmed==false end)' "$LC_SKILL_MIRROR_PROOF_FILE" >/dev/null ||
 ss_fail "Missing authenticated mirror names/hashes/ACL or rollback evidence"
observed="$(jq -r '.observed_at_utc' "$LC_SKILL_MIRROR_PROOF_FILE")"
ss_fresh "$observed"
echo 'CHECKED externally supplied per-Skill blob/provenance/ACL claims (structure only)'
echo 'LIVE requires independent verification of the authenticated readback references and rollback'
