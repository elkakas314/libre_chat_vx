#!/usr/bin/env node
/** Disabled legacy UNINSTALL route. Historical implementation preserved in Git.
 * It used destructive rmSync/git restore without a complete unique-work readback.
 * The protected workflow is reconcile-existing-workspace.mjs.
 */
process.stderr.write('NOSTROMO_LEGACY_UNINSTALL_BLOCKED: old script could overwrite unique LibreChat files. Use audited, backed-up reconciliation / manual owner-approved uninstall.\\n');
process.exitCode=2;
