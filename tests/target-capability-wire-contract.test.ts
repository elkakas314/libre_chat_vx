import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { TargetCapabilityProjection } from '../src/core/types';
import {
  Manojos3McpTargetAdapter,
  parseTargetCapabilityProjectionWire,
  type Manojos3McpTransport,
} from '../src/adapters/manojos3McpAdapter';

const schema = JSON.parse(readFileSync('contracts/target-capability-projection.schema.json', 'utf8'));
const wire = {
  target_id: 'MANOJOS3', capability_id: 'browser.read', provider: 'target',
  risk: 'R0', effect_class: 'READ_ONLY', availability: 'SOURCE_ONLY',
  policy_authority_ref: 'MANOJOS3_POLICY',
  execution_authority_ref: null, verification_authority_ref: 'MANOJOS3_VERIFIER',
  required_scopes: ['read'], source_revision: 'rev-a',
  observed_at: '2026-10-09T00:00:00Z', expires_at: null,
  evidence_refs: ['source:capability-index'],
};

test('contract 6 requires scoped provenance and no extra wire keys', () => {
  for (const key of [
    'target_id', 'capability_id', 'risk', 'effect_class', 'availability',
    'policy_authority_ref', 'source_revision', 'observed_at',
    'required_scopes', 'evidence_refs',
  ]) assert.equal(schema.required.includes(key), true, key);
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.properties.target_id.enum, ['VX13', 'MANOJOS3']);
});

test('snake_case projection maps at the existing adapter without manufacturing authority or evidence', () => {
  const projected = parseTargetCapabilityProjectionWire(wire);
  assert.ok(projected);
  assert.deepEqual({
    targetId: projected.targetId, capabilityId: projected.capabilityId,
    risk: projected.risk, effectClass: projected.effectClass,
    policyAuthorityRef: projected.policyAuthorityRef,
    verificationAuthorityRef: projected.verificationAuthorityRef,
    requiredScopes: projected.requiredScopes, evidenceRefs: projected.evidenceRefs,
  }, {
    targetId: 'MANOJOS3', capabilityId: 'browser.read',
    risk: 'R0', effectClass: 'READ_ONLY',
    policyAuthorityRef: 'MANOJOS3_POLICY',
    verificationAuthorityRef: 'MANOJOS3_VERIFIER',
    requiredScopes: ['read'], evidenceRefs: ['source:capability-index'],
  });
  assert.equal(projected.executionAuthorityRef, undefined);
  assert.equal((projected as unknown as Record<string, unknown>).provider, 'target');
  assert.equal((projected as unknown as Record<string, unknown>).expiresAt, null);
});

test('invalid, extra and incomplete wire data fail closed', () => {
  const cases: unknown[] = [
    null, [], 'data', { ...wire, target_id: 'OTHER' },
    { ...wire, policy_authority_ref: '' }, { ...wire, capability_id: '' },
    { ...wire, risk: 'R9' }, { ...wire, effect_class: 'UNKNOWN' },
    { ...wire, evidence_refs: undefined }, { ...wire, required_scopes: undefined },
    { ...wire, evidence_refs: 'fabricated' }, { ...wire, required_scopes: [5] },
    { ...wire, provider: null }, { ...wire, evidenceRefs: ['unexpected'] },
    { ...wire, verification_authority_ref: 22 },
  ];
  for (const candidate of cases) {
    assert.equal(parseTargetCapabilityProjectionWire(candidate), null);
  }
});

test('discovery accepts wire or legacy in-process projections only when complete, stays MANOJOS3-only', async () => {
  const validInternal: TargetCapabilityProjection = {
    targetId: 'MANOJOS3', capabilityId: 'health', risk: 'R0',
    effectClass: 'READ_ONLY', availability: 'SOURCE_ONLY',
    policyAuthorityRef: 'MANOJOS3_POLICY', sourceRevision: 'rev-a',
    observedAt: '2026-10-09T00:00:00Z', requiredScopes: [], evidenceRefs: [],
  };
  const transport: Manojos3McpTransport = {
    status: async () => ({ status: 'OK', observedAt: '2026-10-09T00:00:00Z' }),
    skills: async () => ({ status: 'OK', observedAt: '2026-10-09T00:00:00Z' }),
    capabilities: async () => ({
      status: 'OK', observedAt: '2026-10-09T00:00:00Z',
      value: [
        wire as unknown as TargetCapabilityProjection,
        validInternal,
        { ...wire, target_id: 'VX13' } as unknown as TargetCapabilityProjection,
        { ...wire, evidence_refs: undefined } as unknown as TargetCapabilityProjection,
      ],
    }),
  };
  const adapter = new Manojos3McpTargetAdapter(transport);
  const result = await adapter.discoverCapabilities();
  assert.deepEqual(result.map((x) => x.capabilityId), ['browser.read', 'health']);
  assert.equal(result.every((x) => x.targetId === 'MANOJOS3'), true);
});

test('MCP grouped index is NOT silently normalized by this representation-only fix', async () => {
  const transport: Manojos3McpTransport = {
    status: async () => ({ status: 'OK', observedAt: '2026-10-09T00:00:00Z' }),
    skills: async () => ({ status: 'OK', observedAt: '2026-10-09T00:00:00Z' }),
    capabilities: async () => ({
      status: 'OK', observedAt: '2026-10-09T00:00:00Z',
      value: { schema:'manojos3.capability-index.v1', groups: [] } as unknown as TargetCapabilityProjection[],
    }),
  };
  assert.deepEqual(await new Manojos3McpTargetAdapter(transport).discoverCapabilities(), []);
});
