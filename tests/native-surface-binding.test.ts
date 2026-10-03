import test from 'node:test';
import assert from 'node:assert/strict';

import {
  NATIVE_SURFACE_BINDINGS_CURRENT,
  NATIVE_LIBRECHAT_BINDING_SOURCE,
} from '../src/librechat/nativeSurfaceBinding';
import { chooseSharedPanel } from '../src/librechat/panelArbiter';
import {
  nativeToolApprovalGrantsTargetAuthorization,
  projectTargetAuthorizationResponse,
} from '../src/librechat/approvalBridge';
import {
  mayReplayTargetMaterialEffect,
  mayResumeUiStream,
  reconnectRequiresTargetReadback,
} from '../src/librechat/resumableBoundary';
import { targetToolActionEnabled } from '../src/librechat/accessComposition';

test('native surface bindings are pinned to exact upstream commit', () => {
  assert.equal(NATIVE_LIBRECHAT_BINDING_SOURCE.commit, 'f10b1d91f1eee3a2c82d5247bf620351486b7c1b');
  assert.equal(NATIVE_SURFACE_BINDINGS_CURRENT.length, 9);
  assert.equal(NATIVE_SURFACE_BINDINGS_CURRENT.every((binding) => binding.authority === false), true);
});

test('native active panels outrank Nostromo to avoid duplicate/stolen surfaces', () => {
  assert.deepEqual(chooseSharedPanel({
    artifactActive:true,
    subagentActive:true,
    nostromoRequested:true,
  }), {
    panel:'ARTIFACT',
    nostromoDeferred:true,
    reason:'NATIVE_ARTIFACT_ACTIVE',
  });
  assert.equal(chooseSharedPanel({
    artifactActive:false,
    subagentActive:true,
    nostromoRequested:true,
  }).panel, 'SUBAGENT');
  assert.equal(chooseSharedPanel({
    artifactActive:false,
    subagentActive:false,
    nostromoRequested:true,
  }).panel, 'NOSTROMO');
});

test('native ToolApproval never mints target authorization', () => {
  assert.equal(nativeToolApprovalGrantsTargetAuthorization(), false);
  const projected = projectTargetAuthorizationResponse({
    actionId:'a1',
    toolCallId:'tc1',
    allowedDecisions:['approve','reject'],
    selectedDecision:'approve',
    submitState:'idle',
  }, {
    targetId:'MANOJOS3',
    capabilityRef:'construction.apply',
    challengeRef:'challenge-1',
    authorizationAuthorityRef:'MANOJOS3_POLICY',
  });
  assert.equal(projected?.authority, false);
  assert.equal(projected?.directEffect, false);
});

test('resumable streams never replay target material effects', () => {
  assert.equal(mayResumeUiStream('CONVERSATION_GENERATION'), true);
  assert.equal(mayReplayTargetMaterialEffect('TARGET_SIDE_EFFECT'), false);
  assert.equal(reconnectRequiresTargetReadback(true), true);
});

test('native permission and target gate are conjunctive', () => {
  const tool={
    targetId:'MANOJOS3',
    toolId:'construction.apply',
    risk:'R2' as const,
    availability:'LIVE' as const,
    registryBacked:true,
    aclAllowed:true,
    adapterLive:true,
    sourceRevision:'x',
  };
  assert.equal(targetToolActionEnabled({nativeAllowed:true,targetTool:tool}), true);
  assert.equal(targetToolActionEnabled({nativeAllowed:false,targetTool:tool}), false);
});
