#!/usr/bin/env bash
# Synthetic streaming request. No real prompts and no access to external services.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
lp_start "04-load-scenario-streaming"
[[ -n "${LOWPOWER_CHAT_TOKEN:-}" ]] ||
  lp_skip "LOWPOWER_CHAT_TOKEN test credential absent"
[[ "${LOWPOWER_EPHEMERAL_TEST_CONFIRMED:-}" == YES ]] ||
  lp_skip "Test endpoint must be operator-confirmed ephemeral and isolated"
url="${LOWPOWER_STREAM_ENDPOINT:-}"
[[ -n "$url" ]] || lp_skip "LOWPOWER_STREAM_ENDPOINT not configured"
lp_loopback "$url"
[[ "$LOWPOWER_CHAT_TOKEN" =~ ^[a-zA-Z0-9._~+/=-]+$ ]] ||
  lp_fail "Unsafe test credential characters"
lp_require curl
seconds="$(lp_seconds)"
auth="$(mktemp "$LP_DIR/.auth-04.XXXXXXXX")"
body="$(mktemp "$LP_DIR/.body-04.XXXXXXXX")"
response="$(mktemp "$LP_DIR/.resp-04.XXXXXXXX")"
stopflag="$LP_DIR/.stop-stream-04-$BASHPID"
pid=""
cleanup() {
  local rc="$1"
  : > "$stopflag"
  if [[ -n "$pid" ]]; then wait "$pid" >/dev/null 2>&1 || rc=1; fi
  rm -f -- "$stopflag" "$auth" "$body" "$response"
  lp_finish "$rc"
}
trap 'cleanup "$?"' EXIT
printf 'header = "Authorization: Bearer %s"\n' "$LOWPOWER_CHAT_TOKEN" > "$auth"
printf '%s\n' '{"prompt":"Count from one to five.","stream":true,"benchmark":true}' > "$body"
chmod 600 "$auth" "$body" "$response"
lp_sample "$seconds" "$LP_DIR/04-streaming.json" "STREAMING" "$stopflag" &
pid="$!"
timings="$(curl --config "$auth" --noproxy '*' --silent --show-error --no-buffer --max-time "$((seconds+30))"   --connect-timeout 5 --request POST --header 'Accept: text/event-stream'   --header 'Content-Type: application/json' --data-binary "@$body"   --output "$response" --write-out '%{http_code} %{time_total} %{time_starttransfer}' "$url")" ||
    lp_fail "Test stream transport failed"
read -r code elapsed firstbyte <<< "$timings"
[[ "$code" == 200 ]] || lp_fail "Streaming endpoint HTTP $code, expected 200"
grep -q '^data: ' "$response" || lp_fail "No SSE data frames in test stream"
: > "$stopflag"
wait "$pid" || lp_fail "Metrics sampler failed"
pid=""
lp_add_latency "$LP_DIR/04-streaming.json" "$elapsed" "$firstbyte" "synthetic_sse_stream_total"
echo 'MEASURED synthetic stream; first_byte_ms is NOT independently verified TTFT'
