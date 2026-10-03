import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LLM_TOPOLOGIES,
  topologyById,
  topologyCanClaimLive,
} from '../src/llm/llmPlane';
import {
  evaluateModelRoute,
  mayAutoFallbackToPaid,
  modelRouteGrantsTargetAuthority,
} from '../src/llm/fallbackPolicy';

test('LLM plane includes separate direct/local/router/MANOJOS3 model paths', () => {
  assert.equal(LLM_TOPOLOGIES.length, 5);
  assert.equal(topologyById('local-model-plus-m3')?.actionPath, 'MANOJOS3_MCP');
  assert.equal(topologyById('manojos3-router-plus-m3')?.modelPath, 'MANOJOS3_MANAGED_LITELLM');
});

test('source-only topology never claims live', () => {
  const t=topologyById('direct-provider-plus-m3');
  assert.ok(t);
  assert.equal(topologyCanClaimLive(t!), false);
});

test('paid fallback is fail-closed', () => {
  assert.equal(mayAutoFallbackToPaid(), false);
  assert.equal(modelRouteGrantsTargetAuthority(), false);
});

test('source conflict blocks MANOJOS3 managed router promotion', () => {
  const t=topologyById('manojos3-router-plus-m3');
  assert.ok(t);
  assert.deepEqual(evaluateModelRoute(t!, {
    configured:true,
    reachable:true,
    zeroCostVerified:true,
    sourceConflict:true,
  }), {state:'BLOCKED',reason:'SOURCE_CONFLICT_REQUIRES_LIVE_READBACK'});
});
