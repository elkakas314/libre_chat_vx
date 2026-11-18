const test = require('node:test');
const assert = require('node:assert/strict');
const { ChatOpenAI } = require('@librechat/agents/llm/openai');

const siwcModule = process.env.NOSTROMO_SIWC_MODULE;
if (!siwcModule) throw new Error('NOSTROMO_SIWC_MODULE_REQUIRED');
const { createSiwcAgentClientRunAgent, createSiwcOpenAiFetch } = require(siwcModule);
const now = 1_800_000_000_000;
const record = {
  clientId: 'oaiapp_fixture', hostId: 'urn:uuid:11111111-2222-4333-8444-555555555555',
  subject: 'synthetic-subject',
  identity: { verification: 'OIDC_JWKS_NONCE_AUD_VERIFIED', subject: 'synthetic-subject',
    issuedClientId: 'oaiapp_fixture', expectedNonce: 'synthetic-nonce' },
  scopes: ['openid', 'resource.invoke', 'chatgpt.tokens.use.direct'],
  savedAtMs: now - 1000, tokenExpiresAtMs: now + 60_000, earliestRefreshAtMs: now,
  accessToken: 'synthetic-test-token', refreshToken: null, idToken: 'synthetic-id-token',
};

test('installed LibreChat Agents SDK streams through the SIWC user-bound Responses transport', async () => {
  let request;
  const transport = async (url, init) => {
    request = { url, init };
    return new Response(
      'data: {"type":"response.output_text.delta","delta":"Hola."}\n\n' +
      'data: {"type":"response.completed","response":{"id":"resp_fixture","status":"completed","output":[]}}\n\n',
      { headers: { 'content-type': 'text/event-stream' } },
    );
  };
  let resolvedUserId;
  const fetchSiwc = createSiwcOpenAiFetch('librechat-user-fixture', async (userId) => {
    resolvedUserId = userId;
    return userId === 'librechat-user-fixture'
      ? { record, visibleModels: [{ slug: 'visible-model', label: 'Visible model' }] }
      : null;
  }, transport, () => now);
  const persistedAgent = {
    id: 'nostromo-fixture', provider: 'ollama', model: 'qwen2.5:3b',
    instructions: 'Identidad persistente NOSTROMO',
    toolDefinitions: [{ name: 'nostromo_estado' }],
    model_parameters: { model: 'qwen2.5:3b', temperature: 0.1 },
  };
  const route = {
    kind: 'INFERENCE_ROUTE', lane: 'REMOTE_INFERENCE', profile: 'NORMAL',
    routeId: 'siwc:fixture', provider: 'CHATGPT_OAUTH_PLAN', model: 'visible-model',
    endpoint: 'openAI', nativeModel: 'visible-model', requiresGoalAgreement: false,
    requiresReadbackBeforeResponse: false, authority: false,
  };
  const runAgent = createSiwcAgentClientRunAgent(persistedAgent, route, fetchSiwc);
  const llm = new ChatOpenAI({ ...runAgent.model_parameters, model: runAgent.model });
  const chunks = [];
  for await (const chunk of await llm.stream('Hola')) chunks.push(chunk.content);

  assert.equal(resolvedUserId, 'librechat-user-fixture');
  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  assert.equal(new Headers(request.init.headers).get('authorization'), 'Bearer synthetic-test-token');
  const body = JSON.parse(request.init.body);
  assert.equal(body.model, 'visible-model');
  assert.equal(body.store, false);
  assert.equal(body.stream, true);
  assert.ok(body.input.some((item) => item.role === 'user'));
  assert.equal(chunks[0][0].text, 'Hola.');
  assert.equal(JSON.stringify(runAgent).includes(record.accessToken), false);
  assert.equal(persistedAgent.model, 'qwen2.5:3b');
  assert.equal(persistedAgent.model_parameters.temperature, 0.1);
});
