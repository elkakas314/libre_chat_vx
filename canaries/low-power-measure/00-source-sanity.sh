#!/usr/bin/env bash
# Fast offline check; NEVER starts services, chats or benchmarks.
set -euo pipefail
here="$(cd -- "$(dirname -- "$0")" && pwd)"
root="$(cd -- "$here/../.." && pwd)"
for script in "$here"/*.sh; do
  bash -n "$script"
  grep -Eq '^[[:space:]]*set -euo pipefail[[:space:]]*$' "$script"
done
command -v jq >/dev/null
for doc in "$here"/*.json "$here"/expected-outputs/*.json; do
  jq -e 'type=="object"' "$doc" >/dev/null
done
jq -e '.gate_id=="LC-LOW-POWER-MEASURE" and .gate_type=="GATE_HUMAN" and .gate_closed==false' "$here/evidence-template.json" >/dev/null
jq -e '.backlog.active_live|any(.[]; .id=="LC-LOW-POWER-MEASURE" and .estado_gate=="GATE_HUMAN")' "$root/SPEC.json" >/dev/null
jq -e '.rendimiento.metricas|any(.[]; .nombre=="CPU_idle_y_activo" and .valor==null)' "$root/SPEC.json" >/dev/null
[[ "$(env -u LOWPOWER_ALLOW_STARTUP bash "$here/02-load-scenario-librechat-startup.sh" | tail -n1)" == 'SKIP 02-load-scenario-librechat-startup: LOWPOWER_ALLOW_STARTUP=YES required' ]]
echo 'PASS 00-source-sanity (offline; benchmark NOT run; human gate OPEN)'
