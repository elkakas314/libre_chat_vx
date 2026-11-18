import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveNativeInferenceRoute,
  type NativeInferenceRouteInput,
} from '../src/librechat/nativeInferenceRouteAdapter';
import type { ProviderRoute } from '../src/llm/inferenceGateway';

const now = 1_800_000_000_000;
const makeRoute = (overrides: Partial<ProviderRoute> = {}): ProviderRoute => ({
  id: 'groq-normal-live',
  profile: 'RAPIDO',
  provider: 'GROQ',
  model: 'provider-model',
  routeModel: 'dynamic/nostromo-rapido',
  locality: 'REMOTE',
  capabilities: ['TEXT'],
  health: 'READY',
  quotaState: 'AVAILABLE',
  zeroCost: 'VERIFIED_ZERO_COST',
  contextWindowTokens: 8192,
  privacyAllowed: true,
  paidFallbackAllowed: false,
  evidence: 'LIVE_READBACK',
  observedAtMs: now,
  authority: false,
  ...overrides,
});

const input = (routes: readonly ProviderRoute[], overrides: Partial<NativeInferenceRouteInput> = {}): NativeInferenceRouteInput => ({
  intentSignals: {},
  routes,
  bindModel: (route) => ({ endpoint: 'openAI', model: route.routeModel }),
  estimatedInputTokens: 1200,
  reservedOutputTokens: 800,
  nowMs: now,
  ...overrides,
});

test('native turn resolves the existing router to the mapped endpoint only for a fresh zero-cost route', () => {
  const result = resolveNativeInferenceRoute(input([makeRoute()]));
  assert.equal(result.kind, 'INFERENCE_ROUTE');
  if (result.kind !== 'INFERENCE_ROUTE') return;
  assert.equal(result.profile, 'RAPIDO');
  assert.equal(result.endpoint, 'openAI');
  assert.equal(result.nativeModel, 'dynamic/nostromo-rapido');
  assert.equal(result.authority, false);
});

test('native turn fails closed when the remote route is absent, stale, or not verified zero-cost', () => {
  for (const route of [
    makeRoute({ health: 'UNKNOWN' }),
    makeRoute({ zeroCost: 'UNKNOWN' }),
    makeRoute({ observedAtMs: now - 300_001 }),
  ]) {
    const result = resolveNativeInferenceRoute(input([route]));
    assert.equal(result.kind, 'NO_ADMITTED_ROUTE');
    if (result.kind === 'NO_ADMITTED_ROUTE') assert.equal(result.reason, 'NO_FRESH_ZERO_COST_ROUTE');
  }
  assert.equal(resolveNativeInferenceRoute(input([])).kind, 'NO_ADMITTED_ROUTE');
});

test('ChatGPT plan routes require explicit consent and remain distinct from zero-cost routes', () => {
  const planRoute = makeRoute({
    id: 'chatgpt-plan-live',
    provider: 'CHATGPT_OAUTH_PLAN',
    model: 'account-visible-model',
    routeModel: 'account-visible-model',
    zeroCost: 'UNKNOWN',
    billingClass: 'SUBSCRIPTION_SHARED',
    planUsageConsent: 'AUTHORIZED',
  });
  const admitted = resolveNativeInferenceRoute(input([planRoute]));
  assert.equal(admitted.kind, 'INFERENCE_ROUTE');
  if (admitted.kind === 'INFERENCE_ROUTE') assert.equal(admitted.provider, 'CHATGPT_OAUTH_PLAN');

  const denied = resolveNativeInferenceRoute(input([{
    ...planRoute,
    planUsageConsent: 'MISSING',
  }]));
  assert.equal(denied.kind, 'NO_ADMITTED_ROUTE');
  if (denied.kind === 'NO_ADMITTED_ROUTE') {
    assert.ok(denied.admissions[0]?.reasons.includes('PLAN_USAGE_CONSENT_REQUIRED'));
  }

  const metered = resolveNativeInferenceRoute(input([{
    ...planRoute,
    zeroCost: 'BILLABLE',
  }]));
  assert.equal(metered.kind, 'NO_ADMITTED_ROUTE');
  if (metered.kind === 'NO_ADMITTED_ROUTE') {
    assert.ok(metered.admissions[0]?.reasons.includes('METERED_BILLING_REJECTED'));
  }
});

