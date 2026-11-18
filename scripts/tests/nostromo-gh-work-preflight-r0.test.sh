#!/usr/bin/env bash
# Deterministic, offline contract tests for the read-only GitHub preflight.
set -euo pipefail
script="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/nostromo-gh-work-preflight-r0.sh"
bin="$(mktemp -d)"
trap 'rm -rf "$bin"' EXIT
cat > "$bin/git" <<'SH'
#!/usr/bin/env bash
case "${1:-} ${2:-}" in
  'rev-parse --show-toplevel') printf '/isolated/nostromo-source\n' ;;
  'rev-parse HEAD') printf '%040d\n' 1 ;;
  'symbolic-ref --quiet') printf 'integration/nostromo-canon-20261118-r1\n' ;;
  'status --porcelain=v1') : ;;
  'ls-files --others') : ;;
  'diff --check') exit 0 ;;
  *) echo 'unexpected git invocation' >&2; exit 11 ;;
esac
SH
cat > "$bin/gh" <<'SH'
#!/usr/bin/env bash
case "${1:-} ${2:-}" in
  'api repos/elkakas314/libre_chat_vx/git/ref/heads/integration/nostromo-canon-20261118-r1') printf '%040d\n' 1 ;;
  'api user') printf 'elkakas314\n' ;;
  'api repos/elkakas314/libre_chat_vx')
    if [[ "${4:-}" == '.private' ]]; then printf '%s\n' "${TEST_PRIVATE:-false}";
    elif [[ "${4:-}" == '.permissions.push' ]]; then printf '%s\n' "${TEST_PUSH:-true}";
    else exit 12; fi ;;
  *) echo 'unexpected gh invocation' >&2; exit 13 ;;
esac
SH
chmod +x "$bin/gh" "$bin/git"
run_case(){
  local privacy="$1" push="$2" expected_code="$3" expected_label="$4" got=0 out
  out="$(PATH="$bin:$PATH" TEST_PRIVATE="$privacy" TEST_PUSH="$push" bash "$script")" || got=$?
  [[ "$got" == "$expected_code" ]] || { echo "FAIL case privacy=$privacy push=$push: code $got != $expected_code" >&2; exit 1; }
  [[ "$out" == *"$expected_label"* ]] || { echo "FAIL case privacy=$privacy push=$push: label missing" >&2; exit 1; }
}
run_case true true 0 REPO_VISIBILITY=PRIVATE
run_case false true 0 REPO_VISIBILITY=PUBLIC_SECRET_HISTORY_REVIEW_REQUIRED
run_case false false 4 SECURITY_BOUNDARY=REPO_WRITE_PERMISSION
run_case unknown true 3 READBACK_INVALID_VISIBILITY
echo 'PRE-FLIGHT MOCK TEST: 4/4 PASS (no GitHub/host access)'
