import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

interface Rule {
  type?: string;
  enum?: unknown[];
  const?: unknown;
  minLength?: number;
  minItems?: number;
  uniqueItems?: boolean;
  required?: string[];
  properties?: Record<string, Rule>;
  items?: Rule;
  additionalProperties?: boolean;
  allOf?: Rule[];
  if?: Rule;
  then?: Rule;
}

function conforms(value: unknown, rule: Rule): boolean {
  if (rule.enum && !rule.enum.includes(value)) return false;
  if ('const' in rule && value !== rule.const) return false;
  if (rule.type === 'string') {
    if (typeof value !== 'string') return false;
    if (rule.minLength !== undefined && value.length < rule.minLength) return false;
  }
  if (rule.type === 'array' || rule.minItems !== undefined || rule.uniqueItems || rule.items) {
    if (!Array.isArray(value)) return false;
    if (rule.minItems !== undefined && value.length < rule.minItems) return false;
    if (rule.uniqueItems && new Set(value.map((x) => JSON.stringify(x))).size !== value.length) return false;
    if (rule.items && !value.every((item) => conforms(item, rule.items!))) return false;
  }
  if (rule.type === 'object' || rule.required || rule.properties) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const object = value as Record<string, unknown>;
    if (rule.required?.some((key) => !(key in object))) return false;
    if (rule.additionalProperties === false &&
      Object.keys(object).some((key) => !(key in (rule.properties ?? {})))) return false;
    for (const [key, nested] of Object.entries(rule.properties ?? {})) {
      if (key in object && !conforms(object[key], nested)) return false;
    }
  }
  if (rule.allOf?.some((r) => !conforms(value, r))) return false;
  if (rule.if && conforms(value, rule.if) && rule.then && !conforms(value, rule.then)) return false;
  return true;
}

const schema = JSON.parse(readFileSync('contracts/transport-resource.schema.json', 'utf8')) as Rule;
const registry = JSON.parse(readFileSync('config/transport_registry.current.json', 'utf8')) as {
  schema: string;
  authority: boolean;
  resources: Array<Record<string, unknown>>;
  deferred: Array<{ id: string; kind: string; reason: string }>;
};

const expectedSource: Record<string, string> = {
  'lc-local-web': 'SOURCE_DEFINED',
  'lc-tailserve': 'DECLARED_NOT_DEPLOYED',
  'lc-cf-web': 'DECLARED_NOT_DEPLOYED',
  'lc-cf-access': 'DECLARED_NOT_DEPLOYED',
  'lc-aig': 'DECLARED_LIVE_UNVERIFIED',
  'lc-skill-sync': 'DECLARED_LIVE_UNVERIFIED',
  'lc-agent-events': 'DECLARED_LIVE_UNVERIFIED',
  'lc-recovery-ssh': 'DECLARED_NOT_DEPLOYED',
};

test('ADR-11 keeps separate, closed SOURCE and runtime enums, no untyped status', () => {
  assert.equal(schema.properties?.status, undefined);
  assert.deepEqual(schema.properties?.sourceStatus.enum,
    ['SOURCE_DEFINED', 'DECLARED_NOT_DEPLOYED', 'DECLARED_LIVE_UNVERIFIED']);
  assert.deepEqual(schema.properties?.runtimeStatus.enum, [
    'NO_DEPLOYMENT_EVIDENCE', 'NOT_DEPLOYED', 'DEPLOYED_UNVERIFIED',
    'LIVE_VERIFIED', 'MATERIAL_VERIFIED',
  ]);
  assert.deepEqual(schema.required,
    ['id', 'kind', 'owner', 'purpose', 'sourceStatus', 'runtimeStatus',
      'runtimeEvidenceRefs', 'authority']);
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties?.authority.const, false);
});

test('all eight active transport resources preserve identity and SOURCE claims without inventing LIVE', () => {
  assert.equal(registry.authority, false);
  assert.equal(registry.resources.length, 8);
  assert.deepEqual(registry.resources.map((x) => x.id).sort(), Object.keys(expectedSource).sort());
  for (const res of registry.resources) {
    assert.equal(conforms(res, schema), true, String(res.id));
    assert.equal(res.sourceStatus, expectedSource[String(res.id)]);
    assert.equal(res.runtimeStatus, 'NO_DEPLOYMENT_EVIDENCE');
    assert.deepEqual(res.runtimeEvidenceRefs, []);
    assert.equal(res.authority, false);
    assert.equal('status' in res, false);
    assert.ok(typeof res.kind === 'string' && res.kind.length > 0);
    assert.ok(typeof res.owner === 'string' && res.owner.length > 0);
    assert.ok(typeof res.purpose === 'string' && res.purpose.length > 0);
    assert.ok(typeof res.rollback === 'string' && res.rollback.length > 0);
  }
});

test('deferred resources remain deferred, not instances nor deployed', () => {
  assert.deepEqual(registry.deferred.map((x) => x.id),
    ['lc-ts-services', 'm3-transport-migration']);
  assert.equal(registry.deferred.every((x) => !('runtimeStatus' in x)), true);
  assert.equal(registry.deferred.every((x) => !('sourceStatus' in x)), true);
  assert.equal(registry.deferred.every((x) => !conforms(x, schema)), true);
});

test('runtime promotion requires explicit readback evidence and observed timestamp', () => {
  const base = registry.resources[0];
  for (const runtimeStatus of ['NOT_DEPLOYED', 'DEPLOYED_UNVERIFIED',
    'LIVE_VERIFIED', 'MATERIAL_VERIFIED']) {
    assert.equal(conforms({ ...base, runtimeStatus }, schema), false);
    assert.equal(conforms({
      ...base, runtimeStatus, runtimeEvidenceRefs: ['readback:proof'],
    }, schema), false);
    assert.equal(conforms({
      ...base, runtimeStatus, runtimeEvidenceRefs: [],
      runtimeObservedAt: '2026-10-09T00:00:00Z',
    }, schema), false);
    assert.equal(conforms({
      ...base, runtimeStatus, runtimeEvidenceRefs: ['readback:proof'],
      runtimeObservedAt: '2026-10-09T00:00:00Z',
    }, schema), true);
  }
});

test('invalid status, implicit authority, missing identity and unsupported runtime fields fail closed', () => {
  const base = registry.resources[0];
  const invalid: unknown[] = [
    { ...base, runtimeStatus: 'LIVE_NOT_VERIFIED' },
    { ...base, sourceStatus: 'NOT_DEPLOYED' },
    { ...base, status: 'LIVE_NOT_VERIFIED' },
    { ...base, sourceStatus: 'LIVE_VERIFIED' },
    { ...base, authority: true },
    { ...base, id: '' },
    { ...base, owner: '' },
    { ...base, runtimeEvidenceRefs: ['a', 'a'] },
    { ...base, runtimeEvidenceRefs: [42] },
    { ...base, sourceStatus: undefined },
    { ...base, runtimeStatus: undefined },
    { ...base, provenanceClaim: 'LIVE' },
  ];
  for (const item of invalid) assert.equal(conforms(item, schema), false);
});
