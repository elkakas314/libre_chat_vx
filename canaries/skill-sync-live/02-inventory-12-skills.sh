#!/usr/bin/env bash
# Check GitHub skill SKILL.md inventory against current catalog; no changes to repo or mirror.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
ss_start "02-inventory"
ss_need "01-tree.json"; ss_need "01-source.json"; ss_secret GITHUB_SKILLS_TOKEN
blob="$(jq -r '[.tree[]|select(.path=="config/skills.current.json" and .type=="blob")]|if length==1 then .[0].sha else empty end' "$SS_DIR/01-tree.json")"
ss_sha "$blob"
ss_get "$SS_API/git/blobs/$blob" "$SS_DIR/02-catalog-blob.json" "$GITHUB_SKILLS_TOKEN"
jq -e --arg sha "$blob" '.sha==$sha and .encoding=="base64"' "$SS_DIR/02-catalog-blob.json" >/dev/null ||
 ss_fail "Catalog SHA or encoding mismatch"
jq -r '.content' "$SS_DIR/02-catalog-blob.json" | base64 --decode > "$SS_DIR/02-catalog.json"
jq -e '.schema=="libre-chat-vx.skill-catalog.v3" and .canonical_path=="skills" and .authority==false and
 .counts.active_catalog==10 and .counts.legacy_on_disk==2 and .counts.physical_skills==12 and
 (.catalog|type=="array" and length==10 and all(.[];.authority==false)) and
 (.legacy_compatibility|type=="array" and length==2)' "$SS_DIR/02-catalog.json" >/dev/null ||
 ss_fail "Catalog disagrees with 10+2 source contract"
jq -e -n --slurpfile cat "$SS_DIR/02-catalog.json" --slurpfile tr "$SS_DIR/01-tree.json" '
 ($cat[0].catalog|map(.name)|sort) as $active |
 ($cat[0].legacy_compatibility|map(.name)|sort) as $legacy |
 ([$tr[0].tree[]|select(.type=="blob" and (.path|test("^skills/[^/]+/SKILL\\.md$")))|.path|split("/")[1]]|sort) as $physical |
 (($active|unique|length)==10) and (($legacy|unique|length)==2) and
 (($physical|unique|length)==12) and (($active+$legacy|sort)==$physical) and
 ($legacy==["nostromo-intent-translation","nostromo-tool-budget"]) and
 all($cat[0].legacy_compatibility[];.status=="PRESENT_ON_DISK_UNTIL_LIVE_SKILL_SYNC_CANARY")
 ' >/dev/null || ss_fail "12 physical roots or legacy aliases mismatch"
jq -n --slurpfile cat "$SS_DIR/02-catalog.json" --slurpfile tr "$SS_DIR/01-tree.json" \
 --slurpfile src "$SS_DIR/01-source.json" --arg blob "$blob" '
 ($cat[0].catalog|map(.name)) as $active |
 ($cat[0].legacy_compatibility|map(.name)) as $legacy |
 {schema:"libre-chat-vx.skill-sync-inventory.v1",source_git_commit_sha:$src[0].git_commit_sha,
 catalog_git_blob_sha:$blob,active:$active,legacy:$legacy,
 physical:[$tr[0].tree[]|select(.type=="blob" and (.path|test("^skills/[^/]+/SKILL\\.md$")))|
 {name:(.path|split("/")[1]),path:.path,git_blob_sha:.sha}],
 stage1_paths:["skills"],stage2_paths:($active|map("skills/"+.)|sort)}' > "$SS_DIR/02-inventory.json"
chmod 600 -- "$SS_DIR/02-catalog.json" "$SS_DIR/02-inventory.json"
echo 'READ 12 physical SKILL.md roots: 10 active, 2 legacy (no deletions)'
