#!/usr/bin/env bash
# Objetivo: read authenticated Cloudflare account, Gateway and all seven dynamic routes.
# Prerequisitos: curl, jq, env CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN / CLOUDFLARE_AI_GATEWAY_ID.
# NO hace: escribir Cloudflare, crear rutas, probar inferencia ni declarar LIVE.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
cf_start "01-account-and-routes"
cf_get "$CF_AIG_BASE" "$CF_AIG_EVIDENCE_DIR/01-account.json"
jq -e --arg account "$CLOUDFLARE_ACCOUNT_ID" '.result.id == $account' \
  "$CF_AIG_EVIDENCE_DIR/01-account.json" >/dev/null || cf_fail "Account mismatch"
cf_get "$CF_AIG_GATEWAY" "$CF_AIG_EVIDENCE_DIR/01-gateway.json"
jq -e --arg gateway "$CLOUDFLARE_AI_GATEWAY_ID" \
  '.result.id == $gateway and .result.authentication == true and .result.byok_only == true' \
  "$CF_AIG_EVIDENCE_DIR/01-gateway.json" >/dev/null || cf_fail "Gateway identity/authentication/BYOK-only gate failed"
cf_get "$CF_AIG_GATEWAY/routes?per_page=100&page=1" "$CF_AIG_EVIDENCE_DIR/01-routes.json"
jq -e '.data.routes | type == "array"' "$CF_AIG_EVIDENCE_DIR/01-routes.json" >/dev/null ||
  cf_fail "Unrecognized routes response"
for profile in "${CF_AIG_ROUTES[@]}"; do
  route_id="$(cf_route_id "$profile")"
  [[ -n "$route_id" ]] || cf_fail "Missing or duplicated dynamic route: nostromo-$profile"
  [[ "$route_id" =~ ^[a-zA-Z0-9_-]+$ ]] || cf_fail "Invalid route ID"
  printf 'READ route=dynamic/nostromo-%s (present)\n' "$profile"
done
echo 'READ account, gateway and 7 routes: authenticated source readbacks saved outside repository'
