import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  NOSTROMO_HYBRID,
  chooseHybridLane,
  deriveHybridRuntimeMode,
  localModelRequired,
  tentacleHudDependsOnLocalVoice,
  tentacleHudDependsOnReasoningRouter,
} from '../src/llm/nostromoHybrid';
import { voiceMayChangeEvidence } from '../src/llm/responseContract';
import {
  acceptMaterialSuccess,
  capabilityIdIsHumanFacingPrimaryRoute,
  shouldAskUserForMissingSlot,
  shouldSubmitObjectiveForContextOnly,
} from '../src/manojos3/gptSemanticBridge';
import {
  hudCanOperateWithoutFreeReasoner,
  hudCanOperateWithoutLocalVoice,
} from '../src/manojos3/hudBridge';

test('Nostromo inference is Cloudflare-first and MANOJOS3 LiteLLM stays internal', () => {
  assert.equal(NOSTROMO_HYBRID.id,'NOSTROMO_HYBRID');
  assert.equal(NOSTROMO_HYBRID.primaryInferenceGateway.owner,'CLOUDFLARE_AI_GATEWAY');
  assert.equal(NOSTROMO_HYBRID.primaryInferenceGateway.paidFallbackAllowed,false);
  assert.equal(NOSTROMO_HYBRID.primaryInferenceGateway.semanticProfiles.includes('INVESTIGAR'),true);
  assert.equal(NOSTROMO_HYBRID.primaryInferenceGateway.semanticProfiles.includes('VISUALIZAR'),true);
  assert.equal(NOSTROMO_HYBRID.manojos3LiteLlm.role,'INTERNAL_ADVISORY_COMPATIBILITY');
  assert.equal(NOSTROMO_HYBRID.manojos3LiteLlm.primaryForLibreChat,false);
});

test('target actions bypass cognitive routing and go to TargetGateway objective plane', () => {
  assert.equal(chooseHybridLane({
    conversationalOnly:false,
    needsDeepReasoning:true,
    needsResearch:false,
    needsVisualization:false,
    needsLongContext:false,
    targetActionRequested:true,
  }), 'TARGET_OBJECTIVE');
});

test('conversation research and visualization use remote inference by default', () => {
  assert.equal(chooseHybridLane({
    conversationalOnly:true,
    needsDeepReasoning:false,
    needsResearch:true,
    needsVisualization:true,
    needsLongContext:false,
    targetActionRequested:false,
  }), 'REMOTE_INFERENCE');
  assert.equal(chooseHybridLane({
    conversationalOnly:true,
    needsDeepReasoning:false,
    needsResearch:false,
    needsVisualization:false,
    needsLongContext:false,
    targetActionRequested:false,
    preferLocalVoice:true,
  }), 'LOCAL_VOICE');
});

test('LibreChat remains conversational with local model absent', () => {
  assert.equal(localModelRequired(),false);
  assert.equal(deriveHybridRuntimeMode({
    libreChatAvailable:true,
    localVoiceAvailable:false,
    remoteInferenceAvailable:true,
    manojos3McpReadable:false,
  }),'REMOTE_ONLY');
});

test('MCP-readable without any inference route degrades to HUD_ONLY', () => {
  assert.equal(deriveHybridRuntimeMode({
    libreChatAvailable:true,
    localVoiceAvailable:false,
    remoteInferenceAvailable:false,
    manojos3McpReadable:true,
  }),'HUD_ONLY');
});

test('HUD does not depend on local voice or reasoning router', () => {
  assert.equal(tentacleHudDependsOnLocalVoice(),false);
  assert.equal(tentacleHudDependsOnReasoningRouter(),false);
  assert.equal(hudCanOperateWithoutLocalVoice(true),true);
  assert.equal(hudCanOperateWithoutFreeReasoner(true),true);
});

test('local voice never changes evidence semantics', () => {
  assert.equal(voiceMayChangeEvidence(),false);
});

test('MANOJOS3 semantic contract hides technical slots from user', () => {
  assert.equal(shouldAskUserForMissingSlot('TECHNICAL_MISSING_SLOT'),false);
  assert.equal(shouldAskUserForMissingSlot('SEMANTIC_MISSING_SLOT'),true);
  assert.equal(capabilityIdIsHumanFacingPrimaryRoute(),false);
  assert.equal(shouldSubmitObjectiveForContextOnly(),false);
});

test('material success requires receipt evidence and readback', () => {
  assert.equal(acceptMaterialSuccess(true,true,true),true);
  assert.equal(acceptMaterialSuccess(true,true,false),false);
});

test('NOSTROMO hybrid persisted v2 contract matches source schema, authority and seven routes', () => {
  const schema=JSON.parse(readFileSync('contracts/nostromo-hybrid.schema.json','utf8'));
  const config=JSON.parse(readFileSync('config/nostromo_hybrid.current.json','utf8'));
  const gateway=JSON.parse(readFileSync('config/cloudflare_ai_gateway.current.json','utf8'));
  for (const required of schema.required as string[]) {
    assert.ok(Object.hasOwn(config,required),'hybrid missing '+required);
  }
  assert.equal(config.architecture,schema.properties.architecture.const);
  assert.equal(config.authority,schema.properties.authority.const);
  assert.equal(config.authority,false);
  assert.equal(config.actions.authority,false);
  assert.equal(config.primary_inference.authority,false);
  assert.equal(Object.hasOwn(config,'free_reasoning'),false,'obsolete free_reasoning field');
  assert.deepEqual([...config.primary_inference.profiles].sort(),Object.keys(gateway.semantic_routes).sort());
  assert.equal(config.primary_inference.profiles.includes('CODIGO'),false);
});
