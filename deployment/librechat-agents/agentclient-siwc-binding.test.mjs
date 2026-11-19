import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PINNED_UPSTREAM, TARGET, patchAgentClientSource, rollbackAgentClientSource } from './agentclient-siwc-binding.mjs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const upstream = process.env.NOSTROMO_UPSTREAM_ROOT ?? '/home/elkakas314/librechat/upstream';

test('SIWC patch binds the authenticated route before the primary agent LLM is initialized', () => {
  assert.equal(execFileSync('git', ['-C', upstream, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), PINNED_UPSTREAM);
  const source = readFileSync(resolve(upstream, TARGET), 'utf8');
  const updated = patchAgentClientSource(source);
  assert.ok(updated.includes("require('@librechat/vx/dist/src/llm/siwcOpenAiFetch.js')"));
  assert.ok(updated.includes('resolveAgentClientRunBinding'));
  assert.ok(updated.includes('req.app?.locals?.nostromoSiwc?.resolveAgentClientRunBinding'));
  assert.ok(!updated.includes('req.app?.locals?.nostromoSiwcConnectionService?.resolveAgentClientRunBinding'));
  assert.ok(updated.includes('authenticatedUserId'));
  assert.ok(updated.includes('agentId: primaryAgent?.id?.toString?.()'));
  assert.ok(updated.includes('Object.assign(primaryAgent, createSiwcAgentClientRunAgent(primaryAgent, resolved.route, resolved.fetch))'));
  assert.ok(updated.includes('fetch: siwcRunBinding.fetch'));
  assert.ok(updated.indexOf('resolveAgentClientRunBinding') < updated.indexOf('await initializeAgent('));
  assert.equal(patchAgentClientSource(updated), updated);
  assert.equal(rollbackAgentClientSource(updated, source), source);
  assert.throws(() => rollbackAgentClientSource(updated + '\n', source), /ROLLBACK_READBACK_MISMATCH/);
  const staged = join(mkdtempSync(join(tmpdir(), 'nostromo-agentclient-siwc-')), 'client.js');
  writeFileSync(staged, updated);
  execFileSync(process.execPath, ['--check', staged]);
});

test('AgentClient patch fails closed on modified or partial source', () => {
  const source = readFileSync(resolve(upstream, TARGET), 'utf8');
  assert.throws(() => patchAgentClientSource(source + '\n// local change\n'), /SOURCE_MISMATCH/);
  assert.throws(() => patchAgentClientSource('/* NOSTROMO_SIWC_AGENTCLIENT_INITIALIZATION_V1 */'), /PATCH_PARTIAL/);
});
