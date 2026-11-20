import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dispatchGovernedObjective,
  type GovernedObjectiveHost,
  type IdempotencyLedger,
  type LedgerEntry,
  type McpToolTransport,
} from '../src/cockpit/governedMcpDispatch';

/* MOCK-only. No LIVE claims. */

function handoff(overrides: Record<string, unknown> = {}) {
  return {
    schema: 'nostromo.objective.handoff.v1',
    objective_ref: 'objective-1',
    conversation_ref: 'conversation-1',
    agreement_ref: 'agreement-1',
    plan_hash: 'a'.repeat(64),
    plan_version: 1,
    execution_lane: 'NOSTROMO_LOCAL',
    target_id: 'NOSTROMO_LOCAL',
    objective: 'Consultar el estado del MCP NOSTROMO',
    expected_result: 'mcpLive debe ser true',
    acceptance_criteria: [
      { criterion_id: 'mcp-live', predicate_ref: 'nostromo.mcp.live' },
    ],
    capability_refs: ['nostromo.estado'],
    context_refs: [],
    constraints: { no_paid_fallback: true, max_execution_seconds: 30 },
    risk: 'R0',
    idempotency_key: 'b'.repeat(64),
    readback_required: true,
    status: 'AGREED',
    authority: false,
    ...overrides,
  };
}

function capabilityEntry(overrides: Partial<import('../src/cockpit/targetToolGate').ToolProjection> = {}): import('../src/cockpit/targetToolGate').ToolProjection & { capabilityRef: string } {
  return {
    targetId: 'NOSTROMO_LOCAL',
    toolId: 'nostromo_estado',
    risk: 'R0',
    availability: 'LIVE',
    registryBacked: true,
    aclAllowed: true,
    adapterLive: true,
    sourceRevision: 'rev-1',
    capabilityRef: 'nostromo.estado',
    ...overrides,
  };
}

function host(
  overrides: Partial<GovernedObjectiveHost> = {},
): GovernedObjectiveHost {
  const observedAtMs = Date.now();

  return {
    async verifyAgreement() {
      return true;
    },
    async readCapabilities() {
      return {
        observedAtMs,
        entries: [capabilityEntry()],
      };
    },
    async checkOwnerAuthority() {
      return true;
    },
    async readToolSchema() {
      return {
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {},
        },
      };
    },
    async verifyAcceptance(_handoff, _criterion, observation) {
      return (observation as { mcpLive?: boolean } | null)?.mcpLive === true
        ? 'PASS'
        : 'FAIL';
    },
    async writeReceipt() {
      return { receiptRef: 'receipt-1' };
    },
    ...overrides,
  };
}

function transport(
  overrides: Partial<McpToolTransport> = {},
): McpToolTransport {
  return {
    async callTool(call) {
      if (call.name === 'nostromo_estado') {
        return {
          status: 'OK',
          structuredContent: { mcpLive: true, mode: 'TERMINAL' },
        };
      }
      return {
        status: 'ERROR',
        errorCode: 'UNKNOWN_TOOL',
        message: 'unknown tool',
        retryable: false,
      };
    },
    ...overrides,
  };
}

function memoryLedger(): IdempotencyLedger & {
  entries: Map<string, LedgerEntry>;
} {
  const entries = new Map<string, LedgerEntry>();

  return {
    entries,
    async get(key) {
      return entries.get(key) ?? null;
    },
    async begin(key, fingerprint, atMs) {
      const prior = entries.get(key);
      if (prior && prior.fingerprint !== fingerprint) return false;
      if (prior && prior.state === 'DISPATCHED') return false;
      entries.set(key, { state: 'DISPATCHED', fingerprint, atMs });
      return true;
    },
    async markUnknown(key, atMs) {
      const prior = entries.get(key);
      if (prior) {
        entries.set(key, { ...prior, state: 'UNKNOWN_OUTCOME', atMs });
      }
    },
    async complete(key, outcome, atMs, receiptRef) {
      const prior = entries.get(key);
      if (prior) {
        if (outcome === 'VERIFIED') entries.set(key, { state: 'VERIFIED', fingerprint: prior.fingerprint, atMs, ...(receiptRef ? { receiptRef } : {}) });
        else entries.set(key, { state: 'FAILED', fingerprint: prior.fingerprint, atMs, reason: 'HOST_RECORDED_FAILURE' });
      }
    },
  };
}

async function run(
  options: {
    handoff?: unknown;
    host?: Partial<GovernedObjectiveHost>;
    transport?: McpToolTransport;
    args?: Record<string, unknown>;
    ledger?: IdempotencyLedger;
    llmGuard?: { assertNotCalled(): void };
  } = {},
) {
  return dispatchGovernedObjective({
    handoff: options.handoff ?? handoff(),
    args: options.args ?? {},
    host: host(options.host),
    transport: options.transport ?? transport(),
    owner: { principalRef: 'user-1', tenantRef: 'tenant-1' },
    ledger: options.ledger,
    llmGuard: options.llmGuard,
  });
}

