import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { MANOJOS3_ENTRYPOINTS } from '../src/manojos3/entrypoints';

type Schema = {
  type?: string;
  enum?: unknown[];
  const?: unknown;
  minLength?: number;
  minItems?: number;
  pattern?: string;
  required?: string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean;
  items?: Schema;
  allOf?: Schema[];
  if?: Schema;
  then?: Schema;
};

/** Validate the JSON Schema keywords used in this local contract without another dependency. */
function conforms(value: unknown, rule: Schema): boolean {
  if ('const' in rule && value !== rule.const) return false;
  if (rule.enum && !rule.enum.includes(value)) return false;
  if (rule.type === 'string') {
    if (typeof value !== 'string') return false;
    if (rule.minLength !== undefined && value.length < rule.minLength) return false;
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) return false;
  }
  if (rule.type === 'array') {
    if (!Array.isArray(value)) return false;
    if (rule.minItems !== undefined && value.length < rule.minItems) return false;
    if (rule.items && !value.every((item) => conforms(item, rule.items!))) return false;
  }
  if (rule.type === 'object' || rule.required || rule.properties) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const object = value as Record<string, unknown>;
    if (rule.required?.some((key) => !(key in object))) return false;
    if (rule.additionalProperties === false &&
      Object.keys(object).some((key) => !(key in (rule.properties ?? {})))) return false;
    for (const [key, nested] of Object.entries(rule.properties ?? {})) {
      if (key in object && !conforms(object[key], nested)) return false;
    }
  }
  if (rule.allOf?.some((item) => !conforms(value, item))) return false;
  if (rule.if && conforms(value, rule.if) && rule.then && !conforms(value, rule.then)) {
    return false;
  }
  return true;
}

const schema = JSON.parse(
  readFileSync('contracts/manojos3-entrypoint.schema.json', 'utf8'),
) as Schema;

test('contract 12 enums are exactly the three real MANOJOS3 source entrypoints', () => {
  assert.equal(MANOJOS3_ENTRYPOINTS.length, 3);
  assert.deepEqual(
    [...new Set(MANOJOS3_ENTRYPOINTS.map((entrypoint) => entrypoint.kind))].sort(),
    [...(schema.properties?.kind.enum as string[])].sort(),
  );
  assert.deepEqual(schema.properties?.state.enum,
    ['SOURCE_EXISTS_DEPLOYMENT_UNBOUND', 'SOURCE_INTERNAL_ONLY']);
});

test('all three MANOJOS3_ENTRYPOINTS conform to the corrected schema', () => {
  for (const entrypoint of MANOJOS3_ENTRYPOINTS) {
    assert.equal(conforms(entrypoint, schema), true, entrypoint.id);
    assert.equal(entrypoint.authority, false);
  }
  const advisory = MANOJOS3_ENTRYPOINTS.find((entrypoint) =>
    entrypoint.kind === 'INTERNAL_ADVISORY_LITELLM');
  assert.ok(advisory);
  assert.equal(advisory.state, 'SOURCE_INTERNAL_ONLY');
  assert.equal(advisory.deploymentEnv, undefined);
});

test('schema requires identity, transport and source provenance without an external adapter', () => {
  assert.deepEqual(schema.required,
    ['id', 'kind', 'transport', 'state', 'authority', 'sourcePins', 'notes']);
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties?.id.minLength, 1);
  assert.equal(schema.properties?.transport.minLength, 1);
  assert.equal(schema.properties?.authority.const, false);
  assert.equal(schema.properties?.endpoint_env, undefined);
  assert.equal(schema.properties?.deploymentEnv.type, 'string');
});

test('fail closed on missing identity, old kind, invalid authority and fake provenance', () => {
  const action = MANOJOS3_ENTRYPOINTS[0];
  const litellm = MANOJOS3_ENTRYPOINTS[1];
  const wrong: unknown[] = [
    { ...action, id: '' },
    { ...action, id: undefined },
    { ...action, transport: '' },
    { ...action, kind: 'INFERENCE_OPENAI_COMPATIBLE' },
    { ...action, authority: true },
    { ...action, endpoint_env: 'MANOJOS3_MCP_URL' },
    { ...action, deploymentEnv: null },
    { ...action, sourcePins: [] },
    { ...action, sourcePins: [{ path: 'x', blobSha: 'wrong-sha' }] },
    { ...action, notes: 'not an array' },
    { ...litellm, state: 'SOURCE_EXISTS_DEPLOYMENT_UNBOUND' },
    { ...action, state: 'SOURCE_DISCOVERED_LIVE_UNVERIFIED' },
  ];
  for (const example of wrong) {
    assert.equal(conforms(example, schema), false);
  }
});
