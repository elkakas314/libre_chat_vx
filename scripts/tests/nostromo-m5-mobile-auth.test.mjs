/** Node 22+ SOURCE canary for TypeScript mobile projection; no browser or host. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mobileLibreChatState} from '../../src/mobile/mobileContinuity.ts';

test('an unauthenticated or unknown session cannot appear interactive',()=>{
 for(const authenticated of [undefined,false]){
  assert.equal(mobileLibreChatState({networkReachable:true,backendReachable:true,
   authenticated,snapshotAvailable:true,snapshotFresh:true}),'UNAVAILABLE');
 }
});

test('authenticated fresh history is locally PROJECTED interactive, not LIVE proof',()=>{
 assert.equal(mobileLibreChatState({networkReachable:true,backendReachable:true,
  authenticated:true,snapshotFresh:true}),'INTERACTIVE');
});

test('authenticated but stale history stays read-only',()=>{
 assert.equal(mobileLibreChatState({networkReachable:true,backendReachable:true,
  authenticated:true,snapshotFresh:false}),'STALE_READONLY');
});

test('backend outage is unavailable regardless of cached snapshot/auth',()=>{
 assert.equal(mobileLibreChatState({networkReachable:true,backendReachable:false,
  authenticated:true,snapshotAvailable:true,snapshotFresh:true}),'UNAVAILABLE');
});

test('offline snapshot never becomes interactive or an execution outbox',()=>{
 assert.equal(mobileLibreChatState({networkReachable:false,backendReachable:false,
  snapshotAvailable:true,snapshotFresh:true}),'OFFLINE_READONLY');
 assert.equal(mobileLibreChatState({networkReachable:false,backendReachable:false,
  snapshotAvailable:false,snapshotFresh:false}),'UNAVAILABLE');
});
