import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

// Focused evaluation of the JSON Schema keywords used by ui-action's RED guard.
// Not a general-purpose JSON Schema 2020-12 validator.
type Rule = { enum?: unknown[]; type?: string | string[]; minLength?: number };
type RedGuard = {
  if: { properties: { control_class: { const: string } } };
  then: { required: string[]; properties: Record<string, Rule> };
};
type UiActionSchema = {
  required: string[];
  properties: Record<string, Rule>;
  allOf: RedGuard[];
};
const schema = JSON.parse(readFileSync('contracts/ui-action.schema.json', 'utf8')) as UiActionSchema;

function acceptsRule(value: unknown, rule: Rule): boolean {
  if (rule.enum && !rule.enum.some((member) => Object.is(member, value))) return false;
  if (rule.type) {
    const accepted = Array.isArray(rule.type) ? rule.type : [rule.type];
    const actual = value === null ? 'null' : typeof value;
    if (!accepted.includes(actual)) return false;
  }
  if (rule.minLength !== undefined && (typeof value !== 'string' || value.length < rule.minLength)) return false;
  return true;
}

function acceptsUiActionShape(value: Record<string, unknown>): boolean {
  if (!schema.required.every((name) => Object.hasOwn(value, name))) return false;
  if (!Object.entries(value).every(([name, item]) => {
    const rule = schema.properties[name];
    return rule !== undefined && acceptsRule(item, rule);
  })) return false;

  for (const guard of schema.allOf) {
    if (value.control_class !== guard.if.properties.control_class.const) continue;
    if (!guard.then.required.every((name) => Object.hasOwn(value, name))) return false;
    if (!Object.entries(guard.then.properties).every(([name, rule]) => {
      return !Object.hasOwn(value, name) || acceptsRule(value[name], rule);
    })) return false;
  }
  return true;
}

const validRed = {
  action_id: 'red-ui-01',
  target_scope: 'VX13',
  resolved_target_id: 'VX13',
  intent: 'target-owned objective',
  control_class: 'RED',
  capability_ref: 'target.capability',
  requested_at: '2026-10-08T00:00:00Z',
};

test('RED rejects a present but null/blank capability_ref', () => {
  assert.equal(acceptsUiActionShape({ ...validRed, capability_ref: null }), false);
  assert.equal(acceptsUiActionShape({ ...validRed, capability_ref: '' }), false);
});

test('RED rejects AUTO and BOTH target_scope even with a concrete resolved_target_id', () => {
  assert.equal(acceptsUiActionShape({ ...validRed, target_scope: 'AUTO' }), false);
  assert.equal(acceptsUiActionShape({ ...validRed, target_scope: 'BOTH' }), false);
});

test('RED requires a concrete target and nonempty capability; no new material authority', () => {
  assert.equal(acceptsUiActionShape(validRed), true);
  assert.equal(acceptsUiActionShape({ ...validRed, target_scope: 'MANOJOS3', resolved_target_id: 'MANOJOS3' }), true);
  assert.equal(acceptsUiActionShape({ ...validRed, resolved_target_id: null }), false);
  assert.equal(acceptsUiActionShape({ ...validRed, capability_ref: undefined }), false);
  assert.equal(acceptsUiActionShape({ ...validRed, control_class: 'YELLOW', target_scope: 'AUTO', capability_ref: null }), true);
});
