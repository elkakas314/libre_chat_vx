#!/usr/bin/env bash
# Validates externally collected Wi-Fi/data/desktop handoff observations: no device control.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
tm_start "03-mobile-continuity"
tm_need "01-result.json"; tm_need "02-result.json"
: "${TAILSCALE_MOBILE_PROOF_FILE:?Private authenticated mobile proof required}"
[[ -s "$TAILSCALE_MOBILE_PROOF_FILE" ]] || tm_fail "Missing mobile observations"
jq -e --slurpfile host "$TM_DIR/01-result.json" --slurpfile route "$TM_DIR/02-result.json" '
 .schema=="libre-chat-vx.tailscale-mobile-proof.v1" and
 .authenticated_device_observations==true and
 .server_origin==$route[0].url and
 (.observed_at_utc|type=="string") and
 (.desktop.conversation_sha256|test("^[0-9a-f]{64}$")) and
 .desktop.conversation_sha256==.mobile_wifi.conversation_sha256 and
 .desktop.conversation_sha256==.mobile_data.conversation_sha256 and
 .desktop.same_backend_verified==true and
 .mobile_wifi.authenticated==true and .mobile_wifi.tailnet_connected==true and
 .mobile_data.authenticated==true and .mobile_data.tailnet_connected==true and
 .mobile_data.reconnect_after_wifi==true and
 .handoff.mobile_to_desktop_verified==true and
 .handoff.desktop_to_mobile_verified==true and
 .stream.device_switch_resume_checked==true and
 .offline.local_text_draft_retained==true and
 .offline.queued_target_mutations==0 and .offline.queued_authorizations==0 and
 .offline.material_replay_occurred==false and
 .reconnect.session_refreshed==true and .reconnect.acl_refreshed==true and
 .reconnect.target_readback_required_for_possible_effect==true and
 .backend_down.ui_unavailable_explicit==true and
 (.evidence_refs|type=="array" and length>=5 and all(.[];type=="string" and length>8))
 ' "$TAILSCALE_MOBILE_PROOF_FILE" >/dev/null ||
 tm_fail "Mobile Wi-Fi/data/history/reconnect or mutation-fence proof missing"
observed="$(jq -r '.observed_at_utc' "$TAILSCALE_MOBILE_PROOF_FILE")"
tm_fresh "$observed"
# Only a structured attestation. It is NOT independent authentication of mobile screenshots/readbacks.
jq -n --arg observed "$observed" '
 {schema:"libre-chat-vx.tailscale-mobile-probe.v1",mobile_proof_observed_at_utc:$observed,
 declared_observations_structurally_valid:true,independent_device_readback_verified:false,
 gate_closed:false}' > "$TM_DIR/03-result.json"
chmod 600 -- "$TM_DIR/03-result.json"
echo 'CHECKED mobile handoff/Wi-Fi/data/offline evidence STRUCTURE; operator authentication still required'
