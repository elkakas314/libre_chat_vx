import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { insertion, patchNativeFileDeferral } from './native-file-deferral.mjs';

const apply = new Function('agent', 'hasDeferredTools', 'toolRegistry', 'toolDefinitions', `${insertion}\nreturn toolDefinitions;`);
const definitions = () => ['read_file', 'create_file', 'edit_file', 'tool_search', 'skill', 'nostromo_estado'].map((name) => ({ name, description: name, parameters: { type: 'object', properties: {} } }));
const map = (defs) => new Map(defs.map((def) => [def.name, { ...def }]));

test('defers only the three native file tools for the selected agent when discovery is present', () => {
  const defs = definitions();
  const registry = map(defs);
  const result = apply({ id: 'agent_9ex2a9buul2cwzyo' }, true, registry, defs);
  assert.deepEqual([...registry.values()].filter((d) => d.defer_loading).map((d) => d.name), ['read_file', 'create_file', 'edit_file']);
  assert.match(result.find((d) => d.name === 'tool_search').description, /read_file/);
  assert.equal(result.find((d) => d.name === 'skill').description, 'skill');
});

test('leaves other agents, missing discovery and incomplete registries unchanged', () => {
  for (const [id, enabled, missing] of [['other', true, ''], ['agent_9ex2a9buul2cwzyo', false, ''], ['agent_9ex2a9buul2cwzyo', true, 'tool_search'], ['agent_9ex2a9buul2cwzyo', true, 'read_file']]) {
    const defs = definitions(); const registry = map(defs); registry.delete(missing);
    assert.equal(apply({ id }, enabled, registry, defs), defs);
    assert.ok([...registry.values()].every((d) => !d.defer_loading));
  }
});

test('refuses an unrecognized bundle', () => assert.throws(() => patchNativeFileDeferral('unexpected'), /PREIMAGE_MISMATCH/));

test('installed API registrars and SDK binding retain discovery without inference', { skip: !process.env.NOSTROMO_UPSTREAM }, async () => {
  const root = process.env.NOSTROMO_UPSTREAM;
  const require = createRequire(`${root}/api/package.json`);
  const api = require('@librechat/api');
  const sdk = require('@librechat/agents');
  const { ChatOpenAI } = require('@langchain/openai');
  const { HumanMessage } = require('@langchain/core/messages');
  const { AgentContext } = require(`${root}/node_modules/@librechat/agents/dist/cjs/agents/AgentContext.cjs`);
  const registry = new Map();
  let defs = api.registerCodeExecutionTools({ toolRegistry: registry, toolDefinitions: [], includeBash: false, includeSkillFileInstructions: true }).toolDefinitions;
  defs = api.registerFileAuthoringTools({ toolRegistry: registry, toolDefinitions: defs, includeSkillFileInstructions: true }).toolDefinitions;
  const search = { name: 'tool_search', description: 'Search', parameters: { type: 'object', properties: {} } };
  registry.set(search.name, search); defs.push(search);
  const agent = { id: 'agent_9ex2a9buul2cwzyo' };
  const context = new AgentContext({ agentId: agent.id, provider: 'openai', toolRegistry: registry, toolDefinitions: defs });
  const names = () => context.getToolsForBinding().map((tool) => tool.name);
  let captured;
  const model = new ChatOpenAI({ model: 'fixture', apiKey: 'fixture', configuration: {
    baseURL: 'http://127.0.0.1:1/v1',
    fetch: async (_url, request) => {
      captured = JSON.parse(request.body);
      return new Response(JSON.stringify({ id: 'fixture', object: 'chat.completion', created: 1, model: 'fixture', choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  } });
  const captureNames = async () => {
    await sdk.initializeModel({ provider: 'openai', override: model, tools: context.getToolsForBinding() }).invoke([new HumanMessage('fixture')]);
    return captured.tools.map((tool) => tool.function.name);
  };
  assert.deepEqual(names(), ['read_file', 'create_file', 'edit_file', 'tool_search']);
  assert.deepEqual(await captureNames(), names());
  const count = (message) => String(message.content).length;
  await context.calculateInstructionTokens(count);
  const before = context.toolSchemaTokens;
  context.toolDefinitions = apply(agent, true, registry, defs);
  assert.deepEqual(names(), ['tool_search']);
  assert.deepEqual(await captureNames(), names());
  await context.calculateInstructionTokens(count);
  assert.ok(context.toolSchemaTokens < before);
  const toolSearch = sdk.createToolSearch({ mode: 'local', toolRegistry: registry });
  const found = await toolSearch.invoke({ query: 'read_file' });
  assert.match(JSON.stringify(found), /read_file/);
  context.markToolsAsDiscovered(['read_file']);
  assert.deepEqual(names(), ['read_file', 'tool_search']);
  assert.deepEqual(await captureNames(), names());
  await context.calculateInstructionTokens(count);
  assert.ok(context.toolSchemaTokens > 0 && context.toolSchemaTokens < before);
});
