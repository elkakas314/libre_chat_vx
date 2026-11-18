# NOSTROMO — integration stage (SOURCE ONLY, 2026-11-11)

**Repository:** `elkakas314/libre_chat_vx`.
**Immutable target base:** `main@04784e51ceda9ce6a2b1a70db0f1cd58b86989ae`.
**Status:** SOURCE_INTEGRATION_CANDIDATE / LIVE_NOT_VERIFIED / NO_PRODUCT_VERIFIED.

## PR source identity
- PR #31 HEAD `983229e69c7a5e8f8d2c425736a2effc9116830b`.
- PR #34 HEAD `d8809dbcf18987211edb4b0327c9bc9580f10788`.
- PR #35 HEAD `ab478c6914abd896b089aaf548ab4848a55c71f2`.
- PR #36 HEAD `3adf801fef4c45ba8111844e6e9fdc505e32fdc5`.

Every non-`package.json` changed file is replayed from its exact PR HEAD only if `main` still matches that file's corresponding PR base revision. No deletion or replacement of unique newer main content. The only cross-PR overlap is `package.json`, whose commands have been combined without dropping any old scripts, explicitly joining the updated `test` and `nostromo:workspace:test` commands.

This is a reversible GitHub branch, not an installation and not evidence that the original draft PRs can merge as-is.

## Gates and next commands on the Lenovo (not executed in staging)

1. Never touch `/home/elkakas314/upstream`. Preserve `/home/elkakas314/librechat/vx`, `/home/elkakas314/librechat/upstream`, all untracked lockfiles, and backups. Inspect local HEAD, git dirty state, SHA identities, and resources before any write.
2. SOURCE tests: `npm run nostromo:frontend:deps:repair:test`, `npm run nostromo:wiring:test`, `npm run nostromo:visual:test`, `npm run nostromo:backups:test`, `npm test`. No GitHub Actions.
3. PREVIEW only: `npm run nostromo:runtime:npm11:preview`, `npm run nostromo:frontend:deps:repair`, `npm run nostromo:wiring:inspect`, `npm run nostromo:wiring:config:preview`, `npm run nostromo:backups:audit`; inspect outputs before enabling any write gate.
4. Runtime build: stage isolated npm@11.13.0 only after real host resource and security gates; guarded dry-run needs 0 removed and 0 changed, then `frontend:ci` PASS on pinned upstream and real browser E2E.
5. Agent/MCP remain disabled until RBAC, single-user identity, model binding, secrets provisioning, one YAML entry, readback and governed authorization. No automatic `.env` copying, no ChatGPT OAuth without direct official consent.
6. Visual acceptance: native LibreChat startup and authenticated session, Bridge/Hub and advanced cockpit (if mounted), native Artifacts/Subagents preserved, desktop and mobile screens, real event/status data and restart canaries. Mock/source fixtures do NOT prove these.
7. Preserve all three backups until a distinct real verifier proves safe rollback; the backup audit never authorizes deletion. No force push, reset --hard, git clean, legacy overlay destructive install/uninstall or paid services.

**Finish condition:** SOURCE/INSTALLED/CONFIGURED/LIVE/VERIFIED separated with exact receipts, CPU/RAM, version, test evidence, and qualified external blockers. Until then no PRODUCT_VERIFIED.

## Verificación independiente de estructura GitHub (2026-11-11)

- Readback de rama: `a2acfbc17d16c99c0e743f0e8fb589cb2e477e75`, `main@04784e51ceda9ce6a2b1a70db0f1cd58b86989ae`; comparación `ahead=1, behind=0`, 44 archivos modificados/añadidos, cero eliminados.
- `package.json` parseado como JSON: **PASS**. Total 32 comandos npm, manteniendo todos los comandos previos y fusionando las adiciones de las cuatro PR. Referencias locales a scripts extraídas de esos comandos: **35/35 rutas existen en el árbol del commit**.
- Cambios en workflows GitHub Actions: **0**. Archivos `.env`, `package-lock.json` o secretos modificados: **0**. Nuevos symlinks entre los cambios: **0**. No se solicitó ejecución de Actions.
- Estos son gates **STATIC_TREE_PASS** hechos mediante readback de GitHub, **no** pruebas Node/TypeScript, no `npm run frontend:ci`, no acceso Lenovo, no instalación, no navegador, no sesión de agente, no CLI E2E.
- Mantener PR #31 en DRAFT/CONFLICTED y #34/#35/#36 en DRAFT hasta aceptar sus gates propios. No ejecutar merge a main por estas verificaciones estáticas.
