#!/usr/bin/env bash
# Operator-evidence gate: source identity, untrusted web content, SSRF and cost.
# Does not query providers, charge tokens or change LibreChat configuration.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
wr_start "04-citations-security-cost"
wr_need "01-result.json"; wr_need "02-host-config.json"; wr_need "03-result.json"
: "${WEB_RESEARCH_SECURITY_PROOF_FILE:?Private evidence of safety, permission and cost required}"
[[ -s "$WEB_RESEARCH_SECURITY_PROOF_FILE" ]] || wr_fail "Missing security/cost observations"
wr_obj "$WEB_RESEARCH_SECURITY_PROOF_FILE"
jq -e '
 .schema=="libre-chat-vx.web-research-security-cost-proof.v1" and
 (.observed_at_utc|type=="string") and
 .authenticated_role_web_search_permission_verified==true and
 .unauthorized_role_web_search_denied==true and
 (.role_permission_readback_ref|type=="string" and length>8) and
 (.denied_role_readback_ref|type=="string" and length>8) and
 .untrusted_content_treated_as_data==true and
 .untrusted_content_caused_no_tool_execution==true and
 (.prompt_injection_negative_readback_ref|type=="string" and length>8) and
 .ssrf_private_and_metadata_block_verified==true and
 (.ssrf_policy_readback_ref|type=="string" and length>8) and
 .secrets_not_exfiltrated==true and
 .paid_search_or_scraper_provider_used==false and
 .unauthorized_paid_fallback_used==false and
 .reranker_invoked==false and
 .quota_rate_limit_observed_or_checked==true and
 .zero_provider_charge_verified==true and
 (.provider_account_billing_readback_ref|type=="string" and length>8) and
 (.quota_readback_ref|type=="string" and length>8) and
 .model_inference_route_cost_separately_reconciled==true and
 (.inference_billing_readback_ref|type=="string" and length>8) and
 .citation_source_links_resolved==true and
 .source_text_origin_disclosed==true and
 (.citation_reconciliation_readback_ref|type=="string" and length>8) and
 .config_or_acl_changed_by_canary==false
 ' "$WEB_RESEARCH_SECURITY_PROOF_FILE" >/dev/null ||
 wr_fail "Authenticated ACL/safety/citation/cost proof incomplete or contains unauthorized route"
observed="$(jq -r '.observed_at_utc' "$WEB_RESEARCH_SECURITY_PROOF_FILE")"; wr_fresh "$observed"
jq -n --arg now "$(date -u +%FT%TZ)" '
 {schema:"libre-chat-vx.web-research-security-validate.v1",validated_at_utc:$now,
 supplied_proof_structurally_valid:true,underlying_billing_and_acl_independently_verified:false,
 gate_closed:false}' > "$WR_DIR/04-result.json"
chmod 600 -- "$WR_DIR/04-result.json"
echo 'CHECKED supplied ACL/SSRF/citation/quota/cost structure; admin corroboration still required'
