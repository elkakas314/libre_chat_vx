#!/usr/bin/env bash
# NOSTROMO 2026-11-11: verify four PRs sequentially, with no --apply.
# git fetch/fast-forward and detached checkout only. No Actions/services/npm install.
set -uo pipefail
VX="$HOME/librechat/vx"
cd "$VX" || exit 2
if [[ "$(git branch --show-current)" != main ]] ||
   [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo 'BLOCKED: expected clean tracked main; preserving unique local work'
  exit 2
fi
trap 'git switch -q main >/dev/null 2>&1 || true' EXIT
git pull --ff-only origin main || { echo 'BLOCKED: fast-forward'; exit 2; }
MAIN="$(git rev-parse HEAD)"
echo "MAIN_BEFORE=$MAIN"
run_pr() {
  local label="$1" branch="$2" expected="$3" failed=0
  echo "===== $label / FETCH ====="
  if [[ "$(git branch --show-current)" != main ]]; then
    echo "$label MAIN_NOT_RESTORED"; exit 2
  fi
  git fetch --no-tags origin "refs/heads/$branch" || { echo "$label FETCH_FAILED"; return 1; }
  if [[ "$(git rev-parse FETCH_HEAD)" != "$expected" ]]; then
    echo "$label HEAD_MISMATCH: no ejecutar una revision distinta"; return 1
  fi
  git switch -q --detach FETCH_HEAD || { echo "$label CHECKOUT_BLOCKED"; return 1; }
  case "$label" in
    PR34)
      npm run nostromo:frontend:deps:repair:test || failed=1
      if (( failed == 0 )); then
        npm run nostromo:runtime:npm11:preview || failed=1
        npm run nostromo:frontend:deps:repair || failed=1
      fi
      ;;
    PR35)
      npm run nostromo:wiring:test || failed=1
      if (( failed == 0 )); then
        npm run nostromo:wiring:inspect || failed=1
        npm run nostromo:wiring:config:preview || failed=1
      fi
      ;;
    PR36)
      npm run nostromo:backups:test || failed=1
      if (( failed == 0 )); then
        npm run nostromo:backups:audit || failed=1
      fi
      ;;
    PR31)
      npm run nostromo:visual:test || failed=1
      if (( failed == 0 )); then
        npm run nostromo:visual:preview || failed=1
      fi
      ;;
    *) failed=1 ;;
  esac
  git switch -q main || { echo "$label RESTORE_MAIN_FAILED"; exit 2; }
  if (( failed )); then echo "$label BLOCKED"; else echo "$label SOURCE_CANARY_PASS_NOT_E2E"; fi
  return "$failed"
}
run_pr PR34 fix/nostromo-frontend-devdeps-guarded-20261111 d8809dbcf18987211edb4b0327c9bc9580f10788; R34=$?
run_pr PR35 feat/nostromo-native-wiring-gates-20261111 ab478c6914abd896b089aaf548ab4848a55c71f2; R35=$?
run_pr PR31 audit/nostromo-visual-and-local-trees-20261110 983229e69c7a5e8f8d2c425736a2effc9116830b; R31=$?
run_pr PR36 fix/nostromo-backup-forensics-r0-20261111 3adf801fef4c45ba8111844e6e9fdc505e32fdc5; R36=$?
if [[ "$(git branch --show-current)" != main ]] ||
   [[ "$(git rev-parse HEAD)" != "$MAIN" ]]; then
  echo 'MAIN_READBACK_BLOCKED'; exit 2
fi
echo "MAIN_RESTORED=$MAIN"
echo "PR34_RC=$R34 PR35_RC=$R35 PR31_RC=$R31 PR36_RC=$R36"
if (( R34 || R35 || R31 || R36 )); then
  echo 'SOURCE_CANARIES_PARTIAL_OR_BLOCKED - no apply'
  exit 1
fi
echo 'SOURCE_CANARIES_ALL_PASS - no host E2E claim'
