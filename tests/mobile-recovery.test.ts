import test from 'node:test';
import assert from 'node:assert/strict';

import { mobileLibreChatState } from '../src/mobile/mobileContinuity';
import {
  fencePossibleTargetEffect,
  handoffConversation,
  planConversationResume,
} from '../src/mobile/mobileRecovery';
import { canQueueOfflineTargetAction, reconnectDraftNeedsRevalidation } from '../src/mobile/offlineDraft';
import { pushCanCarryAuthorization, pushCanDeclareMaterialCompletion } from '../src/mobile/pushRefresh';

test('offline network with snapshot is read-only, not interactive', () => {
  assert.equal(mobileLibreChatState({
    networkReachable:false,
    backendReachable:false,
    snapshotAvailable:true,
    snapshotFresh:false,
  }), 'OFFLINE_READONLY');
});

test('backend down is explicit unavailable even if network exists', () => {
  assert.equal(mobileLibreChatState({
    networkReachable:true,
    backendReachable:false,
    snapshotAvailable:true,
    snapshotFresh:false,
  }), 'UNAVAILABLE');
});

test('same conversation moves across desktop/mobile without copying execution state', () => {
  const handoff=handoffConversation('c1','DESKTOP_WEB','MOBILE_WEB');
  assert.equal(handoff.conversationId,'c1');
  assert.equal(handoff.sameBackendHistory,true);
  assert.equal(handoff.copyLocalExecutionState,false);
  assert.equal(handoff.targetMutationReplay,false);
});

test('known active stream resumes UI stream only', () => {
  const plan=planConversationResume({
    conversationId:'c1',
    surface:'MOBILE_WEB',
    networkReachable:true,
    backendReachable:true,
    authenticated:true,
    localSnapshotAvailable:true,
    snapshotFresh:false,
    knownActiveStreamId:'s1',
    resumeProtocolAvailable:true,
  });
  assert.equal(plan.action,'RESUME_ACTIVE_STREAM');
  assert.equal(plan.mayReplayTargetMutation,false);
});

test('offline target actions are never queued', () => {
  assert.equal(canQueueOfflineTargetAction(),false);
  assert.equal(reconnectDraftNeedsRevalidation(),true);
});

test('possible material effect becomes unknown outcome and blocks retry', () => {
  assert.deepEqual(fencePossibleTargetEffect('MANOJOS3','op1'),{
    targetId:'MANOJOS3',
    operationId:'op1',
    state:'UNKNOWN_OUTCOME',
    retryAllowed:false,
    readbackRequired:true,
  });
});

test('push does not authorize or prove completion', () => {
  assert.equal(pushCanCarryAuthorization(),false);
  assert.equal(pushCanDeclareMaterialCompletion(),false);
});
