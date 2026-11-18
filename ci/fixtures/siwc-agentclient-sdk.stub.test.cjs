const test = require('node:test');
const assert = require('node:assert/strict');
const { ChatOpenAI } = require('@librechat/agents/llm/openai');
const { HumanMessage, ToolMessage } = require('@langchain/core/messages');

const siwcModule = process.env.NOSTROMO_SIWC_MODULE;
if (!siwcModule) throw new Error('NOSTROMO_SIWC_MODULE_REQUIRED');
const { createSiwcAgentClientRunAgent, createSiwcAgentClientRunBindingResolver } = require(siwcModule);
const { registerSiwcAgentClientResolver } = require(
  siwcModule.replace(/siwcOpenAiFetch\.js$/, 'siwcConnectionService.js'));
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
  const route = {
    kind: 'INFERENCE_ROUTE', lane: 'REMOTE_INFERENCE', profile: 'NORMAL',
    routeId: 'siwc:fixture', provider: 'CHATGPT_OAUTH_PLAN', model: 'visible-model',
    endpoint: 'openAI', nativeModel: 'visible-model', requiresGoalAgreement: false,
    requiresReadbackBeforeResponse: false, authority: false,
  };
  const resolver = createSiwcAgentClientRunBindingResolver({
    resolveRoute: async () => route,
    resolveAccount: async (userId) => {
    resolvedUserId = userId;
    return userId === 'librechat-user-fixture'
      ? { record, visibleModels: [{ slug: 'visible-model', label: 'Visible model' }] }
      : null;
    }, transport, now: () => now,
  });
  const app = { locals: {} };
  const unregister = registerSiwcAgentClientResolver(app, resolver);
  const persistedAgent = {
    id: 'nostromo-fixture', provider: 'ollama', model: 'qwen2.5:3b',
    instructions: 'Identidad persistente NOSTROMO',
    toolDefinitions: [{ name: 'nostromo_estado' }],
    model_parameters: { model: 'qwen2.5:3b', temperature: 0.1 },
  };
  const binding = await app.locals.nostromoSiwc.resolveAgentClientRunBinding({
    authenticatedUserId: 'librechat-user-fixture', agentId: persistedAgent.id,
    agent: persistedAgent, conversationId: 'conversation-fixture', messages: ['Hola'],
  });
  assert.ok(binding);
  const runAgent = createSiwcAgentClientRunAgent(persistedAgent, binding.route, binding.fetch);
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
  unregister();
  assert.equal(app.locals.nostromoSiwc, undefined);
});

test('native function tools are namespaced for SIWC, executed locally, and can return a final answer', async () => {
  const route = {
    kind: 'INFERENCE_ROUTE', lane: 'REMOTE_INFERENCE', profile: 'INVESTIGAR',
    routeId: 'siwc:fixture-tools', provider: 'CHATGPT_OAUTH_PLAN', model: 'visible-model',
    endpoint: 'openAI', nativeModel: 'visible-model', requiresGoalAgreement: false,
    requiresReadbackBeforeResponse: false, authority: false,
  };
  const responses = [
    'event: response.output_item.added\n' +
      'data: {"type":"response.output_item.added","output_index":0,"item":{"id":"fc_1","type":"function_call","call_id":"call_1","name":"nostromo.nostromo_estado","arguments":"","status":"in_progress"}}\n\n' +
      'event: response.function_call_arguments.delta\n' +
      'data: {"type":"response.function_call_arguments.delta","item_id":"fc_1","output_index":0,"call_id":"call_1","delta":"{}"}\n\n' +
      'event: response.output_item.done\n' +
      'data: {"type":"response.output_item.done","output_index":0,"item":{"id":"fc_1","type":"function_call","call_id":"call_1","name":"nostromo.nostromo_estado","arguments":"{}","status":"completed"}}\n\n' +
      'data: {"type":"response.completed","response":{"id":"resp_tool","status":"completed","output":[{"id":"fc_1","type":"function_call","call_id":"call_1","name":"nostromo.nostromo_estado","arguments":"{}","status":"completed"}]}}\n\n',
    'data: {"type":"response.output_text.delta","delta":"NOSTROMO está operativo."}\n\n' +
      'data: {"type":"response.completed","response":{"id":"resp_final","status":"completed","output":[]}}\n\n',
  ];
  const requests = [];
  const transport = async (url, init) => {
    requests.push({ url, init });
    return new Response(responses.shift(), { headers: { 'content-type': 'text/event-stream' } });
  };
  const resolver = createSiwcAgentClientRunBindingResolver({
    resolveRoute: async () => route,
    resolveAccount: async (userId) => userId === 'librechat-user-fixture'
      ? { record, visibleModels: [{ slug: 'visible-model', label: 'Visible model' }] }
      : null,
    transport, now: () => now,
  });
  const binding = await resolver.resolveAgentClientRunBinding({
    authenticatedUserId: 'librechat-user-fixture', agent: { id: 'nostromo-fixture' },
    conversationId: 'conversation-fixture', messages: ['Lee estado'],
  });
  assert.ok(binding);
  const runAgent = createSiwcAgentClientRunAgent({
    provider: 'ollama', model: 'qwen2.5:3b', model_parameters: {},
  }, binding.route, binding.fetch);
  const llm = new ChatOpenAI({ ...runAgent.model_parameters, model: runAgent.model });
  const withTools = llm.bindTools([{
    type: 'function', function: {
      name: 'nostromo_estado', description: 'Read NOSTROMO state',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  }]);

  const first = await withTools.invoke('Lee el estado de NOSTROMO.');
  assert.equal(first.tool_calls.length, 1);
  assert.equal(first.tool_calls[0].name, 'nostromo_estado');
  assert.deepEqual(first.tool_calls[0].args, {});
  const firstRequest = JSON.parse(requests[0].init.body);
  assert.equal(firstRequest.tools.length, 1);
  assert.equal(firstRequest.tools[0].type, 'namespace');
  assert.equal(firstRequest.tools[0].name, 'nostromo');
  assert.equal(firstRequest.tools[0].tools[0].name, 'nostromo_estado');
  assert.equal(firstRequest.store, false);

  // The native host executes the admitted R0 tool; this stub never touches the host.
  const localResult = 'Estado sintético de prueba: servicios disponibles.';
  const final = await withTools.invoke([
    new HumanMessage('Lee el estado de NOSTROMO.'), first,
    new ToolMessage({ content: localResult, tool_call_id: first.tool_calls[0].id }),
  ]);
  assert.equal(final.content[0]?.text ?? final.content, 'NOSTROMO está operativo.');
  const secondRequest = JSON.parse(requests[1].init.body);
  assert.ok(secondRequest.input.some((item) => item.type === 'function_call_output' &&
    item.call_id === first.tool_calls[0].id && item.output === localResult));
  assert.equal(secondRequest.store, false);
  assert.equal(secondRequest.stream, true);
  assert.equal(requests.length, 2);
});
