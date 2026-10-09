#!/usr/bin/env bash
# Objetivo: read Cloudflare cost logs and verify provider-specific, fresh authenticated quota/cost proofs.
# Prerequisitos: successful 01 and 02; real provider readbacks in CF_AIG_PROVIDER_PROOF_FILE.
# NO hace: infer 'free' from Cloudflare HTTP 200, create keys, purchase quota, or modify Cloudflare.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
cf_start "04-quota-and-cost"
cf_check_file "01-gateway.json"
cf_check_file "02-route-models.json"
jq -e '.result.authentication==true and .result.byok_only==true' \
  "$CF_AIG_EVIDENCE_DIR/01-gateway.json" >/dev/null || cf_fail "Gateway protections not verified"
# Logs are estimates, not provider quota readback. They cannot independently prove free usage.
cf_get "$CF_AIG_GATEWAY/logs?per_page=10" "$CF_AIG_EVIDENCE_DIR/04-gateway-logs.json"
jq -e '.result | type == "array"' "$CF_AIG_EVIDENCE_DIR/04-gateway-logs.json" >/dev/null ||
  cf_fail "Unexpected Gateway logs response"
: "${CF_AIG_PROVIDER_PROOF_FILE:?Set CF_AIG_PROVIDER_PROOF_FILE to authenticated provider readback file (outside repo)}"
[[ -f "$CF_AIG_PROVIDER_PROOF_FILE" ]] || cf_fail "Provider proof file absent"
now="$(date -u +%s)"
# This validates supplied evidence structure/freshness; the operator must authenticate and corroborate
# each source_ref against the actual provider account. Local assertions alone never close the LIVE gate.
jq -e --argjson now "$now" --slurpfile actual "$CF_AIG_EVIDENCE_DIR/02-route-models.json" '
  .schema=="librechat-vx.cf-aig-provider-proof.v1" and
  .authenticated_provider_readback==true and .permissions_verified==true and
  (.observed_at_epoch|type=="number" and . <= $now and . >= ($now-300)) and
  (.models|type=="array") and
  (.models as $proofs |
    all($actual[0].routes[].models[]; . as $node |
      any($proofs[];
        .provider == $node.provider and .model == $node.model and
        .zero_cost_verified == true and .paid_fallback_allowed == false and
        (.quota_remaining | type=="number" and . > 0) and
        (.unit_cost_usd | type=="number" and . == 0) and
        (.source_ref | type=="string" and length > 8) and
        (.scope_verified == true) and
        (.observed_at_epoch | type=="number" and . <= $now and . >= ($now-300))
      )
    )
  )' "$CF_AIG_PROVIDER_PROOF_FILE" >/dev/null ||
  cf_fail "Provider quota/free/privacy scope evidence incomplete, stale or billable"
jq -n --argjson observed "$now" --slurpfile routes "$CF_AIG_EVIDENCE_DIR/02-route-models.json" \
  '{schema:"librechat-vx.cf-aig-preflight.v1",evaluated_at_epoch:$observed,
    provider_proofs_structurally_valid:true,live_gate_closed:false,
    routes:[$routes[0].routes[].route]}' > "$CF_AIG_EVIDENCE_DIR/04-preflight.json"
chmod 600 -- "$CF_AIG_EVIDENCE_DIR/04-preflight.json"
echo 'READ Gateway logs and provider attestation checked; operator must corroborate real provider evidence'
echo 'This PASS is preflight only, NOT proof of LIVE or of actual provider billing'
