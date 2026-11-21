#!/usr/bin/env node
/**
 * NOSTROMO P0 -- token/context arithmetic from an explicitly supplied, sanitized
 * runtime snapshot. R0 only: no tool registry mutation, auth reads or model calls.
 * A result here NEVER establishes that LibreChat has bound these actual schemas.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const INPUT_SCHEMA = 'nostromo.tool-context-input.v1';
const REPORT_SCHEMA = 'nostromo.tool-context-audit.r0.v1';
const TOKEN_FIELDS = ['effectiveContextTokens', 'systemInstructionTokens', 'effectiveToolSchemaTokens', 'reserveTokens'];
const COUNT_FIELDS = ['selected', 'deferred', 'direct', 'includedInRequest'];

function validCount(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

/** Arithmetic only. Field values are user-provided, not attested host readback. */
export function auditToolContext(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || input.schema !== INPUT_SCHEMA)
    throw new Error('CONTEXT_AUDIT_INPUT_SCHEMA_INVALID');
  const acceptedFields = new Set(['schema', ...TOKEN_FIELDS, 'countsOrigin', 'toolCounts']);
  if (Object.keys(input).some(field => !acceptedFields.has(field)))
    throw new Error('CONTEXT_AUDIT_UNEXPECTED_FIELD');
  for (const field of TOKEN_FIELDS) {
    if (!validCount(input[field])) throw new Error('CONTEXT_AUDIT_FIELD_INVALID:' + field);
  }
  if (input.effectiveContextTokens === 0) throw new Error('CONTEXT_AUDIT_WINDOW_ZERO');
  if (!['HOST_REPORTED', 'MANUAL_SNAPSHOT', 'TEST_FIXTURE'].includes(input.countsOrigin))
    throw new Error('CONTEXT_AUDIT_ORIGIN_INVALID');
  if (input.toolCounts !== undefined) {
    if (!input.toolCounts || typeof input.toolCounts !== 'object' || Array.isArray(input.toolCounts))
      throw new Error('CONTEXT_AUDIT_TOOL_COUNTS_INVALID');
    if (Object.keys(input.toolCounts).some(field => !COUNT_FIELDS.includes(field)))
      throw new Error('CONTEXT_AUDIT_UNEXPECTED_TOOL_COUNT_FIELD');
    for (const field of COUNT_FIELDS) {
      if (!validCount(input.toolCounts[field])) throw new Error('CONTEXT_AUDIT_TOOL_COUNT_INVALID:' + field);
    }
  }
  const { effectiveContextTokens, systemInstructionTokens, effectiveToolSchemaTokens, reserveTokens } = input;
  const totalTokens = systemInstructionTokens + effectiveToolSchemaTokens + reserveTokens;
  if (!Number.isSafeInteger(totalTokens)) throw new Error('CONTEXT_AUDIT_TOTAL_OVERFLOW');
  const budgetRemainingTokens = effectiveContextTokens - totalTokens;
  const warnings = [];
  if (input.toolCounts) {
    const { selected, deferred, direct, includedInRequest } = input.toolCounts;
    if (deferred + direct !== selected) warnings.push('SELECTED_TOOL_COUNT_DISAGREEMENT');
    if (includedInRequest > selected) warnings.push('INCLUDED_EXCEEDS_SELECTED_VERIFY_ADDITIONAL_TOOL_SOURCES');
    if (includedInRequest > direct) warnings.push('DEFERRED_EFFECTIVENESS_UNCONFIRMED');
  }
  return {
    schema: REPORT_SCHEMA,
    readOnly: true,
    mutations: 0,
    secretsRead: false,
    arithmeticResult: totalTokens < effectiveContextTokens ? 'WITHIN_BUDGET' : 'OVER_BUDGET',
    effectiveContextTokens, systemInstructionTokens, effectiveToolSchemaTokens, reserveTokens,
    totalTokens, budgetRemainingTokens,
    toolCounts: input.toolCounts ? Object.fromEntries(COUNT_FIELDS.map(field => [field, input.toolCounts[field]])) : null,
    warnings,
    evidenceSource: input.countsOrigin,
    acceptance: 'ARITHMETIC_ONLY_HOST_BINDING_NOT_VERIFIED',
  };
}

export async function auditToolContextFile(inputPath) {
  const content = await readFile(inputPath, 'utf8');
  if (content.length > 65_536) throw new Error('CONTEXT_AUDIT_INPUT_TOO_LARGE');
  return auditToolContext(JSON.parse(content));
}

async function main(args) {
  if (args.length !== 2 || args[0] !== '--input' || !args[1]) {
    console.error('usage: node scripts/audit-tool-context.mjs --input SANITIZED_SNAPSHOT.json');
    return 2;
  }
  try {
    const result = await auditToolContextFile(resolve(args[1]));
    console.log(JSON.stringify(result, null, 2));
    return result.arithmeticResult === 'WITHIN_BUDGET' ? 0 : 1;
  } catch (error) {
    // No input paths, credentials, raw field values or tool names in output.
    const code = error instanceof Error && /^CONTEXT_AUDIT_[A-Z_:]+$/.test(error.message)
      ? error.message : 'CONTEXT_AUDIT_INVALID_INPUT';
    console.error(code);
    return 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
