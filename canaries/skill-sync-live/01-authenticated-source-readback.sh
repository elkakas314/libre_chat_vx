#!/usr/bin/env bash
# Authenticated private GitHub GET; stable branch ref + exact commit/tree.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
ss_start "01-github-source"
ss_secret GITHUB_SKILLS_TOKEN
ss_get "$SS_API/git/ref/heads/$SS_REF" "$SS_DIR/01-ref-before.json" "$GITHUB_SKILLS_TOKEN"
commit="$(jq -r '.object.sha // empty' "$SS_DIR/01-ref-before.json")"; ss_sha "$commit"
jq -e '.object.type=="commit" and (.ref|startswith("refs/heads/"))' "$SS_DIR/01-ref-before.json" >/dev/null ||
 ss_fail "Not a GitHub commit ref"
ss_get "$SS_API/git/commits/$commit" "$SS_DIR/01-commit.json" "$GITHUB_SKILLS_TOKEN"
tree="$(jq -r '.tree.sha // empty' "$SS_DIR/01-commit.json")"; ss_sha "$tree"
ss_get "$SS_API/git/trees/$tree?recursive=1" "$SS_DIR/01-tree.json" "$GITHUB_SKILLS_TOKEN"
jq -e --arg sha "$tree" '.sha==$sha and .truncated==false and (.tree|type=="array")' "$SS_DIR/01-tree.json" >/dev/null ||
 ss_fail "Tree mismatched/truncated"
ss_get "$SS_API/git/ref/heads/$SS_REF" "$SS_DIR/01-ref-after.json" "$GITHUB_SKILLS_TOKEN"
[[ "$(jq -r '.object.sha' "$SS_DIR/01-ref-after.json")" == "$commit" ]] || ss_fail "Branch moved during probe"
jq -n --arg ref "$SS_REF" --arg commit "$commit" --arg tree "$tree" --arg now "$(date -u +%FT%TZ)" '
 {schema:"libre-chat-vx.skill-sync-source.v1",repository:"elkakas314/libre_chat_vx",ref:$ref,
 git_commit_sha:$commit,git_tree_sha:$tree,observed_at_utc:$now,
 authenticated_private_repo_readback:true,token_readonly_scope_verified:false}' > "$SS_DIR/01-source.json"
chmod 600 -- "$SS_DIR/01-source.json"
echo "READ stable GitHub source ref=$SS_REF; git_commit_sha=$commit; git_tree_sha=$tree"
echo 'Token permission scope needs operator corroboration; SOURCE not LIVE'
