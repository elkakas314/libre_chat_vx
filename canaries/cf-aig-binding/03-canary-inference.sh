#!/usr/bin/env bash
# Objetivo: bounded streaming chat canary for the seven authenticated dynamic routes.
# Prerequisitos: 01, 02, 04 PASS; real zero-cost quota proofs; CF_AIG_ALLOW_INFERENCE=YES.
# NO hace: deploy/change/delete routes, use wholesale billing, or certify provider free quota from HTTP.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
cf_start "03-inference"
cf_check_file "01-gateway.json"
cf_check_file "02-route-models.json"
cf_check_file "04-preflight.json"
[[ "${CF_AIG_ALLOW_INFERENCE:-NO}" == "YES" ]] ||
  cf_fail "Inference may incur cost; explicit CF_AIG_ALLOW_INFERENCE=YES is required"
jq -e '.result.authentication==true and .result.byok_only==true' \
  "$CF_AIG_EVIDENCE_DIR/01-gateway.json" >/dev/null || cf_fail "Authentication/BYOK-only off"
now="$(date -u +%s)"
jq -e --argjson now "$now" '.provider_proofs_structurally_valid==true and
  .live_gate_closed==false and (.evaluated_at_epoch >= ($now-300)) and
  (.evaluated_at_epoch <= $now) and (.routes|length==7)' \
  "$CF_AIG_EVIDENCE_DIR/04-preflight.json" >/dev/null || cf_fail "Preflight stale/invalid"
# No retries: avoid unexpected multiple billable requests.
for profile in "${CF_AIG_ROUTES[@]}"; do
  model="dynamic/nostromo-$profile"
  body="$(jq -nc --arg model "$model" \
    '{model:$model,messages:[{role:"user",content:"Reply with OK."}],stream:true,max_tokens:12}')"
  response="$CF_AIG_EVIDENCE_DIR/03-$profile-stream.txt"
  headers="$CF_AIG_EVIDENCE_DIR/03-$profile-headers.txt"
  if ! code="$(curl --proto '=https' --tlsv1.2 --silent --show-error --no-buffer \
      --max-time 90 --request POST \
      --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      --header "cf-aig-gateway-id: $CLOUDFLARE_AI_GATEWAY_ID" \
      --header "cf-aig-no-wholesale: true" \
      --header "Content-Type: application/json" \
      --header "Accept: text/event-stream" \
      --data "$body" \
      --dump-header "$headers" --output "$response" --write-out '%{http_code}' \
      "$CF_AIG_BASE/ai/v1/chat/completions")"; then
    cf_fail "Transport failure: $model"
  fi
  [[ "$code" == 200 ]] || cf_fail "$model returned HTTP=$code"
  grep -q '^data:' "$response" || cf_fail "$model returned no SSE frames"
  grep -qE '^data:[[:space:]]*\[DONE\]' "$response" || cf_fail "$model stream incomplete"
  grep -q '^data:.*"error"' "$response" && cf_fail "$model SSE contains error"
  log_id="$(awk 'BEGIN{IGNORECASE=1} {sub(/\r$/, "", $0); if (tolower($0) ~ /^cf-aig-log-id:/) { sub(/^[^:]+:[[:space:]]*/, "", $0); print; exit }}' "$headers")"
  [[ "$log_id" =~ ^[a-zA-Z0-9_-]+$ ]] || cf_fail "No trustworthy Gateway log ID for $model"
  cf_get "$CF_AIG_GATEWAY/logs/$log_id" "$CF_AIG_EVIDENCE_DIR/03-$profile-log.json"
  jq -e '.result.success==true and (.result.cost|type=="number" and .==0)
    and (.result.custom_cost != true)' "$CF_AIG_EVIDENCE_DIR/03-$profile-log.json" >/dev/null ||
    cf_fail "Estimated Gateway cost not provably zero for $model"
  echo "STREAM $model: SSE complete, authenticated log cost estimate zero"
done
echo 'All seven SSE canaries completed; provider account billing/quota still needs authenticated final readback'