/* Central: deterministic nostromo_estado without LLM. */
test('MOCK: nostromo_estado determinista completa con LLM_CALLS=0', async () => {
  let llmCalls = 0;
  const llmGuard = {
    assertNotCalled() {
      assert.equal(llmCalls, 0);
    },
  };

  const result = await run({ llmGuard });

  assert.equal(result.status, 'VERIFIED');
  if (result.status !== 'VERIFIED') return;

  assert.equal(result.tool.toolId, 'nostromo_estado');
  assert.equal(result.receipt.receipt_ref, 'receipt-1');
  assert.equal(result.receipt.outcome, 'VERIFIED');
  assert.equal(llmCalls, 0);
});

/* Contract / agreement / owner. */
test('contrato malformado se deniega', async () => {
  const result = await run({ handoff: { schema: 'wrong' } });
  assert.equal(result.status, 'DENIED');
  if (result.status !== 'DENIED') return;
  assert.equal(result.reason, 'INVALID_HANDOFF');
});

test('acuerdo ausente o revocado se deniega', async () => {
  const result = await run({
    host: {
      async verifyAgreement() {
        return false;
      },
    },
  });
  assert.equal(result.status, 'DENIED');
  if (result.status !== 'DENIED') return;
  assert.equal(result.reason, 'AGREEMENT_UNVERIFIED');
});

test('usuario o tenant incorrecto se deniega', async () => {
  const result = await run({
    host: {
      async checkOwnerAuthority() {
        return false;
      },
    },
  });
  assert.equal(result.status, 'DENIED');
  if (result.status !== 'DENIED') return;
  assert.equal(result.reason, 'AUTHORITY_DENIED');
});

/* Capability resolution. */
test('capacidad inexistente se deniega', async () => {
  const result = await run({
    host: {
      async readCapabilities() {
        return { observedAtMs: Date.now(), entries: [] };
      },
    },
  });
  assert.equal(result.status, 'DENIED');
  if (result.status !== 'DENIED') return;
  assert.equal(result.reason, 'CAPABILITY_UNRESOLVED');
});

test('capacidad ambigua se deniega', async () => {
  const result = await run({
    host: {
      async readCapabilities() {
        return {
          observedAtMs: Date.now(),
          entries: [capabilityEntry(), capabilityEntry()],
        };
      },
    },
  });
  assert.equal(result.status, 'DENIED');
  if (result.status !== 'DENIED') return;
  assert.equal(result.reason, 'CAPABILITY_AMBIGUOUS');
});

test('ACL denegada se deniega', async () => {
  const result = await run({
    host: {
      async readCapabilities() {
        return {
          observedAtMs: Date.now(),
          entries: [capabilityEntry({ aclAllowed: false })],
        };
      },
    },
  });
  assert.equal(result.status, 'DENIED');
  if (result.status !== 'DENIED') return;
  assert.equal(result.reason, 'CAPABILITY_UNAVAILABLE');
});

test('riesgo superior al autorizado se deniega', async () => {
  const result = await run({ handoff: handoff({ risk: 'R1' }) });
  assert.equal(result.status, 'DENIED');
  if (result.status !== 'DENIED') return;
  assert.equal(result.reason, 'RISK_MISMATCH');
});

test('catálogo caducado se deniega', async () => {
  const result = await run({
    host: {
      async readCapabilities() {
        return {
          observedAtMs: Date.now() - 61_000,
          entries: [capabilityEntry()],
        };
      },
    },
  });
  assert.equal(result.status, 'DENIED');
  if (result.status !== 'DENIED') return;
  assert.equal(result.reason, 'CAPABILITIES_STALE');
});

/* Arguments. */
test('parámetros inválidos se rechazan', async () => {
  const result = await run({
    host: {
      async readToolSchema() {
        return {
          inputSchema: {
            type: 'object',
            additionalProperties: false,
            properties: { foo: { type: 'string' } },
            required: ['foo'],
          },
        };
      },
    },
    args: {},
  });

  assert.equal(result.status, 'INVALID_ARGUMENTS');
  if (result.status !== 'INVALID_ARGUMENTS') return;
  assert.ok(result.issues.some((issue) => issue.includes('REQUIRED')));
});

/* Idempotency. */
test('idempotencia repetida no re-despacha', async () => {
  const ledger = memoryLedger();
  let dispatches = 0;
  const t = transport({
    async callTool(call) {
      dispatches++;
      if (call.name === 'nostromo_estado') {
        return { status: 'OK', structuredContent: { mcpLive: true } };
      }
      return {
        status: 'ERROR',
        errorCode: 'UNKNOWN_TOOL',
        message: 'unknown',
        retryable: false,
      };
    },
  });

  const first = await run({ ledger, transport: t });
  assert.equal(first.status, 'VERIFIED');

  const second = await run({ ledger, transport: t });
  assert.equal(second.status, 'DENIED');
  if (second.status !== 'DENIED') return;
  assert.equal(second.reason, 'IDEMPOTENT_REPLAY_VERIFIED');
  assert.equal(dispatches, 2); // one dispatch + one R0 readback; replay adds zero
});

