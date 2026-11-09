#!/usr/bin/env bash
# Reads the actual host-mounted LibreChat YAML; never writes it.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
wr_start "01-read-search-config"
: "${LIBRECHAT_ACTIVE_YAML:=}"
[[ -n "$LIBRECHAT_ACTIVE_YAML" ]] || wr_skip "LIBRECHAT_ACTIVE_YAML unavailable: no authenticated host-mounted config"
[[ "${LIBRECHAT_YAML_MOUNT_CONFIRMED:-}" == YES ]] ||
  wr_skip "YAML mount identity not confirmed by host operator"
[[ -r "$LIBRECHAT_ACTIVE_YAML" && -f "$LIBRECHAT_ACTIVE_YAML" && ! -L "$LIBRECHAT_ACTIVE_YAML" ]] ||
  wr_fail "Real LibreChat YAML is not a readable regular file"
wr_require python3
# PyYAML is an existing dependency requirement on the host; never auto-install.
if ! python3 -c 'import yaml' >/dev/null 2>&1; then
  wr_skip "PyYAML unavailable; no dependencies installed"
fi
[[ -f "$WR_ROOT/SPEC.json" ]] || wr_fail "SPEC.json unavailable"
python3 - "$LIBRECHAT_ACTIVE_YAML" "$WR_DIR/01-result.json" <<'PY'
import datetime
import hashlib
import json
import sys
import yaml

yaml_path, out_path = sys.argv[1:3]
with open(yaml_path, 'rb') as stream:
    raw = stream.read()
config = yaml.safe_load(raw)
if not isinstance(config, dict):
    raise SystemExit('Invalid LibreChat YAML')
ws = config.get('webSearch')
if not isinstance(ws, dict):
    raise SystemExit('Missing webSearch section')
output = {
    'schema': 'libre-chat-vx.web-research-config-readback.v1',
    'searchProvider': ws.get('searchProvider'),
    'scraperProvider': ws.get('scraperProvider'),
    'rerankerType': ws.get('rerankerType'),
    'safeSearch': ws.get('safeSearch'),
    'yaml_sha256': hashlib.sha256(raw).hexdigest(),
    'read_only': True,
    'observed_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'gate_closed': False,
}
with open(out_path, 'w', encoding='utf-8') as stream:
    json.dump(output, stream, indent=2)
    stream.write('\n')
PY
chmod 600 -- "$WR_DIR/01-result.json"
jq -e --slurpfile spec "$WR_ROOT/SPEC.json" '
 .searchProvider==$spec[0].configuracion.librechat_yaml.webSearch.searchProvider and
 .scraperProvider==$spec[0].configuracion.librechat_yaml.webSearch.scraperProvider and
 .rerankerType==$spec[0].configuracion.librechat_yaml.webSearch.rerankerType and
 .safeSearch==$spec[0].configuracion.librechat_yaml.webSearch.safeSearch and
 .searchProvider=="keenable" and .scraperProvider=="keenable" and .rerankerType=="none" and
 .safeSearch==1' "$WR_DIR/01-result.json" >/dev/null ||
  wr_fail "Real YAML differs from SPEC.json required Keenable/none/safeSearch=1"
echo 'READ host YAML: Keenable/none/safeSearch=1; no configuration changed'
