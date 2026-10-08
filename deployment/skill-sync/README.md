# NOSTROMO — GitHub Skill Sync, two-stage canary (SOURCE ONLY)

No new daemon/tunnel/Worker. These are `librechat.yaml` fragments; neither file is applied to a running server by this repository.

## Verified base

- GitHub repo: `elkakas314/libre_chat_vx`, working ref: `handoff_current_bootstrps`.
- Upstream pinned: `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`.
- GitHub Skill Sync in pinned upstream `packages/api/src/skills/sync/github.ts` uses `source.paths` and `skillDiscoveryDepth` for discovery; depth `0` matches an explicitly named Skill root.
- Catalog: 10 active names, 2 physically retained compatibility aliases. GitHub scans do **not** honor `config/skills.current.json` as an exclusion filter.
- Authentication for a private repository: `GITHUB_SKILLS_TOKEN` only as a host-side secret environment reference; fine-grained read-only Contents + Metadata. Never place actual token in Git/Drive/chat.
- Source id `nostromo-vx-skills` stays stable across phases to avoid creating duplicate mirrors. Observe tenant/permission scope before binding.

## Stage 1 — canary of all 12 physical Skill roots

Use `librechat.skill-sync-stage1.example.yaml` as a fragment, merged into the real admin `librechat.yaml` **only on the authorized host** after backup. It points to the working branch and scans `skills` at depth 1. Do not run on startup during the initial controlled canary. Ensure the LibreChat Agents endpoint has `skills` capability and admin permissions allow sync.

On a running instance, use an authenticated admin readback: `GET /api/admin/skills/sync/status`, then manually `POST /api/admin/skills/sync/run`. Verify status and record source-id, Git ref/commit, discovered count 12, mirrored versions/hashes, last-known-good, no unexpected conflicts/partial/skips, and UI visibility. An HTTP 200 by itself is not PASS. No effect is allowed outside LibreChat's existing Skills sync governance.

## Stage 2 — ten active roots, legacy aliases left in Git

**Only after** stage 1 LIVE success, compatible usage/no-regression canary, and verified rollback snapshot, switch the same source id to `librechat.skill-sync-stage2.example.yaml`. Its ten explicit `paths` and depth `0` mirror precisely the active catalog. Git retains both legacy alias folders; the sync may prune the *mirrored rows* for aliases removed from its configured paths. Treat that as a material state transition; require a verified admin canary and compare before/after. Never delete legacy files from Git as an accidental side effect.

Keep `runOnStartup:false` until behavior is validated; a 1440-minute interval is a low-churn default example, not a measured rate. If anything unexpected changes (missing visible Skills, incorrect scoped permissions, conflict, partial sync, stale references, wrong tenant), revert the previous fragment and confirm the previous mirror/readback. Do **not** rename source id or guess from a source-only test.

## Closeout

- SOURCE acceptance: preflight checks catalog/physical names and exact stage selection without credentials.
- LIVE acceptance: authenticated status + run readback, exact source ref/content hash, correct visibility/permissions for 12 then 10, no skipped/partial sync, rollback verified, no material target claims.
- Gate: `LC-SKILL-SYNC-LIVE` remains **OPEN** until LIVE proof; Stage 2 is never automatically deployed.
