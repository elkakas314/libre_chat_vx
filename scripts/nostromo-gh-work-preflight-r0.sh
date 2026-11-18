#!/usr/bin/env bash
# R0 only. No credentials, token, git mutations, host actions or daemon restarts.
set -euo pipefail
set +x
export GH_PROMPT_DISABLED=1
REPO='elkakas314/libre_chat_vx'
BR='integration/nostromo-canon-20261118-r1'
for bin in gh git; do
  command -v "$bin" >/dev/null 2>&1 || { printf 'CONFIG_GAP=%s_missing\n' "$bin"; exit 2; }
done
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo 'CONFIG_GAP=not_git_checkout'; exit 2; }
LOCAL="$(git rev-parse HEAD)"
CURRENT_BRANCH="$(git symbolic-ref --quiet --short HEAD || printf 'DETACHED')"
REMOTE="$(gh api "repos/$REPO/git/ref/heads/$BR" --jq '.object.sha')"
LOGIN="$(gh api user --jq '.login')"
IS_PRIVATE="$(gh api "repos/$REPO" --jq '.private')"
CAN_PUSH="$(gh api "repos/$REPO" --jq '.permissions.push')"
if [[ ! "$REMOTE" =~ ^[0-9a-f]{40}$ || ! "$LOCAL" =~ ^[0-9a-f]{40}$ ]]; then
  echo 'READBACK_INVALID_SHA'; exit 3
fi
DIRTY_COUNT="$(git status --porcelain=v1 -uno | wc -l | tr -d ' ')"
UNTRACKED_COUNT="$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')"
if git diff --check >/dev/null 2>&1; then DIFF_CHECK='PASS'; else DIFF_CHECK='FAIL'; fi
printf 'REPOSITORY=%s\nBRANCH_TARGET=%s\nGH_LOGIN=%s\nPRIVATE=%s\nPUSH_PERMISSION=%s\nCHECKOUT=%s\nLOCAL_BRANCH=%s\nLOCAL_HEAD=%s\nREMOTE_HEAD=%s\nDIRTY_TRACKED_COUNT=%s\nUNTRACKED_COUNT=%s\nDIFF_CHECK=%s\n' \
  "$REPO" "$BR" "$LOGIN" "$IS_PRIVATE" "$CAN_PUSH" "$ROOT" "$CURRENT_BRANCH" "$LOCAL" "$REMOTE" "$DIRTY_COUNT" "$UNTRACKED_COUNT" "$DIFF_CHECK"
if [[ "$LOCAL" != "$REMOTE" ]]; then echo 'SOURCE_ALIGNMENT=DIFFERENT_RECONCILE_BEFORE_PUSH'; else echo 'SOURCE_ALIGNMENT=SAME_HEAD'; fi
case "$IS_PRIVATE" in
  true) echo 'REPO_VISIBILITY=PRIVATE' ;;
  false) echo 'REPO_VISIBILITY=PUBLIC_SECRET_HISTORY_REVIEW_REQUIRED' ;;
  *) echo 'READBACK_INVALID_VISIBILITY'; exit 3 ;;
esac
if [[ "$CAN_PUSH" != true ]]; then echo 'SECURITY_BOUNDARY=REPO_WRITE_PERMISSION'; exit 4; fi
echo 'PREFLIGHT=READ_ONLY_COMPLETE_NOT_A_LIVE_DEPLOYMENT'
