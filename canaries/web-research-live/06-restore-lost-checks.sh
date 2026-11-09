#!/usr/bin/env bash
set -euo pipefail

source "$(dirname -- "$0")/lib.sh"
wr_start "06-restore-lost-checks"

# Exigir configuración real del host previamente validada.
wr_safe_baseline

[[ "${LIBRECHAT_YAML_MOUNT_CONFIRMED:-}" == YES ]] ||
  wr_skip "YAML del host no confirmado"

[[ -n "${LIBRECHAT_ACTIVE_YAML:-}" ]] ||
  wr_skip "No disponible el YAML real"

[[ -f "$LIBRECHAT_ACTIVE_YAML" &&
   -r "$LIBRECHAT_ACTIVE_YAML" &&
   ! -L "$LIBRECHAT_ACTIVE_YAML" ]] ||
  wr_fail "YAML del host no válido"

wr_require python3

python3 -c 'import yaml' >/dev/null 2>&1 ||
  wr_skip "PyYAML no disponible; no instalar dependencias"

# Comprobar que no ha cambiado el YAML desde el paso 01.
actual_sha="$(sha256sum "$LIBRECHAT_ACTIVE_YAML" |
  cut -d ' ' -f1)"

jq -e --arg sha "$actual_sha"   '.yaml_sha256==$sha'   "$WR_DIR/01-result.json" >/dev/null ||
  wr_fail "El YAML cambió después del readback"

# Inspección local sin publicar valores de secretos.
python3 - "$LIBRECHAT_ACTIVE_YAML"   "$WR_DIR/06-host-security.json" <<'PY'
import json
import sys
import yaml

source_path, output_path = sys.argv[1:]

with open(source_path, encoding="utf-8") as f:
    config = yaml.safe_load(f)

if not isinstance(config, dict):
    raise SystemExit("Invalid LibreChat configuration")

ws = config.get("webSearch")
if not isinstance(ws, dict):
    raise SystemExit("Missing webSearch configuration")

paid_keys = (
    "serperApiKey",
    "tavilyApiKey",
    "firecrawlApiKey",
    "jinaApiKey",
    "cohereApiKey",
)

endpoint_overrides = (
    "searxngInstanceUrl",
    "firecrawlApiUrl",
    "jinaApiUrl",
    "tavilySearchUrl",
    "tavilyExtractUrl",
    "keenableApiUrl",
)

result = {
    "paid_provider_config_present":
        any(bool(ws.get(k)) for k in paid_keys),
    "ssrf_exemptions_present":
        bool(ws.get("allowedAddresses")),
    "endpoint_override_present":
        any(bool(ws.get(k)) for k in endpoint_overrides),
}

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(result, f)
PY

chmod 600 "$WR_DIR/06-host-security.json"

jq -e '
  .paid_provider_config_present==false and
  .ssrf_exemptions_present==false and
  .endpoint_override_present==false
' "$WR_DIR/06-host-security.json" >/dev/null ||
  wr_fail "Proveedor pagado, excepción SSRF u override detectado"

# Evidencias externas: no realizar acciones materiales.
proof="${WEB_RESEARCH_SECURITY_PROOF_FILE:-}"

[[ -n "$proof" && -f "$proof" && -r "$proof" &&
   -s "$proof" ]] ||
  wr_skip "Sin evidencias autenticadas de seguridad y facturación"

wr_json "$proof"

jq -e '
  .schema=="libre-chat-vx.web-research-security-cost-proof.v1"
  and .ssrf_private_and_metadata_block_verified==true
  and (.ssrf_policy_readback_ref|type=="string" and length>8)
  and .paid_search_or_scraper_provider_used==false
  and .unauthorized_paid_fallback_used==false
  and .reranker_invoked==false
  and .quota_rate_limit_observed_or_checked==true
  and .zero_provider_charge_verified==true
  and (.provider_account_billing_readback_ref|
       type=="string" and length>8)
  and (.quota_readback_ref|type=="string" and length>8)
  and .model_inference_route_cost_separately_reconciled==true
  and (.inference_billing_readback_ref|
       type=="string" and length>8)
  and .untrusted_content_treated_as_data==true
  and .untrusted_content_caused_no_tool_execution==true
  and (.prompt_injection_negative_readback_ref|
       type=="string" and length>8)
  and .secrets_not_exfiltrated==true
  and .config_or_acl_changed_by_canary==false
  and (.observed_at_utc|type=="string")
' "$proof" >/dev/null ||
  wr_fail "Evidencia de seguridad, cuotas o facturación incompleta"

wr_fresh "$(jq -r '.observed_at_utc' "$proof")"

echo "Validación estructural completada; "
echo "autenticidad LIVE pendiente de corroboración"
