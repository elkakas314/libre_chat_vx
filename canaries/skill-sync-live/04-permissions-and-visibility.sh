#!/usr/bin/env bash
# Verify effective ACL visibility with two role-bound sessions and individual GET only.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
ss_start "04-permissions-and-visibility"; ss_base; ss_stage
ss_secret LIBRECHAT_ALLOWED_ROLE_TOKEN; ss_secret LIBRECHAT_DENIED_ROLE_TOKEN
ss_need "01-source.json"; ss_need "03-result.json"
: "${SKILL_MIRROR_IDS_FILE:?SKILL_MIRROR_IDS_FILE required}"
: "${LIBRECHAT_ALLOWED_ROLE:?Expected authorized role required}"
: "${LIBRECHAT_DENIED_ROLE:?Expected denied role required}"
[[ "$LIBRECHAT_ALLOWED_ROLE_TOKEN" != "$LIBRECHAT_DENIED_ROLE_TOKEN" &&
 "$LIBRECHAT_ALLOWED_ROLE" != "$LIBRECHAT_DENIED_ROLE" ]] ||
 ss_fail "Role witnesses are not distinct"
ss_get "$SS_BASE/api/user" "$LIBRECHAT_ALLOWED_ROLE_TOKEN" "$SS_DIR/04-allowed-user.json"
ss_get "$SS_BASE/api/user" "$LIBRECHAT_DENIED_ROLE_TOKEN" "$SS_DIR/04-denied-user.json"
jq -e --arg role "$LIBRECHAT_ALLOWED_ROLE" '.role==$role' "$SS_DIR/04-allowed-user.json" >/dev/null ||
 ss_fail "Allowed user role did not match authenticated readback"
jq -e --arg role "$LIBRECHAT_DENIED_ROLE" '.role==$role' "$SS_DIR/04-denied-user.json" >/dev/null ||
 ss_fail "Denied user role did not match authenticated readback"
allowed_id="$(jq -r '.id // ._id // empty' "$SS_DIR/04-allowed-user.json")"
denied_id="$(jq -r '.id // ._id // empty' "$SS_DIR/04-denied-user.json")"
[[ -n "$allowed_id" && -n "$denied_id" && "$allowed_id" != "$denied_id" ]] ||
 ss_fail "Role test identities not distinct"
mapfile -t names < <(jq -r '.skills[].name' "$SKILL_MIRROR_IDS_FILE")
for name in "${names[@]}"; do
 id="$(jq -r --arg name "$name" '.skills[]|select(.name==$name)|.id' "$SKILL_MIRROR_IDS_FILE")"
 [[ "$id" =~ ^[a-fA-F0-9]{24}$ ]] || ss_fail "Invalid skill ID"
 ss_get "$SS_BASE/api/skills/$id" "$LIBRECHAT_ALLOWED_ROLE_TOKEN" "$SS_DIR/04-allowed-$name.json"
 jq -e --arg id "$id" --arg name "$name" '._id==$id and .name==$name and .isPublic==false' \
   "$SS_DIR/04-allowed-$name.json" >/dev/null || ss_fail "Allowed role lacks scoped skill / public ACL unexpected: $name"
 code="$(ss_get_code "$SS_BASE/api/skills/$id" "$LIBRECHAT_DENIED_ROLE_TOKEN" "$SS_DIR/04-denied-$name.json")"
 [[ "$code" == 403 || "$code" == 404 ]] || ss_fail "Denied role unexpectedly sees Skill / auth invalid: $name (HTTP $code)"
done
jq -n --arg allowed "$LIBRECHAT_ALLOWED_ROLE" --arg denied "$LIBRECHAT_DENIED_ROLE" \
 --argjson stage "$SKILL_SYNC_STAGE" --arg now "$(date -u +%FT%TZ)" '
 {schema:"libre-chat-vx.skill-sync-visibility.v1",stage:$stage,allowed_role:$allowed,
  denied_role:$denied,observed_at_utc:$now,allowed_get_200:true,denied_get_403_or_404:true,
  public_access:false,full_acl_export_verified:false,gate_closed:false}' > "$SS_DIR/04-result.json"
chmod 600 -- "$SS_DIR/04-result.json"
echo 'READ role-based visibility PASS; complete ACL provenance and rollback still require authenticated admin review'
