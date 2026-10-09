#!/usr/bin/env bash
# Enumerate the physical source tree. Never remove or retire legacy Skills.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
ss_start "02-inventory-skills"; ss_root
jq -e '.schema=="libre-chat-vx.skill-catalog.v3" and .counts.active_catalog==10 and
 .counts.legacy_on_disk==2 and .counts.physical_skills==12 and
 (.catalog|type=="array" and length==10) and (.legacy_compatibility|type=="array" and length==2)' \
 "$SS_CATALOG" >/dev/null || ss_fail "Invalid 10+2 canonical catalog"
mapfile -t physical < <(find "$SS_SKILLS" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | LC_ALL=C sort)
for name in "${physical[@]}"; do
 [[ "$name" =~ ^[a-z0-9-]+$ ]] || ss_fail "Unexpected Skill directory name"
 [[ -f "$SS_SKILLS/$name/SKILL.md" && ! -L "$SS_SKILLS/$name/SKILL.md" ]] ||
  ss_fail "Missing or symlinked SKILL.md in physical folder $name"
done
actual="$(printf '%s\n' "${physical[@]}" | jq -Rsc 'split("\n")|map(select(length>0))')"
head="$(git -C "$SS_ROOT" rev-parse HEAD)"; ss_sha "$head"
jq -n --argjson physical "$actual" --arg head "$head" --slurpfile cat "$SS_CATALOG" '
 {schema:"libre-chat-vx.skill-sync-physical-inventory.v1",
  source_git_commit_sha:$head,physical:$physical,active:($cat[0].catalog|map(.name)),
  legacy:($cat[0].legacy_compatibility|map(.name)),
  expected_physical:12,expected_active:10,expected_legacy:2,
  matched:((($cat[0].catalog|map(.name))+($cat[0].legacy_compatibility|map(.name))|sort)==($physical|sort)
    and ($physical|length)==12 and ($cat[0].catalog|length)==10 and
    ($cat[0].legacy_compatibility|length)==2)}' > "$SS_DIR/02-inventory.json"
chmod 600 -- "$SS_DIR/02-inventory.json"
jq -e '.matched==true' "$SS_DIR/02-inventory.json" >/dev/null ||
 ss_fail "12 physical folders / 10 active / 2 legacy mismatch (recorded; not modified)"
git -C "$SS_ROOT" diff --quiet HEAD -- skills config/skills.current.json ||
 ss_fail "Source Skill/catalog working tree differs from git_commit_sha"
echo 'READ source folders: 12 physical, 10 active, 2 legacy retained'
