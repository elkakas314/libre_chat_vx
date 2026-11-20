import { createHash } from 'node:crypto';
import type { ObjectiveHandoff } from '../contracts/objectiveHandoff';
import {
  resolveAgreedObjective,
  type ObjectiveHandoffHost,
} from '../intent/nostromoDecisionBridge';
import type { ToolProjection } from './targetToolGate';

/* ------------------------------------------------------------------ */
/* JSON Schema subset: fail closed on unknown keywords.               */
/* ------------------------------------------------------------------ */

export interface JsonSchema {
  type?: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean';
  properties?: Record<string, JsonSchema>;
  required?: readonly string[];
  additionalProperties?: boolean;
  items?: JsonSchema;
  enum?: readonly unknown[];
  const?: unknown;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
}

const IGNORED_ANNOTATIONS = new Set([
  '$schema',
  '$id',
  'title',
  'description',
  'default',
  'examples',
  'deprecated',
  'readOnly',
  'writeOnly',
]);

const VALIDATION_KEYWORDS = new Set([
  'type',
  'properties',
  'required',
  'additionalProperties',
  'items',
  'enum',
  'const',
  'minLength',
  'maxLength',
  'pattern',
  'minimum',
  'maximum',
  'minItems',
  'maxItems',
]);

function validateValue(
  schema: JsonSchema,
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (schema === null || typeof schema !== 'object' || Array.isArray(schema)) {
    issues.push(`${path}:SCHEMA_INVALID`);
    return;
  }

  for (const key of Object.keys(schema)) {
    if (!VALIDATION_KEYWORDS.has(key) && !IGNORED_ANNOTATIONS.has(key)) {
      issues.push(`${path}:UNSUPPORTED_KEYWORD:${key}`);
      return;
    }
  }

  if (
    schema.additionalProperties !== undefined &&
    typeof schema.additionalProperties !== 'boolean'
  ) {
    issues.push(`${path}:ADDITIONAL_PROPERTIES_SCHEMA_UNSUPPORTED`);
    return;
  }

  if ('const' in schema && value !== schema.const) {
    issues.push(`${path}:CONST`);
  }

  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    issues.push(`${path}:ENUM`);
  }

  if (schema.type) {
    switch (schema.type) {
      case 'object':
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
          issues.push(`${path}:OBJECT`);
          return;
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          issues.push(`${path}:ARRAY`);
          return;
        }
        break;
      case 'string':
        if (typeof value !== 'string') {
          issues.push(`${path}:STRING`);
          return;
        }
        break;
      case 'integer':
        if (!(typeof value === 'number' && Number.isSafeInteger(value))) {
          issues.push(`${path}:INTEGER`);
          return;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          issues.push(`${path}:NUMBER`);
          return;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          issues.push(`${path}:BOOLEAN`);
          return;
        }
        break;
      default:
        issues.push(`${path}:TYPE_UNSUPPORTED`);
        return;
    }
  }

  if (typeof value === 'string') {
    const length = [...value].length;
    if (typeof schema.minLength === 'number' && length < schema.minLength) {
      issues.push(`${path}:MIN_LENGTH`);
    }
    if (typeof schema.maxLength === 'number' && length > schema.maxLength) {
      issues.push(`${path}:MAX_LENGTH`);
    }
    if (typeof schema.pattern === 'string') {
      try {
        if (!new RegExp(schema.pattern, 'u').test(value)) {
          issues.push(`${path}:PATTERN`);
        }
      } catch {
        issues.push(`${path}:PATTERN_INVALID`);
      }
    }
  }

  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      issues.push(`${path}:MINIMUM`);
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      issues.push(`${path}:MAXIMUM`);
    }
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      issues.push(`${path}:MIN_ITEMS`);
    }
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) {
      issues.push(`${path}:MAX_ITEMS`);
    }
    if (schema.items) {
      value.forEach((item, index) =>
        validateValue(schema.items!, item, `${path}[${index}]`, issues),
      );
    }
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const objectValue = value as Record<string, unknown>;
    const properties = schema.properties ?? {};

    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!Object.hasOwn(objectValue, key)) {
          issues.push(`${path}.${key}:REQUIRED`);
        }
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(objectValue)) {
        if (!Object.hasOwn(properties, key)) {
          issues.push(`${path}.${key}:ADDITIONAL_PROPERTY`);
        }
      }
    }

    for (const [key, child] of Object.entries(properties)) {
      if (Object.hasOwn(objectValue, key)) {
        validateValue(child, objectValue[key], `${path}.${key}`, issues);
      }
    }
  }
}

