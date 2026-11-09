#!/usr/bin/env bash
# Run only on the owned LibreChat VX host; never changes Tailscale configuration.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
tm_start "01-host-serve-readback"
tm_require tailscale; tm_require curl
tm_capture "$TM_DIR/01-tailnet-host.json" tailscale status --json
tm_capture "$TM_DIR/01-serve-before.json" tailscale serve status --json
# A separate Funnel status check catches public exposure not visible in some Serve schemas.
tm_capture "$TM_DIR/01-funnel-status.json" tailscale funnel status --json
jq -e '.BackendState=="Running" and (.Self.DNSName|type=="string" and endswith(".ts.net.")) and
 (.Self.Online==true) and (.CurrentTailnet|type=="object")' "$TM_DIR/01-tailnet-host.json" >/dev/null ||
 tm_fail "Tailscale host not online with MagicDNS tailnet identity"
# Serve and Funnel JSON shapes are version dependent: search nested Proxy values, reject enabled public ingress.
jq -e '[..|objects|.Proxy? // empty]|any(.=="http://127.0.0.1:3080")' "$TM_DIR/01-serve-before.json" >/dev/null ||
 tm_fail "No exact LibreChat VX Serve proxy to loopback 127.0.0.1:3080"
jq -e '([..|objects|.AllowFunnel? // empty]|map(if type=="object" then [.[]]|any(.==true) else .==true end)|any(.==true))|not' "$TM_DIR/01-serve-before.json" >/dev/null ||
 tm_fail "Serve configuration contains enabled Funnel/public ingress"
jq -e '([..|objects|.AllowFunnel? // empty]|map(if type=="object" then [.[]]|any(.==true) else .==true end)|any(.==true))|not' "$TM_DIR/01-funnel-status.json" >/dev/null ||
 tm_fail "Funnel public ingress is enabled"
# Loopback HTTP only, a single GET; never contact any target/MCP/host-control port.
code="$(curl --noproxy '*' --silent --show-error --connect-timeout 5 --max-time 12 \
 --request GET --output "$TM_DIR/01-local-response" --write-out '%{http_code}' \
 'http://127.0.0.1:3080/')" || tm_fail "LibreChat loopback backend is unreachable"
[[ "$code" == 200 || "$code" == 301 || "$code" == 302 || "$code" == 303 || "$code" == 401 ]] ||
 tm_fail "Unexpected local LibreChat backend HTTP=$code"
chmod 600 -- "$TM_DIR/01-local-response"
host_dns="$(jq -r '.Self.DNSName' "$TM_DIR/01-tailnet-host.json")"
tm_https "https://${host_dns%.}"
jq -n --arg dns "$host_dns" --arg now "$(date -u +%FT%TZ)" --arg code "$code" '
 {schema:"libre-chat-vx.tailscale-host-readback.v1",host_magicdns:$dns,
 private_serve_target:"http://127.0.0.1:3080",local_http_status:$code,
 serve_snapshot_path:"01-serve-before.json",funnel_status_path:"01-funnel-status.json",
 observed_at_utc:$now,config_modified:false,live_gate_closed:false}' > "$TM_DIR/01-result.json"
chmod 600 -- "$TM_DIR/01-result.json"
echo 'READ host tailnet+Serve+Funnel; LibreChat loopback present; NO configuration modified'
