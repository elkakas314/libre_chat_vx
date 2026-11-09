#!/usr/bin/env bash
# Evidence-only validation of admin-observed ACL revocation and rollback. No revoke/reset commands.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
tm_start "04-revocation-and-rollback"
tm_need "01-result.json"; tm_need "02-result.json"; tm_need "03-result.json"
: "${TAILSCALE_REVOCATION_PROOF_FILE:?Private revocation/rollback evidence required}"
[[ -s "$TAILSCALE_REVOCATION_PROOF_FILE" ]] || tm_fail "Missing revocation proof"
jq -e --slurpfile host "$TM_DIR/01-result.json" '
 .schema=="libre-chat-vx.tailscale-revocation-proof.v1" and
 .authenticated_tailnet_admin_readback==true and
 .revoked_identity_deny_verified==true and
 .non_tailnet_access_denied==true and
 .funnel_off_after==true and
 .host_reserved_resources_unchanged==true and
 .rollback_observed_authenticated==true and
 .rollback_restored_previous_serve_config==true and
 (.previous_serve_config_sha256|test("^[0-9a-f]{64}$")) and
 .previous_serve_config_sha256==.restored_serve_config_sha256 and
 (.acl_revoke_readback_ref|type=="string" and length>8) and
 (.denied_access_observation_ref|type=="string" and length>8) and
 (.previous_config_snapshot_ref|type=="string" and length>8) and
 (.rollback_readback_ref|type=="string" and length>8) and
 (.other_services_unchanged_proof_ref|type=="string" and length>8) and
 (.observed_at_utc|type=="string")' "$TAILSCALE_REVOCATION_PROOF_FILE" >/dev/null ||
 tm_fail "Revocation, Funnel-disabled, no-collision or rollback proof incomplete"
when="$(jq -r '.observed_at_utc' "$TAILSCALE_REVOCATION_PROOF_FILE")"
tm_fresh "$when"
jq -n --arg now "$(date -u +%FT%TZ)" '
 {schema:"libre-chat-vx.tailscale-revocation-validation.v1",observed_at_utc:$now,
 external_proof_structure_valid:true,external_proof_independently_authenticated:false,
 automatic_rollback_executed:false,gate_closed:false}' > "$TM_DIR/04-result.json"
chmod 600 -- "$TM_DIR/04-result.json"
echo 'CHECKED revocation/rollback evidence STRUCTURE; no ACL/Serve/Funnel mutation'
