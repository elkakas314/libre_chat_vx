# NOSTROMO — npm config collision R0/R1 (2026-11-11)

## Host evidence (user Lenovo terminal output)
- SOURCE isolated npm: 2/2 PASS; devdeps gates: 10/10 PASS; native wiring: 5/5 PASS; visual: 3/3 PASS; backups: 7 Python + 2 Node + 2 legacy guards PASS; local audit: 1/1 PASS. Total **32/32 fixture tests**. This is not a live application E2E.
- `nostromo:runtime:npm11:preview` = `ISOLATED_NPM11_READY_TO_STAGE`; available disk and memory gates passed.
- `nostromo:frontend:deps:repair` = `PREVIEW_CONFIG_GAP` on host npm 10.9.8; missing `rimraf`, `tsdown`, `vite`; SHA lock `e7119c0eecd9c97048c7fb838a9f8cb0cb620bed99b7488886743e9bbe14d5f5` matched.
- `nostromo:runtime:npm11:stage` = **FAILED**, npm stderr `double-loading config "/dev/null" as "global", previously loaded as "user"`, observedVersion=null, exitCode=1, `privateStageRemoved=true`. The host did **not** execute subsequent repair APPLY or frontend:ci from this run. Host npm and upstream unchanged according to the installer receipt.

## Source repair
- Both the isolated npm stager and frontend dependency repair used **the same /dev/null path** as `npm_config_userconfig` and `npm_config_globalconfig`; this is the causal configuration collision.
- New shared `scripts/npm-config-isolation.mjs` creates a private empty global config file (`wx`, 0600, owned directory 0700) and leaves user config as `/dev/null`; no global/user double-load and no user npmrc read.
- Stager global npmrc lives in its own private stage and is cleaned with a failed stage. Frontend repair uses a unique private temporary global config, with inode-based safe exit cleanup; no deletion of pre-existing files.
- Regression test invokes **real host npm --version** with the repaired dual-config environment (network-free, no install). New test status pending local Node readback; do not call it PASS until executed.
- The integration branch is SOURCE only. No Actions, no main merge, no deployment, no secrets.

## Resume on Lenovo
1. Fetch `integration/nostromo-pr31-34-35-36-20261111` and check its new exact HEAD; use the existing detached worktree `~/librechat/.nostromo-stage-20261111` via a non-destructive fast-forward switch only if clean.
2. Run `npm run nostromo:runtime:npm11:test` and `npm run nostromo:frontend:deps:repair:test` (includes the regression test), and npm stage/preview.
3. Repair script preview and exact APPLY only when npm 11, Git HEADs, lock SHA and 0 removed/changed dry-run gates all pass.
4. `frontend:ci` and actual browser/MCP E2E remain mandatory.
