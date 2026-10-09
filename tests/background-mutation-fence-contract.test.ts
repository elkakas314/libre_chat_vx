import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  mayReplayInBackground,
  parseBackgroundMutationFenceWire,
  serializeBackgroundMutationFence,
  timeoutAfterPossibleEffect,
  type BackgroundMutationFence,
} from '../src/recovery/backgroundMutationFence';

const schema = JSON.parse(readFileSync('contracts/background-mutation-fence.schema.json', 'utf8'));

const fence: BackgroundMutationFence = {
  operationId: 'op-7',
  targetId: 'MANOJOS3',
  capabilityRef: 'governed.capability',
  effectScope: 'run:abc',
  authorizationRef: null,
  idempotencyKey: 'idem-7',
  expectedState: { state: 'PREPARED' },
  fence: 2,
  startedAt: '2026-10-09T07:00:00Z',
  timeoutAt: null,
  status: 'SUBMITTED',
  readbackRequired: true,
};

test('contract 7 wire schema requires every indispensable property and target identity', () => {
  assert.deepEqual(
    [...schema.required].sort(),
    ['operation_id', 'target_id', 'capability_ref', 'effect_scope', 'status', 'readback_required'].sort(),
  );
  assert.deepEqual(schema.properties.target_id.enum, ['VX13', 'MANOJOS3']);
  assert.equal(schema.properties.readback_required.const, true);
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.authority_ref.type.includes('null'), true);
  assert.equal(schema.properties.fence.minimum, 0);
});

test('round-trip keeps every contract property and translates only names', () => {
  const wire = serializeBackgroundMutationFence(fence);
  assert.deepEqual(wire, {
    operation_id: 'op-7',
    target_id: 'MANOJOS3',
    capability_ref: 'governed.capability',
    effect_scope: 'run:abc',
    authority_ref: null,
    idempotency_key: 'idem-7',
    expected_state: { state: 'PREPARED' },
    fence: 2,
    started_at: '2026-10-09T07:00:00Z',
    timeout_at: null,
    status: 'SUBMITTED',
    readback_required: true,
  });
  assert.deepEqual(parseBackgroundMutationFenceWire(wire), fence);
  assert.equal(Object.keys(wire).every((key) => key in schema.properties), true);
});

test('minimum valid wire keeps optional properties optional', () => {
  const minimum = {
    operation_id: 'op-min',
    target_id: 'VX13',
    capability_ref: 'read.cap',
    effect_scope: 'artifact:x',
    status: 'PREPARED',
    readback_required: true,
  };
  assert.deepEqual(parseBackgroundMutationFenceWire(minimum), {
    operationId: 'op-min',
    targetId: 'VX13',
    capabilityRef: 'read.cap',
    effectScope: 'artifact:x',
    status: 'PREPARED',
    readbackRequired: true,
  });
});

test('unknown, incomplete and unsafe wire claims fail closed', () => {
  const good = serializeBackgroundMutationFence(fence);
  const invalid: unknown[] = [
    null, [], 'wire', 4,
    { ...good, operation_id: '' },
    { ...good, capability_ref: '' },
    { ...good, capability_ref: undefined },
    { ...good, target_id: 'BOTH' },
    { ...good, readback_required: false },
    { ...good, status: 'COMPLETE' },
    { ...good, fence: -1 },
    { ...good, fence: 1.5 },
    { ...good, expected_state: ['not-an-object'] },
    { ...good, expected_state: true },
    { ...good, authority_ref: 3 },
    { ...good, started_at: 5 },
    { ...good, invented_authority: true },
  ];
  for (const item of invalid) {
    assert.equal(parseBackgroundMutationFenceWire(item), null);
  }
  assert.throws(() => serializeBackgroundMutationFence({
    ...fence,
    expectedState: ['invalid'] as unknown as Record<string, unknown>,
  }), TypeError);
});

test('unknown outcome never replays material work and always requires readback', () => {
  const changed = timeoutAfterPossibleEffect(fence);
  assert.equal(changed.status, 'UNKNOWN_OUTCOME');
  assert.equal(changed.readbackRequired, true);
  assert.equal(mayReplayInBackground(), false);
  assert.equal(parseBackgroundMutationFenceWire(serializeBackgroundMutationFence(changed))?.status,
    'UNKNOWN_OUTCOME');
});
