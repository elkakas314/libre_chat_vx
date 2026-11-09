#!/usr/bin/env bash
# Synthetic, test-only request. No real prompt, conversation, ID or production data.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
lp_start "03-load-scenario-single-chat"
[[ -n "${LOWPOWER_CHAT_TOKEN:-}" ]] ||
  lp_skip "LOWPOWER_CHAT_TOKEN test credential absent"
[[ "${LOWPOWER_EPHEMERAL_TEST_CONFIRMED:-}" == YES ]] ||
  lp_skip "Test endpoint must be operator-confirmed ephemeral and isolated"
url="${LOWPOWER_CHAT_ENDPOINT:-}"
[[ -n "$url" ]] || lp_skip "LOWPOWER_CHAT_ENDPOINT not configured"
lp_loopback "$url"
[[ "$LOWPOWER_CHAT_TOKEN" =~ ^[a-zA-Z0-9._~+/=-]+$ ]] ||
  lp_fail "Unsafe test credential characters"
lp_require curl;lp_require jq
seconds="$(lp_seconds)"
auth="$(mktemp "$LP_DIR/.auth-03.XXXXXXXX")"
body="$(mktemp "$LP_DIR/.body-03.XXXXXXXX")"
response="$(mktemp "$LP_DIR/.resp-03.XXXXXXXX")"
stopflag="$LP_DIR/.stop-chat-03-$BASHPID"
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
printf '%s\n' '{"prompt":"Reply with OK only.","stream":false,"benchmark":true}' > "$body"
chmod 600 "$auth" "$body" "$response"
lp_sample "$seconds" "$LP_DIR/03-chat.json" "SINGLE_CHAT" "$stopflag" &
pid="$!"
timings="$(curl --config "$auth" --noproxy '*' --silent --show-error --max-time "$((seconds+30))"   --connect-timeout 5 --request POST --header 'Content-Type: application/json'   --data-binary "@$body" --output "$response"   --write-out '%{http_code} %{time_total} %{time_starttransfer}' "$url")" ||
    lp_fail "Test chat transport failed"
read -r code elapsed firstbyte <<< "$timings"
[[ "$code" == 200 ]] || lp_fail "Test endpoint HTTP $code, expected 200"
jq -e '.answer|type=="string" and length>0' "$response" >/dev/null ||
  lp_fail "Test endpoint returned no JSON answer"
: > "$stopflag"
wait "$pid" || lp_fail "Metrics sampler failed"
pid=""
lp_add_latency "$LP_DIR/03-chat.json" "$elapsed" "$firstbyte" "one_synthetic_question_one_answer"
echo "MEASURED synthetic single chat only; isolated ephemeral endpoint"