export function validateToolArguments(
  schema: JsonSchema,
  args: unknown,
): readonly string[] {
  const issues: string[] = [];
  validateValue(schema, args, '$', issues);
  return issues;
}

/* ------------------------------------------------------------------ */
/* MCP transport: bind to the existing MCP client.                   */
/* ------------------------------------------------------------------ */

export interface McpToolCall {
  name: string;
  arguments: Record<string, unknown>;
  timeoutMs: number;
}

export type McpToolCallResult =
  | {
      status: 'OK';
      structuredContent?: unknown;
      content?: readonly unknown[];
      isError?: false;
    }
  | {
      status: 'ERROR';
      errorCode: string;
      message: string;
      retryable: boolean;
    }
  | {
      status: 'UNKNOWN_OUTCOME';
      reason: string;
    };

export interface McpToolTransport {
  callTool(call: McpToolCall): Promise<McpToolCallResult>;
}

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      if (!part || typeof part !== 'object') return '';
      const record = part as Record<string, unknown>;
      return record.type === 'text' ? String(record.text ?? '') : '';
    })
    .join('\n')
    .trim();
}

/** Accepts MCP SDK-shaped results without importing the SDK. */
export function normalizeMcpToolResult(raw: unknown): McpToolCallResult {
  if (!raw || typeof raw !== 'object') {
    return { status: 'UNKNOWN_OUTCOME', reason: 'MCP_RESULT_NOT_OBJECT' };
  }

  const record = raw as Record<string, unknown>;

  if (record.status === 'UNKNOWN_OUTCOME') {
    return {
      status: 'UNKNOWN_OUTCOME',
      reason:
        typeof record.reason === 'string'
          ? record.reason
          : 'MCP_UNKNOWN_OUTCOME',
    };
  }

  if (record.status === 'ERROR') {
    return {
      status: 'ERROR',
      errorCode:
        typeof record.errorCode === 'string' ? record.errorCode : 'MCP_ERROR',
      message:
        typeof record.message === 'string' ? record.message : 'MCP_ERROR',
      retryable: record.retryable === true,
    };
  }

  if (record.isError === true) {
    return {
      status: 'ERROR',
      errorCode: 'MCP_IS_ERROR',
      message: extractText(record.content).slice(0, 512),
      retryable: false,
    };
  }

  if ('structuredContent' in record) {
    return {
      status: 'OK',
      structuredContent: record.structuredContent,
      content: Array.isArray(record.content) ? record.content : undefined,
    };
  }

  if (Array.isArray(record.content)) {
    const text = extractText(record.content);
    if (text) {
      try {
        return {
          status: 'OK',
          structuredContent: JSON.parse(text),
          content: record.content,
        };
      } catch {
        return { status: 'OK', structuredContent: text, content: record.content };
      }
    }
    return { status: 'OK', content: record.content };
  }

  return { status: 'UNKNOWN_OUTCOME', reason: 'MCP_RESULT_UNRECOGNIZED' };
}

/* ------------------------------------------------------------------ */
/* Idempotency ledger: host binds to existing persistence.            */
/* ------------------------------------------------------------------ */

export type LedgerEntry =
  | { state: 'DISPATCHED'; fingerprint: string; atMs: number }
  | { state: 'UNKNOWN_OUTCOME'; fingerprint: string; atMs: number }
  | { state: 'VERIFIED'; fingerprint: string; atMs: number; receiptRef?: string }
  | { state: 'FAILED'; fingerprint: string; atMs: number; reason: string };

