import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseCrossTargetTruthWire,
  serializeCrossTargetTruthWire,
  type NormalizedCrossTargetTruthEnvelope,
} from '../src/discovery/crossTargetRead';
import { Manojos3McpTargetAdapter, type Manojos3McpTransport } from '../src/adapters/manojos3McpAdapter';

const schema = JSON.parse(readFileSync('contracts/cross-target-truth-envelope.schema.json', 'utf8'));
const wire = {
  target_id: 'VX13', truth_class: 'SOURCE', status: 'NO_VERIFICADO',
  source_ref: 'git:SOURCE', observed_revision: null,
  observed_at: '2026-10-09T00:00:00Z', fresh_until: null,
  evidence_refs: ['git:source'],
  receipt_ref: null, verification_ref: null,
  uncertainty_reason: 'LIVE_UNAVAILABLE',
};

test('contract 8 requires evidence and concrete target identity', () => {
  assert.deepEqual([...schema.required].sort(),
    ['target_id', 'truth_class', 'status', 'observed_at', 'evidence_refs'].sort());
  assert.deepEqual(schema.properties.target_id.enum, ['VX13', 'MANOJOS3']);
  assert.equal(schema.additionalProperties, false);
});

test('wire SOURCE uncertainty remains SOURCE; missing refs are not invented', () => {
  const result = parseCrossTargetTruthWire(wire);
  assert.ok(result);
  assert.equal(result.truthClass, 'SOURCE');
  assert.equal(result.status, 'NO_VERIFICADO');
  assert.deepEqual(result.evidenceRefs, ['git:source']);
  assert.equal(result.sourceRef, 'git:SOURCE');
  assert.equal(result.freshUntil, null);
  assert.equal(result.observedRevision, undefined);
  const encoded = serializeCrossTargetTruthWire(result);
  assert.equal(encoded.target_id, 'VX13');
  assert.equal(encoded.truth_class, 'SOURCE');
  assert.equal(encoded.status, 'NO_VERIFICADO');
  assert.equal(encoded.source_ref, 'git:SOURCE');
  assert.equal(encoded.fresh_until, null);
  assert.deepEqual(encoded.evidence_refs, ['git:source']);
});

test('valid minimal wire does not fabricate receipt, verifier or evidence', () => {
  const minimum = {
    target_id: 'MANOJOS3', truth_class: 'EXTERNAL',
    status: 'UNKNOWN_OUTCOME', observed_at: '2026-10-09T00:00:00Z',
    evidence_refs: [],
  };
  assert.deepEqual(parseCrossTargetTruthWire(minimum), {
    targetId: 'MANOJOS3', truthClass: 'EXTERNAL',
    status: 'UNKNOWN_OUTCOME', observedAt: '2026-10-09T00:00:00Z',
    evidenceRefs: [],
  });
});

test('reject invalid and missing wire identity/provenance without promotion', () => {
  const bad: unknown[] = [
    null, [], 'truth', 5,
    { ...wire, target_id: 'BOTH' },
    { ...wire, truth_class: 'INFERRED' },
    { ...wire, status: 'OK' },
    { ...wire, evidence_refs: undefined },
    { ...wire, evidence_refs: 'fabricated' },
    { ...wire, evidence_refs: [1] },
    { ...wire, observed_at: null },
    { ...wire, verification_ref: 44 },
    { ...wire, sourceRef: 'wrong convention' },
  ];
  for (const value of bad) assert.equal(parseCrossTargetTruthWire(value), null);
  assert.throws(() => serializeCrossTargetTruthWire({
    targetId: 'VX13', truthClass: 'SOURCE', status: 'NO_VERIFICADO',
    observedAt: 'time', evidenceRefs: undefined as unknown as string[],
  }), TypeError);
});

test('existing MCP producer can serialize actual unverified truth without claiming LIVE VERIFIED', async () => {
  const transport: Manojos3McpTransport = {
    status: async () => ({
      status: 'STALE', observedAt: '2026-10-09T00:00:00Z',
      sourceRevision: 'revision', evidenceRefs: ['receipt:readback'], verified: false,
    }),
    skills: async () => ({ status: 'OFFLINE', observedAt: '2026-10-09T00:00:00Z' }),
    capabilities: async () => ({ status: 'OFFLINE', observedAt: '2026-10-09T00:00:00Z' }),
  };
  const produced = (await new Manojos3McpTargetAdapter(transport).health()).truth;
  const serialized = serializeCrossTargetTruthWire(produced);
  assert.equal(serialized.truth_class, 'LIVE');
  assert.equal(serialized.status, 'STALE');
  assert.deepEqual(serialized.evidence_refs, ['receipt:readback']);
  assert.equal(serialized.observed_revision, 'revision');
  assert.equal(parseCrossTargetTruthWire(serialized)?.status, 'STALE');
});

test('additional SOURCE context stays optional and does not alter truth class', () => {
  const envelope: NormalizedCrossTargetTruthEnvelope = {
    targetId: 'VX13', truthClass: 'SOURCE', status: 'RESYNC_REQUIRED',
    observedAt: '2026-10-09T00:00:00Z', evidenceRefs: [],
    sourceRef: 'repo:VX13', freshUntil: null, uncertaintyReason: 'stale',
  };
  const wireResult = serializeCrossTargetTruthWire(envelope);
  assert.equal(wireResult.source_ref, 'repo:VX13');
  assert.equal(wireResult.fresh_until, null);
  assert.equal(parseCrossTargetTruthWire(wireResult)?.truthClass, 'SOURCE');
});
