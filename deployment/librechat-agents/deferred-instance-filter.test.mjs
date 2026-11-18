import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { patchDeferredInstanceFilter } from './deferred-instance-filter.mjs';

const original = {
  source: `    const isEventDriven = (this.toolDefinitions?.length ?? 0) > 0;\n    if (isEventDriven || !this.toolRegistry) {\n      return this.tools;\n    }\n    return this.filterToolsForBinding(this.tools);`,
  compiled: `\t\tif ((this.toolDefinitions?.length ?? 0) > 0 || !this.toolRegistry) return this.tools;\n\t\treturn this.filterToolsForBinding(this.tools);`,
};
const patched = {
  source: `    if (!this.toolRegistry) {\n      return this.tools;\n    }\n    return this.filterToolsForBinding(this.tools);`,
  compiled: `\t\tif (!this.toolRegistry) return this.tools;\n\t\treturn this.filterToolsForBinding(this.tools);`,
};

async function fixture(t, version = '4.0.1') {
  const root = await mkdtemp(path.join(os.tmpdir(), 'nostromo-agent-filter-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ name: '@librechat/agents', version }));
  const files = [
    ['src/agents/AgentContext.ts', original.source],
    ['dist/cjs/agents/AgentContext.cjs', original.compiled],
    ['dist/esm/agents/AgentContext.mjs', original.compiled],
  ];
  for (const [relative, contents] of files) {
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents);
  }
  return { root, files };
}

test('patch filters deferred instances in CJS, ESM and source, idempotently', async (t) => {
  const { root, files } = await fixture(t);
  const dryRun = await patchDeferredInstanceFilter(root);
  assert.ok(dryRun.results.every((item) => item.state === 'PATCH_AVAILABLE'));
  const applied = await patchDeferredInstanceFilter(root, { apply: true });
  assert.ok(applied.results.every((item) => item.state === 'PATCHED'));
  for (const [relative] of files) {
    assert.equal(await readFile(path.join(root, relative), 'utf8'), relative.startsWith('src/') ? patched.source : patched.compiled);
  }
  const secondApply = await patchDeferredInstanceFilter(root, { apply: true });
  assert.ok(secondApply.results.every((item) => item.state === 'ALREADY_PATCHED'));
});

test('patch fails closed for a different package version', async (t) => {
  const { root } = await fixture(t, '4.0.2');
  await assert.rejects(patchDeferredInstanceFilter(root, { apply: true }), /AGENTS_PACKAGE_IDENTITY_MISMATCH/);
});

test('patch fails closed when any target has drifted', async (t) => {
  const { root, files } = await fixture(t);
  await writeFile(path.join(root, files[1][0]), 'different implementation');
  await assert.rejects(patchDeferredInstanceFilter(root, { apply: true }), /AGENTS_PATCH_CONTEXT_MISMATCH/);
  assert.equal(await readFile(path.join(root, files[0][0]), 'utf8'), original.source);
});