export interface IdempotencyLedger {
  get(key: string): Promise<LedgerEntry | null>;
  begin(key: string, fingerprint: string, atMs: number): Promise<boolean>;
  markUnknown(key: string, atMs: number): Promise<void>;
  complete(
    key: string,
    outcome: 'VERIFIED' | 'FAILED',
    atMs: number,
    receiptRef?: string,
  ): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Host extensions: schemas, readback, acceptance, receipt.           */
/* ------------------------------------------------------------------ */

export interface GovernedToolSchema {
  inputSchema: JsonSchema;
  readbackToolId?: string;
  /** Host-verified property of this exact tool; R0 alone does not imply safe repetition. */
  safeRepeatReadback?: boolean;
}

export interface GovernedObjectiveHost extends ObjectiveHandoffHost {
  readToolSchema?(tool: ToolProjection): Promise<GovernedToolSchema | null>;

  verifyAcceptance?(
    handoff: ObjectiveHandoff,
    criterion: {
      criterion_id: string;
      predicate_ref: string;
      description?: string;
    },
    observation: unknown,
  ): Promise<'PASS' | 'FAIL' | 'UNKNOWN'>;

  readReadback?(
    handoff: ObjectiveHandoff,
    tool: ToolProjection,
  ): Promise<{ observation: unknown; evidenceRef?: string; confirmsDispatch?: boolean } | null>;

