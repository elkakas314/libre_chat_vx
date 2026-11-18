#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const EXPECTED_VERSION = '4.0.1';
const TARGETS = [
  {
    file: 'src/agents/AgentContext.ts',
    before: `    const isEventDriven = (this.toolDefinitions?.length ?? 0) > 0;\n    if (isEventDriven || !this.toolRegistry) {\n      return this.tools;\n    }\n    return this.filterToolsForBinding(this.tools);`,
    after: `    if (!this.toolRegistry) {\n      return this.tools;\n    }\n    return this.filterToolsForBinding(this.tools);`,
  },
  {
    file: 'dist/cjs/agents/AgentContext.cjs',
    before: `\t\tif ((this.toolDefinitions?.length ?? 0) > 0 || !this.toolRegistry) return this.tools;\n\t\treturn this.filterToolsForBinding(this.tools);`,
    after: `\t\tif (!this.toolRegistry) return this.tools;\n\t\treturn this.filterToolsForBinding(this.tools);`,
  },
  {
    file: 'dist/esm/agents/AgentContext.mjs',
    before: `\t\tif ((this.toolDefinitions?.length ?? 0) > 0 || !this.toolRegistry) return this.tools;\n\t\treturn this.filterToolsForBinding(this.tools);`,
    after: `\t\tif (!this.toolRegistry) return this.tools;\n\t\treturn this.filterToolsForBinding(this.tools);`,
  },
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export async function patchDeferredInstanceFilter(packageRoot, { apply = false } = {}) {
  const root = path.resolve(packageRoot);
  const metadata = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  if (metadata.version !== EXPECTED_VERSION || metadata.name !== '@librechat/agents') {
    throw new Error('AGENTS_PACKAGE_IDENTITY_MISMATCH');
  }

  const pending = [];
  for (const target of TARGETS) {
    const filePath = path.join(root, target.file);
    const original = await readFile(filePath, 'utf8');
    const originalCount = original.split(target.before).length - 1;
    const patchedCount = original.split(target.after).length - 1;
    if (originalCount === 1 && patchedCount === 0) {
      const updated = original.replace(target.before, target.after);
      pending.push({ target, filePath, updated, state: apply ? 'PATCHED' : 'PATCH_AVAILABLE' });
      continue;
    }
    if (originalCount === 0 && patchedCount === 1) {
      pending.push({ target, filePath, updated: original, state: 'ALREADY_PATCHED' });
      continue;
    }
    throw new Error(`AGENTS_PATCH_CONTEXT_MISMATCH:${target.file}`);
  }

  const results = [];
  for (const item of pending) {
    if (item.state === 'PATCHED') {
      const temporary = `${item.filePath}.nostromo-tmp`;
      await writeFile(temporary, item.updated, { mode: 0o644 });
      await rename(temporary, item.filePath);
    }
    results.push({ file: item.target.file, state: item.state, sha256: sha256(item.updated) });
  }
  return { package: metadata.name, version: metadata.version, results };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const rootIndex = args.indexOf('--package-root');
  if (rootIndex < 0 || !args[rootIndex + 1] || args.some((arg) => !['--apply', '--package-root'].includes(arg) && arg !== args[rootIndex + 1])) {
    console.error('usage: node deferred-instance-filter.mjs [--apply] --package-root PATH');
    process.exitCode = 2;
  } else {
    try {
      const result = await patchDeferredInstanceFilter(args[rootIndex + 1], { apply });
      console.log(JSON.stringify(result));
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'AGENTS_PATCH_FAILED');
      process.exitCode = 1;
    }
  }
}
