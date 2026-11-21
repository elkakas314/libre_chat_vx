import handoffSchema from '../../contracts/nostromo-objective-handoff.schema.json';

/** A validated handoff is still user data, never an authority or an executable command. */
export interface ObjectiveHandoff {
  schema: 'nostromo.objective.handoff.v1';
  objective_ref: string; conversation_ref: string; agreement_ref: string;
  plan_hash: string; plan_version: number;
  execution_lane: 'NOSTROMO_LOCAL' | 'EXTERNAL_TARGET';
  target_id: 'NOSTROMO_LOCAL' | 'MANOJOS3' | 'VX13';
  objective: string; expected_result: string;
  acceptance_criteria: { criterion_id: string; predicate_ref: string; description?: string }[];
  capability_refs: string[]; context_refs: string[];
  constraints: { no_paid_fallback: true; max_execution_seconds: number; forbidden_effects?: string[] };
  risk: 'R0' | 'R1' | 'R2' | 'R3' | 'R4';
  idempotency_key: string; readback_required: true;
  status: 'AGREED' | 'RESOLVING' | 'RESOLVED' | 'PREFLIGHT' | 'WAITING_AUTHORITY' | 'DISPATCHING' | 'EXECUTED_PENDING_READBACK' | 'UNKNOWN_OUTCOME' | 'VERIFIED' | 'FAILED' | 'CANCELLED';
  authority: false;
}

type Schema = Record<string, unknown>;
const supported = new Set(['$schema', '$id', 'title', 'description', 'type', 'additionalProperties', 'required', 'properties', 'const', 'enum', 'minLength', 'maxLength', 'pattern', 'minimum', 'maximum', 'minItems', 'maxItems', 'items', 'uniqueItems', 'allOf', 'if', 'then']);
const record = (x: unknown): x is Schema => x !== null && typeof x === 'object' && !Array.isArray(x);

function supportedSchema(schema: unknown, depth = 0): boolean {
  if (depth > 24 || !record(schema) || Object.keys(schema).some((key) => !supported.has(key))) return false;
  if ('properties' in schema && (!record(schema.properties) || Object.values(schema.properties).some((child) => !supportedSchema(child, depth + 1)))) return false;
  if ('items' in schema && !supportedSchema(schema.items, depth + 1)) return false;
  if ('allOf' in schema && (!Array.isArray(schema.allOf) || schema.allOf.some((child) => !supportedSchema(child, depth + 1)))) return false;
  for (const key of ['if', 'then']) if (key in schema && !supportedSchema(schema[key], depth + 1)) return false;
  return true;
}
const schemaSupported = supportedSchema(handoffSchema);

/** Implements only the contract's schema vocabulary; any future unknown keyword fails closed. */
function matches(schema: Schema, value: unknown, depth = 0): boolean {
  if (depth > 24 || Object.keys(schema).some((key) => !supported.has(key))) return false;
  const type = schema.type;
  if (type === 'object' && !record(value)) return false;
  if (type === 'array' && !Array.isArray(value)) return false;
  if (type === 'string' && typeof value !== 'string') return false;
  if (type === 'integer' && !(typeof value === 'number' && Number.isSafeInteger(value))) return false;
  if (type !== undefined && !['object', 'array', 'string', 'integer'].includes(String(type))) return false;
  if ('const' in schema && value !== schema.const) return false;
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) return false;
  if (typeof value === 'string') {
    const length = [...value].length;
    if (typeof schema.minLength === 'number' && length < schema.minLength) return false;
    if (typeof schema.maxLength === 'number' && length > schema.maxLength) return false;
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern, 'u').test(value)) return false;
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) return false;
    if (typeof schema.maximum === 'number' && value > schema.maximum) return false;
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) return false;
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) return false;
    if (schema.uniqueItems === true && new Set(value.map((x) => JSON.stringify(x))).size !== value.length) return false;
    if (record(schema.items) && value.some((x) => !matches(schema.items as Schema, x, depth + 1))) return false;
  }
  if (record(value)) {
    const properties = record(schema.properties) ? schema.properties : {};
    if (Array.isArray(schema.required) && schema.required.some((key) => typeof key !== 'string' || !Object.hasOwn(value, key))) return false;
    if (schema.additionalProperties === false && Object.keys(value).some((key) => !Object.hasOwn(properties, key))) return false;
    for (const [key, child] of Object.entries(properties)) {
      if (Object.hasOwn(value, key) && (!record(child) || !matches(child, value[key], depth + 1))) return false;
    }
  }
  if (Array.isArray(schema.allOf) && schema.allOf.some((child) => !record(child) || !matches(child, value, depth + 1))) return false;
  if (record(schema.if) && matches(schema.if, value, depth + 1) && record(schema.then) && !matches(schema.then, value, depth + 1)) return false;
  return true;
}

export function isObjectiveHandoff(value: unknown): value is ObjectiveHandoff {
  try { return schemaSupported && matches(handoffSchema as Schema, value); } catch { return false; }
}
