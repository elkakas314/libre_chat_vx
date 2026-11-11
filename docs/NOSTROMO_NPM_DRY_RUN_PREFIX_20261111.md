# NOSTROMO — npm 11 dry-run prefixed output compatibility (2026-11-11)
## LIVE host receipt supplied by user
- npm 11.13.0 **ISOLATED_NPM11_STAGED_VERIFIED**, host npm 10.9.8 unchanged; regression `nostromo:runtime:npm11:test` 3/3 PASS and `nostromo:frontend:deps:repair:test` 11/11 PASS before this change.
- Repair preview **PREVIEW_REPAIR_AVAILABLE**, npm compatibility admissible, pinned lock SHA `e7119c0eecd9c97048c7fb838a9f8cb0cb620bed99b7488886743e9bbe14d5f5`.
- Repair APPLY failed closed **DRY_RUN_UNREADABLE**, `dryRun.allow=false`. No `APPLY_START`, no actual npm dependency install, no frontend:ci.
## Diagnosed compatibility defect
- The guard parses stdout as a single JSON document. Upstream npm CLI issue #8565 (`https://github.com/npm/cli/issues/8565`) documents npm 11's `npm install --dry-run --json` may emit `add PACKAGE VERSION` lines before the JSON summary, breaking `JSON.parse(stdout)`.
- This matches the failure signature but is not yet confirmed against the Lenovo's raw stdout; therefore local replay/readback is needed.
## Narrow SOURCE correction
- The guard continues to accept plain JSON, checks all numeric counts as before, and **rejects** all nonzero `removed`/`changed`, malformed arrays, unknown prefix lines, or any discrepancy between action lines and `add` objects (including duplicate multiplicity and versions).
- No change to npm invocation, manifest/lock guards, install authorization or output printing. No bypass, no install, no GitHub Actions.
- Added tests covering the issue's prefixed format and unsafe variants.
- Standalone pure Node fixture PASS in isolated analyst container; exact integrated Lenovo regression must still run and may reveal different npm output. If still blocked, inspect a sanitized output shape locally; do **not** bypass the fail-closed guard.
## Resume
Run from `~/librechat/.nostromo-stage-20261111` after exact SHA-checked checkout: `npm run nostromo:frontend:deps:repair:test`; `npm run nostromo:frontend:deps:repair`; `npm run nostromo:frontend:deps:repair -- --apply`; only after PASS run `frontend:ci` with isolated npm 11.
