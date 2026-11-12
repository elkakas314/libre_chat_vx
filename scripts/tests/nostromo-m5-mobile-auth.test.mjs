/** Node 22+ SOURCE canary for TypeScript mobile projection; no browser or host. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

// The root package is CommonJS; Node 22 point releases differ in how they
// expose named ESM exports for a directly imported .ts file. Strip types
// from the exact SOURCE and import as an explicit ESM data module, avoiding
// false failures from the package boundary. This tests SOURCE, not LIVE.
const mobileSource = new URL('../../src/mobile/mobileContinuity.ts', import.meta.url);
const mobileJavaScript = stripTypeScriptTypes(readFileSync(mobileSource, 'utf8'), {
  mode: 'strip'
});
const {mobileLibreChatState} = await import(
  'data:text/javascript;base64,' + Buffer.from(mobileJavaScript).toString('base64')
);

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
