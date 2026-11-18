import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { auditToolContext, auditToolContextFile } from '../audit-tool-context.mjs';

const script = resolve('scripts/audit-tool-context.mjs');
const baseline = {
  schema: 'nostromo.tool-context-input.v1',
  effectiveContextTokens: 6144, systemInstructionTokens: 3152,
  effectiveToolSchemaTokens: 5302, reserveTokens: 512,
  countsOrigin: 'MANUAL_SNAPSHOT',
  toolCounts: { selected: 11, deferred: 8, direct: 3, includedInRequest: 13 },
};

test('P0: manually assembled 6144 preflight budget exceeds by 2822, not LIVE PASS', () => {
  const report = auditToolContext(baseline);
  assert.equal(report.arithmeticResult, 'OVER_BUDGET');
  assert.equal(report.totalTokens, 8966);
  assert.equal(report.budgetRemainingTokens, -2822);
  assert.equal(report.acceptance, 'ARITHMETIC_ONLY_HOST_BINDING_NOT_VERIFIED');
  assert.deepEqual(report.warnings, [
    'INCLUDED_EXCEEDS_SELECTED_VERIFY_ADDITIONAL_TOOL_SOURCES',
    'DEFERRED_EFFECTIVENESS_UNCONFIRMED',
  ]);
});

test('P0: efficient tools fit only when explicitly reported, no fake filtering', () => {
  const report = auditToolContext({
    ...baseline,
    effectiveToolSchemaTokens: 960,
    toolCounts: { selected: 11, deferred: 8, direct: 3, includedInRequest: 3 },
  });
  assert.equal(report.arithmeticResult, 'WITHIN_BUDGET');
  assert.equal(report.budgetRemainingTokens, 1520);
  assert.deepEqual(report.warnings, []);
});

test('P0: strict boundary equals capacity is OVER_BUDGET', () => {
  const report = auditToolContext({
    ...baseline, effectiveContextTokens: 6144,
    effectiveToolSchemaTokens: 2480, reserveTokens: 512,
  });
  assert.equal(report.totalTokens, 6144);
  assert.equal(report.arithmeticResult, 'OVER_BUDGET');
});

test('P0: malformed and unverified token counts fail closed', () => {
  for (const input of [
    { ...baseline, effectiveContextTokens: '6144' },
    { ...baseline, effectiveToolSchemaTokens: -2 },
    { ...baseline, reserveTokens: NaN },
    { ...baseline, systemInstructionTokens: 1.3 },
    { ...baseline, countsOrigin: 'LIVE_VERIFIED' },
    { ...baseline, toolCounts: { ...baseline.toolCounts, deferred: 9.5 } },
    { ...baseline, effectiveContextTokens: 0 },
    { ...baseline, secret: 'DO_NOT_READ' },
  ]) assert.throws(() => auditToolContext(input), /CONTEXT_AUDIT_/);
});

test('P0: CLI remains read only and never echoes credential-like fields', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'nostromo-context-audit-'));
  try {
    const path = join(dir, 'snapshot.json');
    await writeFile(path, JSON.stringify(baseline));
    const before = await auditToolContextFile(path);
    assert.equal(before.arithmeticResult, 'OVER_BUDGET');
    const run = spawnSync(process.execPath, [script, '--input', path], { encoding: 'utf8' });
    assert.equal(run.status, 1, run.stderr);
    assert.equal(JSON.parse(run.stdout).readOnly, true);
    assert.doesNotMatch(run.stdout + run.stderr, /SUPERSECRET_DO_NOT_PRINT/);
    const after = await auditToolContextFile(path);
    assert.deepEqual(after, before);
    await writeFile(path, JSON.stringify({ ...baseline, maliciousSecretField: 'SUPERSECRET_DO_NOT_PRINT' }));
    const rejected = spawnSync(process.execPath, [script, '--input', path], { encoding: 'utf8' });
    assert.equal(rejected.status, 2);
    assert.doesNotMatch(rejected.stdout + rejected.stderr, /SUPERSECRET_DO_NOT_PRINT/);
    const missing = spawnSync(process.execPath, [script, '--input', join(dir, 'missing.json')], { encoding: 'utf8' });
    assert.equal(missing.status, 2);
    assert.doesNotMatch(missing.stderr, /missing\.json/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
