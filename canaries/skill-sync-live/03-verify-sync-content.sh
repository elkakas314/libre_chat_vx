#!/usr/bin/env bash
# Compare authenticated individual mirror bodies with exact GitHub Git tree.
# NEVER GET /api/skills (in pinned upstream that list GET may initiate sync).
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
ss_start "03-verify-sync-content"; ss_base; ss_root; ss_stage
ss_secret LIBRECHAT_ADMIN_TOKEN; ss_secret GITHUB_SKILLS_TOKEN
ss_need "01-source.json"; ss_need "02-inventory.json"
: "${SKILL_MIRROR_IDS_FILE:?Private authenticated {source_id,skills:[{name,id}]} required}"
[[ -s "$SKILL_MIRROR_IDS_FILE" ]] || ss_fail "Mirror ID manifest absent"
jq -e --argjson stage "$SKILL_SYNC_STAGE" --slurpfile inv "$SS_DIR/02-inventory.json" \
 --slurpfile src "$SS_DIR/01-source.json" '
 .schema=="libre-chat-vx.skill-sync-mirror-ids.v1" and .source_id==$src[0].source_id and
 (.skills|type=="array") and
 ((.skills|map(.name)|sort)==(if $stage==1 then ($inv[0].active+$inv[0].legacy|sort)
  else ($inv[0].active|sort) end)) and
 ([.skills[].id]|unique|length)==(.skills|length) and
 all(.skills[]; (.id|type=="string" and test("^[a-fA-F0-9]{24}$")))' \
 "$SKILL_MIRROR_IDS_FILE" >/dev/null ||
 ss_fail "Expected 12/10 unique mirrored IDs absent or incompatible"
owner="$(jq -r '.owner // empty' "$SS_DIR/01-source.json")"
repo="$(jq -r '.repo // empty' "$SS_DIR/01-source.json")"
ref="$(jq -r '.ref // empty' "$SS_DIR/01-source.json")"
[[ "$owner" =~ ^[A-Za-z0-9_-]+$ && "$repo" =~ ^[A-Za-z0-9_.-]+$ &&
 "$ref" =~ ^[A-Za-z0-9_./-]+$ && "$ref" != *..* ]] || ss_fail "Unverifiable GitHub source owner/repo/ref"
jq -e --argjson stage "$SKILL_SYNC_STAGE" --slurpfile inv "$SS_DIR/02-inventory.json" '
 .enabled==true and .run_on_startup==false and .sync_status=="succeeded" and
 .skipped_skill_count==0 and .skipped_file_count==0 and
 .synced_skill_count==(if $stage==1 then 12 else 10 end) and
 ((.paths|sort)==(if $stage==1 then ["skills"] else ($inv[0].active|map("skills/"+.)|sort) end))' \
 "$SS_DIR/01-source.json" >/dev/null || ss_fail "Admin sync status/paths/counts do not match selected stage"
head="$(jq -r '.source_git_commit_sha' "$SS_DIR/02-inventory.json")"; ss_sha "$head"
[[ "$(git -C "$SS_ROOT" rev-parse HEAD)" == "$head" ]] || ss_fail "Source HEAD moved"
git -C "$SS_ROOT" diff --quiet HEAD -- skills config/skills.current.json ||
 ss_fail "Source paths dirty"
github_url="https://api.github.com/repos/$owner/$repo/git/ref/heads/$ref"
ss_get "$github_url" "$GITHUB_SKILLS_TOKEN" "$SS_DIR/03-github-before.json"
[[ "$(jq -r '.object.sha // empty' "$SS_DIR/03-github-before.json")" == "$head" ]] ||
 ss_fail "Local SOURCE checkout is not the authenticated GitHub ref"
mapfile -t names < <(jq -r '.skills[].name' "$SKILL_MIRROR_IDS_FILE")
: > "$SS_DIR/03-hashes.tsv"; chmod 600 -- "$SS_DIR/03-hashes.tsv"
for name in "${names[@]}"; do
 id="$(jq -r --arg name "$name" '.skills[]|select(.name==$name)|.id' "$SKILL_MIRROR_IDS_FILE")"
 dest="$SS_DIR/03-skill-$name.json"
 ss_get "$SS_BASE/api/skills/$id" "$LIBRECHAT_ADMIN_TOKEN" "$dest"
 blob="$(git -C "$SS_ROOT" hash-object -- "skills/$name/SKILL.md")"; ss_sha "$blob"
 jq -e --arg name "$name" --arg id "$id" --arg owner "$owner" --arg repo "$repo" \
   --arg ref "$ref" --arg source "$(jq -r '.source_id' "$SS_DIR/01-source.json")" \
   --arg blob "$blob" '
  ._id==$id and .name==$name and .source=="github" and
  .sourceMetadata.provider=="github" and .sourceMetadata.sourceId==$source and
  .sourceMetadata.owner==$owner and .sourceMetadata.repo==$repo and
  .sourceMetadata.ref==$ref and .sourceMetadata.skillPath==("skills/"+$name) and
  .sourceMetadata.skillBlobSha==$blob and (.body|type=="string") and
  (.sourceMetadata.commitSha|type=="string" and test("^[a-fA-F0-9]{40}$"))' \
  "$dest" >/dev/null || ss_fail "Mirror metadata/blob mismatch: $name"
 historic="$(jq -r '.sourceMetadata.commitSha' "$dest")"
 git -C "$SS_ROOT" merge-base --is-ancestor "$historic" "$head" ||
  ss_fail "Mirror commit is not proven ancestor of authenticated SOURCE HEAD: $name"
 original_sha="$(sha256sum "$SS_SKILLS/$name/SKILL.md" | awk '{print $1}')"
 mirror_sha="$(jq -j '.body' "$dest" | sha256sum | awk '{print $1}')"
 [[ "$mirror_sha" == "$original_sha" ]] || ss_fail "SHA256 mirror body differs from SOURCE: $name"
 printf '%s\t%s\t%s\n' "$name" "$blob" "$mirror_sha" >> "$SS_DIR/03-hashes.tsv"
done
ss_get "$github_url" "$GITHUB_SKILLS_TOKEN" "$SS_DIR/03-github-after.json"
[[ "$(jq -r '.object.sha' "$SS_DIR/03-github-after.json")" == "$head" ]] ||
 ss_fail "GitHub ref moved during comparison"
jq -n --argjson stage "$SKILL_SYNC_STAGE" --arg git_commit_sha "$head" \
  --arg now "$(date -u +%FT%TZ)" --rawfile summary "$SS_DIR/03-hashes.tsv" '
 {schema:"libre-chat-vx.skill-sync-content-check.v1",stage:$stage,
  source_git_commit_sha:$git_commit_sha,algorithms:["git_blob_sha","sha256"],
  compared_skill_count:($summary|split("\n")|map(select(length>0))|length),
  observed_at_utc:$now,mirror_content_match:true,gate_closed:false}' > "$SS_DIR/03-result.json"
chmod 600 -- "$SS_DIR/03-result.json"
echo 'READ exact GitHub ref and mirrored body/metadata; sha256 and git_blob_sha match'
