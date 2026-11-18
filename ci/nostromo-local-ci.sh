#!/usr/bin/env bash
# Manual, serialized local SOURCE CI. No service, host, OAuth, or GitHub Actions writes.
set -euo pipefail
set +x

ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")/.." rev-parse --show-toplevel)"
EXPECTED_SHA="${1:-}"
if [[ ! "$EXPECTED_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo 'USAGE: ci/nostromo-local-ci.sh <expected-40-char-SHA>' >&2
  exit 2
fi
cd "$ROOT"
ACTUAL_SHA="$(git rev-parse HEAD)"
if [[ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]]; then
  echo "EXACT_SHA_MISMATCH expected=$EXPECTED_SHA actual=$ACTUAL_SHA" >&2
  exit 3
fi

RECEIPT_DIR="$ROOT/operating/sync-receipts"
mkdir -p "$RECEIPT_DIR"
LOCK_PATH="$(git rev-parse --git-path nostromo-local-ci.lock)"
exec 9>"$LOCK_PATH"
if ! flock -n 9; then
  echo 'LOCAL_CI_LOCK_BUSY' >&2
  exit 4
fi

SHORT_SHA="${EXPECTED_SHA:0:12}"
LOG="$RECEIPT_DIR/local-ci-$SHORT_SHA.log"
METRICS="$(mktemp)"
RESULT='FAIL'
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
MONITOR_PID=''

cpu_ticks() {
  awk '/^cpu / { total=0; for(i=2;i<=NF;i++) total+=$i; idle=$5+$6; printf "total=%d idle=%d", total, idle }' /proc/stat 2>/dev/null || printf 'unavailable'
}

snapshot() {
  local stamp
  stamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  {
    printf '\nRESOURCE_SAMPLE %s cpu_ticks=' "$stamp"
    cpu_ticks
    printf '\n'
    awk '/^(MemTotal|MemAvailable|SwapTotal|SwapFree):/ {printf "%s=%s%s ", $1, $2, $3}' /proc/meminfo 2>/dev/null || true
    printf '\n'
    for pressure in cpu memory; do
      if [[ -r "/proc/pressure/$pressure" ]]; then
        printf 'PSI_%s ' "$pressure"
        tr '\n' ';' < "/proc/pressure/$pressure"
        printf '\n'
      fi
    done
    if command -v ps >/dev/null 2>&1; then
      ps -eo pid,pcpu,rss,comm --sort=-pcpu 2>/dev/null | head -n 8 || true
    fi
  } >> "$METRICS"
}

finish() {
  local status=$?
  if [[ -n "$MONITOR_PID" ]]; then
    kill "$MONITOR_PID" 2>/dev/null || true
    wait "$MONITOR_PID" 2>/dev/null || true
  fi
  snapshot
  {
    printf 'LOCAL_CI expected_sha=%s started=%s result=%s exit_code=%s\n' \
      "$EXPECTED_SHA" "$STARTED_AT" "$RESULT" "$status"
    cat "$METRICS"
  } | sed -E \
    -e 's/(Bearer[[:space:]]+)[A-Za-z0-9._~+\/-]+/\1[REDACTED]/g' \
    -e 's/(github_pat_|gho_|ghp_)[A-Za-z0-9_]{8,}/[REDACTED]/g' \
    -e 's/(sk-[A-Za-z0-9_-]{8,})/[REDACTED]/g' >> "$LOG"
  rm -f "$METRICS"
  cat > "$RECEIPT_DIR/local-ci-$SHORT_SHA.json" <<EOF
{
  "head": "$EXPECTED_SHA",
  "startedAt": "$STARTED_AT",
  "result": "$RESULT",
  "exitCode": $status,
  "log": "operating/sync-receipts/local-ci-$SHORT_SHA.log",
  "scope": ["npm test", "MCP stdio/package suite"],
  "hostRuntimeModified": false,
  "githubActions": false
}
EOF
  exit "$status"
}
trap finish EXIT

: > "$LOG"
echo "LOCAL_CI_BEGIN sha=$EXPECTED_SHA" | tee -a "$LOG"
snapshot
(
  while sleep 2; do snapshot; done
) >> "$METRICS" 2>/dev/null &
MONITOR_PID=$!

run_step() {
  local label="$1"; shift
  echo "STEP_BEGIN $label" | tee -a "$LOG"
  if "$@" 2>&1 | sed -E \
      -e 's/(Bearer[[:space:]]+)[A-Za-z0-9._~+\/-]+/\1[REDACTED]/g' \
      -e 's/(github_pat_|gho_|ghp_)[A-Za-z0-9_]{8,}/[REDACTED]/g' \
      -e 's/(sk-[A-Za-z0-9_-]{8,})/[REDACTED]/g' | tee -a "$LOG"; then
    echo "STEP_PASS $label" | tee -a "$LOG"
  else
    local status=$?
    echo "STEP_FAIL $label exit_code=$status" | tee -a "$LOG"
    exit "$status"
  fi
}

run_step source-suite npm test
run_step mcp-suite npm --prefix deployment/nostromo-mcp test
if [[ "$(git rev-parse HEAD)" != "$EXPECTED_SHA" ]]; then
  echo 'EXACT_SHA_CHANGED_DURING_TEST' | tee -a "$LOG"
  exit 5
fi
RESULT='PASS'
echo "LOCAL_CI_PASS sha=$EXPECTED_SHA" | tee -a "$LOG"