test('explicit tool turns require provider tool capability and reserve completion tokens in context admission', () => {
  const noTools = makeRoute({ profile: 'INVESTIGAR', capabilities: ['TEXT'] });
  const noToolResult = resolveNativeInferenceRoute(input([noTools], { turnNeedsToolExecution: true }));
  assert.equal(noToolResult.kind, 'NO_ADMITTED_ROUTE');
  if (noToolResult.kind === 'NO_ADMITTED_ROUTE') {
    assert.ok(noToolResult.admissions[0]?.reasons.includes('CAPABILITY_TOOLS_MISSING'));
  }

  const tools = makeRoute({ profile: 'INVESTIGAR', capabilities: ['TEXT', 'STRUCTURED_OUTPUT', 'TOOLS'] });
  const tooSmall = resolveNativeInferenceRoute(input([tools], {
    turnNeedsToolExecution: true,
    estimatedInputTokens: 7500,
    reservedOutputTokens: 1000,
  }));
  assert.equal(tooSmall.kind, 'NO_ADMITTED_ROUTE');
  if (tooSmall.kind === 'NO_ADMITTED_ROUTE') {
    assert.ok(tooSmall.admissions[0]?.reasons.includes('CONTEXT_FIT_FAILED'));
  }
});

test('an ordinary turn without tool execution intent remains on the fast text route', () => {
  const textOnly = makeRoute({ profile: 'RAPIDO', capabilities: ['TEXT'] });
  const greeting = resolveNativeInferenceRoute(input([textOnly], {
    intentSignals: {},
    turnNeedsToolExecution: false,
  }));
  assert.equal(greeting.kind, 'INFERENCE_ROUTE');
  if (greeting.kind === 'INFERENCE_ROUTE') assert.equal(greeting.profile, 'RAPIDO');
});

test('local model is selected only by explicit simple-chat preference and never for tool turns', () => {
  const local = makeRoute({ id: 'local-small', provider: 'OLLAMA', locality: 'LOCAL', contextWindowTokens: 4096 });
  const explicit = resolveNativeInferenceRoute(input([local], {
    decisionHints: { preferLocalVoice: true },
  }));
  assert.equal(explicit.kind, 'INFERENCE_ROUTE');
  if (explicit.kind === 'INFERENCE_ROUTE') assert.equal(explicit.lane, 'LOCAL_VOICE');

  const toolTurn = resolveNativeInferenceRoute(input([local], {
    decisionHints: { preferLocalVoice: true },
    turnNeedsToolExecution: true,
  }));
  assert.equal(toolTurn.kind, 'NO_ADMITTED_ROUTE');
});

test('material intent stays conversational without a host handoff and returns only a handoff candidate after matching agreement', () => {
  const routes = [makeRoute({ profile: 'NORMAL' })];
  const pending = resolveNativeInferenceRoute(input(routes, {
    intentSignals: { wantsExternalChange: true, explicitTarget: 'MANOJOS3' },
  }));
  assert.equal(pending.kind, 'INFERENCE_ROUTE');
  if (pending.kind === 'INFERENCE_ROUTE') assert.equal(pending.requiresGoalAgreement, true);

  const agreed = resolveNativeInferenceRoute(input(routes, {
    intentSignals: { wantsExternalChange: true, explicitTarget: 'MANOJOS3' },
    decisionHints: {
      agreedTaskHandoff: {
        source: 'HOST_AUTHENTICATED_USER_AGREEMENT',
        targetId: 'MANOJOS3',
        objectiveRef: 'goal-1',
        planHash: 'a'.repeat(64),
        sessionRef: 'session-1',
      },
    },
  }));
  assert.equal(agreed.kind, 'GOVERNED_HANDOFF_CANDIDATE');
  if (agreed.kind === 'GOVERNED_HANDOFF_CANDIDATE') assert.equal(agreed.authority, false);
});

test('bad measured token budgets do not reach a model binding', () => {
  let bindingCalls = 0;
  const result = resolveNativeInferenceRoute(input([makeRoute()], {
    estimatedInputTokens: 0,
    bindModel: () => { bindingCalls += 1; return { endpoint: 'openAI', model: 'model' }; },
  }));
  assert.equal(result.kind, 'NO_ADMITTED_ROUTE');
  if (result.kind === 'NO_ADMITTED_ROUTE') assert.equal(result.reason, 'INVALID_TOKEN_BUDGET');
  assert.equal(bindingCalls, 0);
});
