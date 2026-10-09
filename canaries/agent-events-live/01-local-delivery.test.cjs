// Executed after "npm test" has compiled dist. Tests actual LibreChat VX projection.
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAgentEventDelivery } = require('../../dist/src/events/agentEvents.js');

const base = {
  source: 'LIBRECHAT_INTERNAL',
  eventId: 'test.event-1',
  type: 'event.attention',
  occurredAtMs: 1730000000000,
  resourceRef: 'conv-1',
  summary: 'Synthetic fixture only',
  severity: 'ATTENTION',
  evidenceRefs: ['evidence:fixture'],
};

test('source: event delivery preserves identity, severity and non-authority', () => {
  const d = buildAgentEventDelivery(base);
  assert.equal(d.mode, 'fire');
  assert.equal(d.authority, false);
  assert.equal(d.idempotencyKey, 'LIBRECHAT_INTERNAL:test.event-1');
  assert.equal(d.orderingKey, 'LIBRECHAT_INTERNAL:conv-1');
  assert.equal(d.event.id, base.eventId);
  assert.equal(d.event.type, base.type);
  assert.equal(d.event.occurredAt, base.occurredAtMs);
  assert.equal(d.event.payload.source, 'LIBRECHAT_INTERNAL');
  assert.equal(d.event.payload.severity, 'ATTENTION');
  assert.deepEqual(d.event.payload.evidenceRefs, ['evidence:fixture']);
});

test('source: same source+eventId yields identical key; separate events differ', () => {
  const a = buildAgentEventDelivery(base);
  const retry = buildAgentEventDelivery({ ...base, summary: 'UI resent identical event' });
  const b = buildAgentEventDelivery({ ...base, eventId: 'test.event-2' });
  const sourceB = buildAgentEventDelivery({ ...base, source: 'VX13' });
  assert.equal(a.idempotencyKey, retry.idempotencyKey);
  assert.notEqual(a.idempotencyKey, b.idempotencyKey);
  assert.notEqual(a.idempotencyKey, sourceB.idempotencyKey);
  assert.equal(a.authority, false);
  assert.equal(retry.authority, false);
});

test('source: no resourceRef removes orderingKey and absent evidence refs become []', () => {
  const d = buildAgentEventDelivery({ ...base, resourceRef: undefined, evidenceRefs: undefined });
  assert.equal(d.orderingKey, undefined);
  assert.deepEqual(d.event.payload.evidenceRefs, []);
  assert.equal(d.authority, false);
});

// This tests key construction, NOT server-side receipt or true deduplication.
