#!/usr/bin/env bash
# LC-M3-GAP-001 external interface not evidenced in examined MANOJOS3 SOURCE.
# Do not discover, guess, ping, synthesize or call MANOJOS3 host-control/MCP/HTTP.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
ae_start "05-manojos3-external"
jq -e '.backlog.deferred_external|any(.[];
 type=="object" and .id=="LC-M3-GAP-001" and .estado=="BLOQUEADO" and
 (.bloquea|index("LC-AGENT-EVENTS-LIVE")))' "$AE_ROOT/SPEC.json" >/dev/null ||
 ae_fail "Canonical blocker missing or changed: re-evaluate SOURCE before LIVE"
ae_skip "LC-M3-GAP-001 BLOQUEADO: no verified MANOJOS3 GET /v1/events, stream or subscription; cannot close gate"