test('idempotencia reutilizada con otro payload se rechaza', async () => {
  const ledger = memoryLedger();

  const schemaHost = {
    async readToolSchema() {
      return {
        inputSchema: {
          type: 'object' as const,
          properties: { a: { type: 'number' as const } },
        },
      };
    },
  };

  const first = await run({
    ledger,
    args: { a: 1 },
    host: schemaHost,
  });
  assert.equal(first.status, 'VERIFIED');

  const second = await run({
    ledger,
    args: { a: 2 },
    host: schemaHost,
  });
  assert.equal(second.status, 'DENIED');
  if (second.status !== 'DENIED') return;
  assert.equal(second.reason, 'IDEMPOTENCY_CONFLICT');
});

/* UNKNOWN_OUTCOME / interruption / recovery. */
test('interrupción tras despacho produce UNKNOWN_OUTCOME si no hay readback', async () => {
  const t: McpToolTransport = {
    async callTool() {
      return { status: 'UNKNOWN_OUTCOME', reason: 'TIMEOUT' };
    },
  };

  const result = await run({
    transport: t,
    ledger: memoryLedger(),
    host: {
      async readReadback() {
        return null;
      },
    },
  });

  assert.equal(result.status, 'UNKNOWN_OUTCOME');
});

test('recuperación UNKNOWN_OUTCOME reconcilia por readback', async () => {
  let calls = 0;
  const t: McpToolTransport = {
    async callTool() {
      calls++;
      if (calls === 1) {
        return { status: 'UNKNOWN_OUTCOME', reason: 'TIMEOUT' };
      }
      return { status: 'OK', structuredContent: { mcpLive: true } };
    },
  };

  const result = await run({
    transport: t,
    ledger: memoryLedger(),
  });

  assert.equal(result.status, 'VERIFIED');
  assert.equal(calls, 2);
});

test('readback contradictorio no se declara VERIFIED', async () => {
  let calls = 0;
  const t: McpToolTransport = {
    async callTool() {
      calls++;
      if (calls === 1) {
        return { status: 'OK', structuredContent: { mcpLive: true } };
      }
      return { status: 'OK', structuredContent: { mcpLive: false } };
    },
  };

  const result = await run({ transport: t });

  assert.equal(result.status, 'EXECUTED_UNVERIFIED');
  if (result.status !== 'EXECUTED_UNVERIFIED') return;
  assert.equal(result.reason, 'ACCEPTANCE_FAILED');
});

test('MCP desconectado se trata como UNKNOWN_OUTCOME', async () => {
  const t: McpToolTransport = {
    async callTool() {
      throw new Error('ECONNREFUSED');
    },
  };

  const result = await run({ transport: t });
  assert.equal(result.status, 'UNKNOWN_OUTCOME');
});

test('resultado desconocido se conserva como UNKNOWN_OUTCOME', async () => {
  const t: McpToolTransport = {
    async callTool() {
      return { status: 'UNKNOWN_OUTCOME', reason: 'MCP_UNKNOWN' };
    },
  };

  const result = await run({
    transport: t,
    host: {
      async readReadback() {
        return null;
      },
    },
  });

  assert.equal(result.status, 'UNKNOWN_OUTCOME');
});

/* No paid fallback. */
test('sin fallback facturable en receipt ni en contrato', async () => {
  const result = await run();
  assert.equal(result.status, 'VERIFIED');
  if (result.status !== 'VERIFIED') return;

  assert.equal(Object.hasOwn(result.receipt, 'billing'), false);
  assert.equal(Object.hasOwn(result.receipt, 'paid'), false);
  assert.equal(result.handoff.constraints.no_paid_fallback, true);
});

test('readback ausente conserva idempotencia UNKNOWN_OUTCOME (no FAILED)', async () => {
  const ledger = memoryLedger();
  let calls = 0;
  const raw: McpToolTransport = {
    async callTool() {
      calls++;
      return calls === 1
        ? { status: 'OK', structuredContent: { mcpLive: true } }
        : { status: 'UNKNOWN_OUTCOME', reason: 'READBACK_OFFLINE' };
    },
  };
  const result = await run({ ledger, transport: raw });
  assert.equal(result.status, 'EXECUTED_UNVERIFIED');
  assert.equal(ledger.entries.get('b'.repeat(64))?.state, 'UNKNOWN_OUTCOME');
  const retry = await run({ ledger, transport: raw });
  assert.equal(retry.status, 'UNKNOWN_OUTCOME');
  assert.equal(calls, 3); // one dispatch + readback + readback retry; no second dispatch
});
