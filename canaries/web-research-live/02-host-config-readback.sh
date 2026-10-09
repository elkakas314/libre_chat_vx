#!/usr/bin/env bash
# Parse the on-host active LibreChat YAML, extracting ONLY non-secret fields.
# Operator must confirm the file is the actually mounted configuration.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
wr_start "02-host-web-search-config"; wr_need "01-result.json"
wr_require python3
: "${LIBRECHAT_ACTIVE_YAML:?Full path to deployed LibreChat YAML required}"
[[ "${WEB_RESEARCH_CONFIG_PATH_CONFIRMED:-}" == YES ]] ||
 wr_fail "Operator has not confirmed exact host-mounted LibreChat YAML path"
[[ -r "$LIBRECHAT_ACTIVE_YAML" && -f "$LIBRECHAT_ACTIVE_YAML" ]] ||
 wr_fail "Mounted LibreChat config not readable"
[[ -f "$WR_ROOT/SPEC.json" ]] || wr_fail "Canonical SPEC.json unavailable in checkout"
# Requires python3 + PyYAML on the host. Never print/store the raw YAML.
python3 - "$LIBRECHAT_ACTIVE_YAML" "$WR_DIR/02-host-config.json" <<'PY'
import datetime
import hashlib
import json
import sys
try:
    import yaml
except ImportError:
    raise SystemExit("PyYAML missing: host must provide it; no auto-install")
path, outfile = sys.argv[1:3]
with open(path, "rb") as handle:
    raw = handle.read()
conf = yaml.safe_load(raw)
if not isinstance(conf, dict) or not isinstance(conf.get("webSearch"), dict):
    raise SystemExit("Host YAML has no effective webSearch object")
ws = conf["webSearch"]
summary = {
    "schema": "libre-chat-vx.web-research-host-config.v1",
    "searchProvider": ws.get("searchProvider"),
    "scraperProvider": ws.get("scraperProvider"),
    "rerankerType": ws.get("rerankerType"),
    "safeSearch": ws.get("safeSearch"),
    "webSearchHasAddressExemptions": bool(ws.get("allowedAddresses")),
    "providerEndpointOverridePresent": any(bool(ws.get(k)) for k in (
        "keenableApiUrl", "keenableFetchUrl", "searxngInstanceUrl",
        "firecrawlApiUrl", "tavilySearchUrl", "tavilyExtractUrl")),
    "paidProviderConfigured": any(bool(ws.get(k)) for k in (
        "serperApiKey", "tavilyApiKey", "firecrawlApiKey",
        "jinaApiKey", "cohereApiKey")),
    "mounted_config_sha256": hashlib.sha256(raw).hexdigest(),
    "operator_confirms_mount": True,
    "observed_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "gate_closed": False
}
with open(outfile, "w", encoding="utf-8") as handle:
    json.dump(summary, handle, indent=2)
    handle.write("\n")
PY
chmod 600 -- "$WR_DIR/02-host-config.json"
jq -e --slurpfile spec "$WR_ROOT/SPEC.json" '
 .searchProvider==$spec[0].configuracion.librechat_yaml.webSearch.searchProvider and
 .scraperProvider==$spec[0].configuracion.librechat_yaml.webSearch.scraperProvider and
 .rerankerType==$spec[0].configuracion.librechat_yaml.webSearch.rerankerType and
 (.safeSearch|type=="number") and
 .safeSearch==$spec[0].configuracion.librechat_yaml.webSearch.safeSearch and
 .webSearchHasAddressExemptions==false and
 .providerEndpointOverridePresent==false and .paidProviderConfigured==false
 ' "$WR_DIR/02-host-config.json" >/dev/null ||
 wr_fail "Mounted host YAML differs from keyless/SSRF-safe SOURCE policy"
echo 'READ host-mounted YAML summary (no secrets); provider/keyless/safeSearch match SOURCE'
