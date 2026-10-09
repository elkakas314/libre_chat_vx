#!/usr/bin/env bash
# LC-SKILL-SYNC-LIVE: only authenticated GET/read-only local checks.
set -euo pipefail
SS_HOME="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SS_DIR="${SKILL_SYNC_EVIDENCE_DIR:-${XDG_RUNTIME_DIR:-/tmp}/lc-skill-sync-$(id -u)}"
SS_BASE=""
ss_finish() { local rc="$1"; if ((rc==0)); then printf 'PASS %s (READ_ONLY; gate OPEN)\n' "$SS_STEP"; else printf 'FAIL %s (exit=%s)\n' "$SS_STEP" "$rc" >&2; fi; }
ss_fail() { printf 'DETAIL: %s\n' "$1" >&2; exit 1; }
ss_start() {
 SS_STEP="$1"; trap 'ss_finish "$?"' EXIT; umask 077
 for cmd in bash curl jq date git sha256sum find; do command -v "$cmd" >/dev/null 2>&1 || ss_fail "Missing dependency: $cmd"; done
 [[ ! -L "$SS_DIR" ]] || ss_fail "Evidence directory symlink rejected"
 mkdir -p -- "$SS_DIR"; chmod 700 -- "$SS_DIR"
 [[ -d "$SS_DIR" && -w "$SS_DIR" ]] || ss_fail "Evidence directory unavailable"
}
ss_secret() { [[ -n "${!1:-}" ]] || ss_fail "Required secret missing: $1"; }
ss_need() { [[ -s "$SS_DIR/$1" ]] || ss_fail "Prerequisite missing: $1"; }
ss_base() {
 : "${LIBRECHAT_BASE_URL:?LIBRECHAT_BASE_URL required}"
 [[ "$LIBRECHAT_BASE_URL" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]] || ss_fail "LIBRECHAT_BASE_URL must be HTTPS origin only"
 SS_BASE="$LIBRECHAT_BASE_URL"
}
ss_sha() { [[ "$1" =~ ^[a-fA-F0-9]{40}$ ]] || ss_fail "Invalid git_commit_sha/git_blob_sha"; }
ss_get_code() {
 local url="$1" token="$2" dest="$3" temp code
 [[ -n "$token" ]] || ss_fail "Empty request credential"
 [[ "$url" == "$SS_BASE/api/admin/skills/sync/status" ||
    "$url" == "$SS_BASE/api/user" ||
    "$url" =~ ^${SS_BASE}/api/skills/[a-fA-F0-9]{24}$ ||
    "$url" =~ ^https://api.github.com/repos/[A-Za-z0-9_-]+/[A-Za-z0-9_.-]+/git/ref/heads/[A-Za-z0-9_./-]+$ ]] ||
   ss_fail "Unapproved GET URL"
 temp="$(mktemp "$SS_DIR/.read.XXXXXXXX")"
 if ! code="$(curl --proto '=https' --tlsv1.2 --silent --show-error --max-time 45 \
   --request GET --header "Authorization: Bearer $token" \
   --header "Accept: application/json" --output "$temp" --write-out '%{http_code}' "$url")"; then
   rm -f -- "$temp"; ss_fail "Read-only HTTPS request failed"
 fi
 mv -- "$temp" "$dest"; chmod 600 -- "$dest"
 printf '%s\n' "$code"
}
ss_get() {
 local code
 code="$(ss_get_code "$1" "$2" "$3")"
 [[ "$code" == 200 ]] || ss_fail "Expected GET HTTP 200; observed HTTP $code"
 jq -e 'type=="object"' "$3" >/dev/null 2>&1 || ss_fail "GET 200 without JSON object"
}
ss_stage() { [[ "${SKILL_SYNC_STAGE:-}" == 1 || "${SKILL_SYNC_STAGE:-}" == 2 ]] || ss_fail "SKILL_SYNC_STAGE=1 or 2 required"; }
ss_root() {
 SS_ROOT="${SKILLS_REPO_ROOT:-$(cd -- "$SS_HOME/../.." && pwd)}"
 SS_SKILLS="${SKILLS_SOURCE_DIR:-$SS_ROOT/skills}"
 SS_CATALOG="${SKILLS_CATALOG_FILE:-$SS_ROOT/config/skills.current.json}"
 [[ -d "$SS_SKILLS" && -f "$SS_CATALOG" ]] || ss_fail "Skills root or catalog not found"
 git -C "$SS_ROOT" rev-parse --is-inside-work-tree >/dev/null || ss_fail "Not a Git repository"
}
