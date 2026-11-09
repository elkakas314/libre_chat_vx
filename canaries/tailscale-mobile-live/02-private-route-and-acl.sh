#!/usr/bin/env bash
# Run on authorized tailnet client, with host readback files copied PRIVATELY from step 01.
# Authenticated HTTPS GET only; positive access is not enough to verify ACL revocation.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
tm_start "02-private-route-and-acl"
tm_require tailscale
tm_need "01-tailnet-host.json"; tm_need "01-result.json"
: "${TAILSCALE_LIBRECHAT_URL:?TAILSCALE_LIBRECHAT_URL MagicDNS HTTPS origin required}"
: "${LIBRECHAT_VIEW_TOKEN:?LIBRECHAT_VIEW_TOKEN required for authenticated GET /api/user}"
tm_https "$TAILSCALE_LIBRECHAT_URL"
host_dns="$(jq -r '.Self.DNSName' "$TM_DIR/01-tailnet-host.json")"
[[ "$TAILSCALE_LIBRECHAT_URL" == "https://${host_dns%.}" || "$TAILSCALE_LIBRECHAT_URL" == "https://${host_dns%.}:443" ]] ||
 tm_fail "Mobile target differs from host's authenticated MagicDNS readback"
tm_capture "$TM_DIR/02-tailnet-client.json" tailscale status --json
jq -e '.BackendState=="Running" and .Self.Online==true and (.CurrentTailnet|type=="object") and
 (.Self.ID|type=="string")' "$TM_DIR/02-tailnet-client.json" >/dev/null ||
 tm_fail "Client lacks authenticated running Tailscale identity"
host_id="$(jq -r '.Self.ID // empty' "$TM_DIR/01-tailnet-host.json")"
client_id="$(jq -r '.Self.ID // empty' "$TM_DIR/02-tailnet-client.json")"
[[ -n "$host_id" && "$host_id" != "$client_id" ]] || tm_fail "Expected distinct client and host nodes"
host_tailnet="$(jq -r '.CurrentTailnet.MagicDNSSuffix // .MagicDNSSuffix // empty' "$TM_DIR/01-tailnet-host.json")"
client_tailnet="$(jq -r '.CurrentTailnet.MagicDNSSuffix // .MagicDNSSuffix // empty' "$TM_DIR/02-tailnet-client.json")"
[[ -n "$host_tailnet" && "$host_tailnet" == "$client_tailnet" ]] || tm_fail "Client and host tailnets disagree"
code="$(tm_curl_code "$TM_DIR/02-user.json" "$TAILSCALE_LIBRECHAT_URL/api/user" \
 --header "Authorization: Bearer $LIBRECHAT_VIEW_TOKEN")"
[[ "$code" == 200 ]] || tm_fail "Tailnet client authenticated /api/user HTTP=$code"
jq -e '(.id//._id|type=="string" and length>0) and (.role|type=="string" and length>0)' "$TM_DIR/02-user.json" >/dev/null ||
 tm_fail "LibreChat authenticated session identity not verified"
jq -n --arg now "$(date -u +%FT%TZ)" --arg url "$TAILSCALE_LIBRECHAT_URL" '
 {schema:"libre-chat-vx.tailscale-private-route.v1",url:$url,
 client_tailnet_authenticated:true,librechat_user_authenticated:true,
 observed_at_utc:$now,acl_revoke_verified:false,gate_closed:false}' > "$TM_DIR/02-result.json"
chmod 600 -- "$TM_DIR/02-result.json"
echo 'READ authorized tailnet-client MagicDNS/HTTPS and authenticated LibreChat session'
