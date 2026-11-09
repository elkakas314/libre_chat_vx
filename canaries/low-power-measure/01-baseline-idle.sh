#!/usr/bin/env bash
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
lp_start "01-baseline-idle"
seconds="$(lp_seconds)"
lp_snapshot idle
lp_sample "$seconds" "$LP_DIR/01-idle.json" "IDLE" "$LP_DIR/.never-stop-idle"
echo "MEASURED idle: $seconds seconds; JSON private"
