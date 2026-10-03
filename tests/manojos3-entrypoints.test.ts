import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MANOJOS3_ACTION_MCP_TOOLS,
  MANOJOS3_ENTRYPOINTS,
  entrypointById,
} from '../src/manojos3/entrypoints';
import {
  buildManojos3SubmitArgs,
  libreChatShouldCallControlPlaneDirectly,
} from '../src/manojos3/submitProjection';

test('MANOJOS3 inbound MCP surface contains 14 bounded tools', () => {
  assert.equal(MANOJOS3_ACTION_MCP_TOOLS.length, 14);
  assert.equal(MANOJOS3_ACTION_MCP_TOOLS.includes('manojos_submit'), true);
  assert.equal(MANOJOS3_ACTION_MCP_TOOLS.includes('manojos_receipt'), true);
});

test('action and inference entrypoints are distinct', () => {
  const action=entrypointById('manojos3-action-mcp');
  const inference=entrypointById('manojos3-managed-litellm');
  assert.equal(action?.kind,'ACTION_MCP');
  assert.equal(inference?.kind,'INFERENCE_OPENAI_COMPATIBLE');
  assert.notEqual(action?.deploymentEnv,inference?.deploymentEnv);
});

test('LibreChat never bypasses MCP to call control plane directly', () => {
  assert.equal(libreChatShouldCallControlPlaneDirectly(), false);
});

test('submit projection defaults to bounded R1 objective', () => {
  assert.deepEqual(buildManojos3SubmitArgs('  revisa el estado  '),{
    objective:'revisa el estado',
    inputs:{},
    success_criteria:[],
    risk_ceiling:'R1',
    session_id:undefined,
    thread_id:undefined,
    request_id:undefined,
  });
});

test('all entrypoints remain authority false', () => {
  assert.equal(MANOJOS3_ENTRYPOINTS.every((entrypoint)=>entrypoint.authority===false),true);
});
