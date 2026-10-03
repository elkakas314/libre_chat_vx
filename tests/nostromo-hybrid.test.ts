import test from 'node:test';
import assert from 'node:assert/strict';

import {
  NOSTROMO_HYBRID,
  chooseHybridLane,
  deriveHybridRuntimeMode,
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

test('only active architecture is NOSTROMO_HYBRID', () => {
  assert.equal(NOSTROMO_HYBRID.id,'NOSTROMO_HYBRID');
  assert.equal(NOSTROMO_HYBRID.freeReasoningRouter.paidFallbackAllowed,false);
});

test('actions bypass model routing and go to MANOJOS3 objective plane', () => {
  assert.equal(chooseHybridLane({
    conversationalOnly:false,
    needsDeepReasoning:true,
    needsCoding:true,
    needsLongContext:false,
    targetActionRequested:true,
  }), 'MANOJOS3_OBJECTIVE');
});

test('deep non-material reasoning uses free reasoner', () => {
  assert.equal(chooseHybridLane({
    conversationalOnly:false,
    needsDeepReasoning:true,
    needsCoding:false,
    needsLongContext:false,
    targetActionRequested:false,
  }), 'FREE_REASONING');
});

test('simple conversation stays local', () => {
  assert.equal(chooseHybridLane({
    conversationalOnly:true,
    needsDeepReasoning:false,
    needsCoding:false,
    needsLongContext:false,
    targetActionRequested:false,
  }), 'LOCAL_VOICE');
});

test('HUD does not depend on local voice or free reasoner', () => {
  assert.equal(tentacleHudDependsOnLocalVoice(),false);
  assert.equal(tentacleHudDependsOnReasoningRouter(),false);
  assert.equal(hudCanOperateWithoutLocalVoice(true),true);
  assert.equal(hudCanOperateWithoutFreeReasoner(true),true);
});

test('MCP-readable without local model degrades to HUD_ONLY', () => {
  assert.equal(deriveHybridRuntimeMode({
    libreChatAvailable:true,
    localVoiceAvailable:false,
    freeReasonerAvailable:false,
    manojos3McpReadable:true,
  }),'HUD_ONLY');
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
