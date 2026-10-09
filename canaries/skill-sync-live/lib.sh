#!/usr/bin/env bash
# LC-SKILL-SYNC-LIVE read-only helpers. Never print bearer secrets.
set -euo pipefail
SS_HOME="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SS_DIR="${LC_SKILL_EVIDENCE_DIR:-${XDG_RUNTIME_DIR:-/tmp}/lc-skill-sync-$(id -u)}"
SS_API=""
SS_REF="${LC_SKILL_SOURCE_REF:-}"
SS_BASE_URL="${LC_BASE_URL:-}"
ss_finish() { local rc="$1"; if ((rc==0)); then printf 'PASS %s (probe only; LIVE gate OPEN)\n' "$SS_STEP"; else printf 'FAIL %s (exit=%s)\n' "$SS_STEP" "$rc" >&2; fi; }
ss_fail() { printf 'DETAIL: %s\n' "$1" >&2; exit 1; }
ss_start() {
 SS_STEP="$1"; trap 'ss_finish "$?"' EXIT; umask 077
 : "${LC_SKILL_REPO_OWNER:?LC_SKILL_REPO_OWNER required}"
 : "${LC_SKILL_REPO_NAME:?LC_SKILL_REPO_NAME required}"
 [[ "$LC_SKILL_REPO_OWNER" =~ ^[a-zA-Z0-9_-]+$ && "$LC_SKILL_REPO_NAME" =~ ^[a-zA-Z0-9_.-]+$ ]] || ss_fail "Invalid GitHub repository identity"
 SS_API="https://api.github.com/repos/$LC_SKILL_REPO_OWNER/$LC_SKILL_REPO_NAME"
 for b in bash curl jq date base64; do command -v "$b" >/dev/null 2>&1 || ss_fail "Missing dependency: $b"; done
 [[ -n "$SS_REF" && "$SS_REF" =~ ^[a-zA-Z0-9._/-]+$ && "$SS_REF" != *..* ]] || ss_fail "Unsafe source ref"
 [[ ! -L "$SS_DIR" ]] || ss_fail "Symlink evidence directory rejected"
 mkdir -p -- "$SS_DIR"; chmod 700 -- "$SS_DIR"
 [[ -d "$SS_DIR" && -w "$SS_DIR" ]] || ss_fail "Evidence directory unavailable"
}
ss_need() { [[ -s "$SS_DIR/$1" ]] || ss_fail "Missing prerequisite evidence: $1"; }
ss_secret() { [[ -n "${!1:-}" ]] || ss_fail "Missing secret environment variable: $1"; }
ss_sha() { [[ "$1" =~ ^[a-fA-F0-9]{40}$ ]] || ss_fail "Invalid git SHA"; }
ss_get() {
 local url="$1" dst="$2" token="$3" code tmp
 [[ "$url" == "$SS_API"/* || ( -n "$SS_BASE_URL" && "$url" == "$SS_BASE_URL/api/admin/skills/sync/status" ) ]] ||
   ss_fail "GET URL outside approved exact hosts/paths"
 tmp="$(mktemp "$SS_DIR/.get.XXXXXXXX")"
 if ! code="$(curl --proto '=https' --tlsv1.2 --globoff --silent --show-error --max-time 45 \
    --request GET --header "Authorization: Bearer $token" --header "Accept: application/json" \
    --output "$tmp" --write-out '%{http_code}' "$url")"; then
    rm -f -- "$tmp"; ss_fail "Authenticated GET transport failure"
 fi
 if [[ "$code" != "200" ]] || ! jq -e 'type=="object"' "$tmp" >/dev/null 2>&1; then
    rm -f -- "$tmp"; ss_fail "GET HTTP=$code or invalid JSON"
 fi
 mv -- "$tmp" "$dst"; chmod 600 -- "$dst"
}
ss_stage() { [[ "${LC_SKILL_STAGE:-}" == "1" || "${LC_SKILL_STAGE:-}" == "2" ]] || ss_fail "LC_SKILL_STAGE must be 1 or 2"; }
ss_fresh() {
 local when="$1" maxage="${LC_SKILL_MAX_AGE_SECONDS:-900}" epoch now
 [[ "$maxage" =~ ^[1-9][0-9]*$ ]] || ss_fail "Invalid freshness bound"
 if ! epoch="$(date -u -d "$when" +%s 2>/dev/null)"; then ss_fail "Bad UTC timestamp"; fi
 now="$(date -u +%s)"
 (( epoch <= now && now-epoch <= maxage )) || ss_fail "Readback stale or future-dated"
}