  writeReceipt?(
    receipt: ExecutionReceipt,
  ): Promise<{ receiptRef: string } | null>;
}

/* ------------------------------------------------------------------ */
/* Receipt sanitizado: solo hashes y referencias.                     */
/* ------------------------------------------------------------------ */

export interface ExecutionReceipt {
  schema: 'nostromo.execution.receipt.v1';
  objective_ref: string;
  conversation_ref: string;
  agreement_ref: string;
  plan_hash: string;
  plan_version: number;
  target_id: string;
  capability_ref: string;
  tool_id: string;
  risk: string;
  principal_ref: string;
  tenant_ref: string | null;
  idempotency_key: string;
  args_hash: string;
  observation_hash: string;
  readback_ref?: string;
  acceptance: {
    criterion_id: string;
    predicate_ref: string;
    result: 'PASS' | 'FAIL' | 'UNKNOWN';
  }[];
  outcome: 'VERIFIED' | 'EXECUTED_UNVERIFIED' | 'FAILED' | 'UNKNOWN_OUTCOME';
  reason?: string;
  started_at_ms: number;
  finished_at_ms: number;
  receipt_ref?: string;
}

/* ------------------------------------------------------------------ */
/* Public API.                                                        */
/* ------------------------------------------------------------------ */

export interface GovernedExecutionInput {
  handoff: unknown;
  /** Pre-bound deterministic args; never model text at dispatch time. */
  args: Readonly<Record<string, unknown>>;
  host: GovernedObjectiveHost;
  transport: McpToolTransport;
  owner: {
    principalRef: string;
    tenantRef?: string | null;
  };
  ledger?: IdempotencyLedger;
  nowMs?: number;
  /** Test-only guard; production must not pass an LLM into this path. */
  llmGuard?: { assertNotCalled(): void };
}

export type GovernedExecutionResult =
  | {
      status: 'VERIFIED';
      handoff: ObjectiveHandoff;
      tool: ToolProjection;
      observation: unknown;
      receipt: ExecutionReceipt;
      receiptRef?: string;
    }
  | {
      status: 'EXECUTED_UNVERIFIED';
      handoff: ObjectiveHandoff;
      tool: ToolProjection;
      observation?: unknown;
      receipt: ExecutionReceipt;
      reason: 'READBACK_MISSING' | 'ACCEPTANCE_FAILED' | 'ACCEPTANCE_UNKNOWN' | 'RECEIPT_MISSING';
    }
  | {
      status: 'DENIED';
      reason: string;
      detail?: string;
    }
  | {
      status: 'INVALID_ARGUMENTS';
      issues: readonly string[];
    }
  | {
      status: 'UNKNOWN_OUTCOME';
      handoff: ObjectiveHandoff;
      tool: ToolProjection;
      reason: string;
      readback?: unknown;
      receipt?: ExecutionReceipt;
    }
  | {
      status: 'FAILED';
      handoff: ObjectiveHandoff;
      tool: ToolProjection;
      reason: string;
      errorCode?: string;
      receipt?: ExecutionReceipt;
    };

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function canonical(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(',')}}`;
}

function hashValue(value: unknown): string {
  return sha256(canonical(value ?? null));
}

/** Snapshot bounded JSON arguments before any asynchronous host operation. */
function snapshotArguments(value: unknown): Readonly<Record<string, unknown>> | null {
  let copy: unknown;
  try { copy=structuredClone(value); } catch { return null; }
  let nodes=0;
  const ancestors=new WeakSet<object>();
  const freeze=(item:unknown,depth:number):boolean=>{
    if (++nodes>10_000 || depth>32) return false;
    if (item===null || typeof item==='string' || typeof item==='boolean') return true;
    if (typeof item==='number') return Number.isFinite(item);
    if (typeof item!=='object' || ancestors.has(item)) return false;
    if (!Array.isArray(item) && Object.getPrototypeOf(item)!==Object.prototype && Object.getPrototypeOf(item)!==null) return false;
    ancestors.add(item);
    if (Array.isArray(item)) {
      if (Object.keys(item).length!==item.length) return false;
      for(let i=0;i<item.length;i++) if(!Object.hasOwn(item,i)||!freeze(item[i],depth+1)) return false;
    } else {
      for(const child of Object.values(item)) if(!freeze(child,depth+1)) return false;
    }
    ancestors.delete(item);
    Object.freeze(item);
    return true;
  };
  if(copy===null || typeof copy!=='object' || Array.isArray(copy) || !freeze(copy,0)) return null;
  return copy as Readonly<Record<string,unknown>>;
}

function buildReceipt(
  input: GovernedExecutionInput,
  handoff: ObjectiveHandoff,
  tool: ToolProjection,
  argsHash: string,
  outcome: ExecutionReceipt['outcome'],
  startedAtMs: number,
  extra: {
    observation?: unknown;
    readbackRef?: string;
    acceptance?: ExecutionReceipt['acceptance'];
    reason?: string;
  } = {},
): ExecutionReceipt {
  return {
    schema: 'nostromo.execution.receipt.v1',
    objective_ref: handoff.objective_ref,
    conversation_ref: handoff.conversation_ref,
    agreement_ref: handoff.agreement_ref,
    plan_hash: handoff.plan_hash,
    plan_version: handoff.plan_version,
    target_id: handoff.target_id,
    capability_ref: handoff.capability_refs[0]!,
    tool_id: tool.toolId,
    risk: tool.risk,
    principal_ref: input.owner.principalRef,
    tenant_ref: input.owner.tenantRef ?? null,
    idempotency_key: handoff.idempotency_key,
    args_hash: argsHash,
    observation_hash: hashValue(extra.observation ?? null),
    readback_ref: extra.readbackRef,
    acceptance: extra.acceptance ?? [],
    outcome,
    reason: extra.reason,
    started_at_ms: startedAtMs,
    finished_at_ms: Date.now(),
  };
}

async function evaluateAcceptance(
  input: GovernedExecutionInput,
  handoff: ObjectiveHandoff,
  observation: unknown,
): Promise<ExecutionReceipt['acceptance']> {
  const results: ExecutionReceipt['acceptance'] = [];

  for (const criterion of handoff.acceptance_criteria) {
    let result: 'PASS' | 'FAIL' | 'UNKNOWN' = 'UNKNOWN';
    if (input.host.verifyAcceptance) {
      try {
        result = await input.host.verifyAcceptance(
          handoff,
          criterion,
          observation,
        );
      } catch {
        result = 'UNKNOWN';
      }
    }
    results.push({
      criterion_id: criterion.criterion_id,
      predicate_ref: criterion.predicate_ref,
      result,
    });
  }

  return results;
}

async function performReadback(
  input: GovernedExecutionInput,
  handoff: ObjectiveHandoff,
  tool: ToolProjection,
  schema: GovernedToolSchema,
): Promise<{ observation: unknown; evidenceRef?: string; confirmsDispatch?: boolean } | null> {
  try {
    if (input.host.readReadback) {
      const readback = await input.host.readReadback(handoff, tool);
      if (readback) return readback;
    }

    // A task start may have R0 risk yet still create a job. Repeat only when
    // the trusted host explicitly attests that this exact read is repeatable.
    const startsJob=/^nostromo_tarea_iniciar(?:_mcp_.*)?$/.test(tool.toolId);
    if (!startsJob && tool.risk === 'R0' && schema.safeRepeatReadback === true && (!schema.readbackToolId || schema.readbackToolId === tool.toolId)) {
      const raw = await input.transport.callTool({
        name: schema.readbackToolId ?? tool.toolId,
        arguments: { ...input.args },
        timeoutMs: handoff.constraints.max_execution_seconds * 1000,
      });
      if (raw.status === 'OK') {
        return {
          observation: raw.structuredContent ?? raw.content ?? null,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function reconcileUnknown(
  input: GovernedExecutionInput,
  handoff: ObjectiveHandoff,
  tool: ToolProjection,
  schema: GovernedToolSchema,
  ledgerKey: string,
  argsHash: string,
  reason: string,
): Promise<GovernedExecutionResult> {
  const readback = await performReadback(input, handoff, tool, schema);
  if (!readback) {
    return {
      status: 'UNKNOWN_OUTCOME',
      handoff,
      tool,
      reason,
    };
  }

  // A fresh status reading does not prove the earlier uncertain call ran.
  if (readback.confirmsDispatch !== true || typeof readback.evidenceRef !== 'string' || !readback.evidenceRef.trim()) {
    return { status: 'UNKNOWN_OUTCOME', handoff, tool, reason: 'DISPATCH_EVIDENCE_MISSING', readback: readback.observation };
  }

  const acceptance = await evaluateAcceptance(
    input,
    handoff,
    readback.observation,
  );
  const failed = acceptance.find((item) => item.result !== 'PASS');

  if (failed) {
    // Readback contradicts or cannot confirm acceptance after an ambiguous
    // dispatch. Do not claim FAILED or VERIFIED.
    return {
      status: 'UNKNOWN_OUTCOME',
      handoff,
      tool,
      reason:
        failed.result === 'FAIL'
          ? 'READBACK_CONTRADICTS_ACCEPTANCE'
          : 'READBACK_ACCEPTANCE_UNKNOWN',
      readback: readback.observation,
    };
  }

  const receipt = buildReceipt(
    input,
    handoff,
    tool,
    argsHash,
    'VERIFIED',
    Date.now(),
    {
      observation: readback.observation,
      readbackRef: readback.evidenceRef,
      acceptance,
    },
  );
  let ref: {receiptRef:string} | null | undefined;
  try { ref = await input.host.writeReceipt?.(receipt); } catch { ref = null; }
  if (!ref || typeof ref.receiptRef!=='string' || !ref.receiptRef.trim()) {
    return { status:'UNKNOWN_OUTCOME', handoff, tool, reason:'RECEIPT_MISSING', readback:readback.observation };
  }
  const finalReceipt = ref
    ? { ...receipt, receipt_ref: ref.receiptRef }
    : receipt;
  await input.ledger?.complete(
    ledgerKey,
    'VERIFIED',
    Date.now(),
    ref?.receiptRef,
  );

  return {
    status: 'VERIFIED',
    handoff,
    tool,
    observation: readback.observation,
    receipt: finalReceipt,
    receiptRef: ref?.receiptRef,
  };
}

export async function dispatchGovernedObjective(
  input: GovernedExecutionInput,
): Promise<GovernedExecutionResult> {
  const argsSnapshot=snapshotArguments(input.args);
  if(!argsSnapshot) return {status:'INVALID_ARGUMENTS',issues:['$:INVALID_JSON_ARGUMENTS']};
  const principal=input.owner?.principalRef,tenant=input.owner?.tenantRef;
  if(typeof principal!=='string'||!principal.trim()||principal.length>256 ||
      (tenant!=null&&(typeof tenant!=='string'||!tenant.trim()||tenant.length>256)))
    return {status:'DENIED',reason:'INVALID_HOST_IDENTITY'};
  input={...input,args:argsSnapshot,owner:Object.freeze({principalRef:principal,tenantRef:tenant??null})};
  input.llmGuard?.assertNotCalled();

  /* Do not freeze the clock before async capability reads; owner may observe later. */
  const resolution = await resolveAgreedObjective(input.handoff, input.host, input.nowMs);

  if (!resolution.ok) {
    return { status: 'DENIED', reason: resolution.reason };
  }

  const { handoff, tools } = resolution;

  if (tools.length !== 1) {
    return {
      status: 'DENIED',
      reason: 'MULTI_CAPABILITY_REQUIRES_DETERMINISTIC_PLAN',
    };
  }

  const tool = tools[0]!;

  /* 2. Typed argument schema. Fail closed if the host cannot provide it. */
  const schema = input.host.readToolSchema
    ? await input.host.readToolSchema(tool)
    : null;

  if (!schema) {
    return { status: 'DENIED', reason: 'ARGUMENT_SCHEMA_UNAVAILABLE' };
  }

  const issues = validateToolArguments(schema.inputSchema, input.args);
  if (issues.length > 0) {
    return { status: 'INVALID_ARGUMENTS', issues };
  }

  const args = Object.freeze({ ...input.args });
  const argsHash = hashValue(args);

  /* 3. Idempotency: key is the contract key; fingerprint binds tool + args. */
  const ledgerKey = handoff.idempotency_key;
  const fingerprint = hashValue({ objective_ref: handoff.objective_ref, agreement_ref: handoff.agreement_ref, plan_hash: handoff.plan_hash, plan_version: handoff.plan_version, target_id: handoff.target_id, tool_id: tool.toolId, principal: input.owner.principalRef, tenant: input.owner.tenantRef ?? null, args_hash: argsHash });

  if (input.ledger) {
    const prior = await input.ledger.get(ledgerKey);

    if (prior) {
      if (prior.fingerprint !== fingerprint) {
        return { status: 'DENIED', reason: 'IDEMPOTENCY_CONFLICT' };
      }

      if (prior.state === 'VERIFIED') {
        return {
          status: 'DENIED',
          reason: 'IDEMPOTENT_REPLAY_VERIFIED',
          detail: prior.receiptRef,
        };
      }

      if (prior.state === 'FAILED') {
        return {
          status: 'DENIED',
          reason: 'IDEMPOTENT_REPLAY_FAILED',
          detail: prior.reason,
        };
      }

      if (prior.state === 'DISPATCHED' || prior.state === 'UNKNOWN_OUTCOME') {
        return reconcileUnknown(
          input,
          handoff,
          tool,
          schema,
          ledgerKey,
          argsHash,
          prior.state === 'DISPATCHED'
            ? 'PRIOR_DISPATCH_IN_FLIGHT'
            : 'PRIOR_UNKNOWN_OUTCOME',
        );
      }
    }
  } else if (tool.risk !== 'R0' || /^nostromo_tarea_iniciar(?:_mcp_.*)?$/.test(tool.toolId)) {
    // Starting a task has a persistent effect even if its declared risk is R0.
    return { status: 'DENIED', reason: 'IDEMPOTENCY_LEDGER_REQUIRED' };
  }

  /* 4. Last-moment owner checks before any side effect. */
  if (!(await input.host.verifyAgreement(handoff))) {
    return { status: 'DENIED', reason: 'AGREEMENT_REVOKED' };
  }

  if (!(await input.host.checkOwnerAuthority(handoff, tool))) {
    return { status: 'DENIED', reason: 'AUTHORITY_DENIED_AT_EXECUTION' };
  }

  if (input.ledger) {
    const began = await input.ledger.begin(ledgerKey, fingerprint, Date.now());
    if (!began) {
      return { status: 'DENIED', reason: 'IDEMPOTENCY_CONFLICT' };
    }
  }

  input.llmGuard?.assertNotCalled();

  /* 5. Dispatch through the existing MCP transport. */
  const startedAt = Date.now();
  let raw: McpToolCallResult;

  try {
    raw = await input.transport.callTool({
      name: tool.toolId,
      arguments: { ...args },
      timeoutMs: handoff.constraints.max_execution_seconds * 1000,
    });
  } catch {
    raw = { status: 'UNKNOWN_OUTCOME', reason: 'MCP_TRANSPORT_EXCEPTION' };
  }

  if (raw.status === 'ERROR') {
    const receipt = buildReceipt(
      input,
      handoff,
      tool,
      argsHash,
      'FAILED',
      startedAt,
      { reason: raw.errorCode },
    );
    await input.ledger?.complete(ledgerKey, 'FAILED', Date.now());
    const ref = await input.host.writeReceipt?.(receipt);
    return {
      status: 'FAILED',
      handoff,
      tool,
      reason: raw.message,
      errorCode: raw.errorCode,
      receipt: ref ? { ...receipt, receipt_ref: ref.receiptRef } : receipt,
    };
  }

  if (raw.status === 'UNKNOWN_OUTCOME') {
    await input.ledger?.markUnknown(ledgerKey, Date.now());
    return reconcileUnknown(
      input,
      handoff,
      tool,
      schema,
      ledgerKey,
      argsHash,
      raw.reason,
    );
  }

  const observation = raw.structuredContent ?? raw.content ?? null;

  /* 6. Readback. */
  const readback = await performReadback(input, handoff, tool, schema);

  if (!readback) {
    const receipt = buildReceipt(
      input,
      handoff,
      tool,
      argsHash,
      'EXECUTED_UNVERIFIED',
      startedAt,
      { observation, reason: 'READBACK_MISSING' },
    );
    await input.ledger?.markUnknown(ledgerKey, Date.now());
    const ref = await input.host.writeReceipt?.(receipt);
    return {
      status: 'EXECUTED_UNVERIFIED',
      handoff,
      tool,
      observation,
      receipt: ref ? { ...receipt, receipt_ref: ref.receiptRef } : receipt,
      reason: 'READBACK_MISSING',
    };
  }

  /* 7. Acceptance verification. */
  const acceptance = await evaluateAcceptance(
    input,
    handoff,
    readback.observation,
  );
  const failed = acceptance.find((item) => item.result !== 'PASS');

  const outcome = failed ? 'EXECUTED_UNVERIFIED' : 'VERIFIED';
  const receipt = buildReceipt(
    input,
    handoff,
    tool,
    argsHash,
    outcome,
    startedAt,
    {
      observation: readback.observation,
      readbackRef: readback.evidenceRef,
      acceptance,
      reason: failed?.result,
    },
  );

  let ref: {receiptRef:string} | null | undefined;
  try { ref = await input.host.writeReceipt?.(receipt); } catch { ref = null; }
  if (!failed && (!ref || typeof ref.receiptRef!=='string' || !ref.receiptRef.trim())) {
    await input.ledger?.markUnknown(ledgerKey, Date.now());
    return { status:'EXECUTED_UNVERIFIED',handoff,tool,observation:readback.observation,
      receipt:{...receipt,outcome:'EXECUTED_UNVERIFIED',reason:'RECEIPT_MISSING'},reason:'RECEIPT_MISSING' };
  }
  const finalReceipt = ref
    ? { ...receipt, receipt_ref: ref.receiptRef }
    : receipt;

  if (failed) await input.ledger?.markUnknown(ledgerKey, Date.now());
  else await input.ledger?.complete(ledgerKey, 'VERIFIED', Date.now(), ref?.receiptRef);

  if (failed) {
    return {
      status: 'EXECUTED_UNVERIFIED',
      handoff,
      tool,
      observation: readback.observation,
      receipt: finalReceipt,
      reason:
        failed.result === 'FAIL' ? 'ACCEPTANCE_FAILED' : 'ACCEPTANCE_UNKNOWN',
    };
  }

  return {
    status: 'VERIFIED',
    handoff,
    tool,
    observation: readback.observation,
    receipt: finalReceipt,
    receiptRef: ref?.receiptRef,
  };
}
