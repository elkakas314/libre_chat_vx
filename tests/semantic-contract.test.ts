import test from 'node:test';
import assert from 'node:assert/strict';

import { providerBindingReady } from '../src/contracts/readinessTruth';
import { uiActionHasDirectMaterialEffect } from '../src/cockpit/actionLifecycle';
import { resolvedMutationTarget } from '../src/cockpit/systemTarget';
import { runClaimsMaterialCompletion } from '../src/cockpit/targetRun';

test('provider binding readiness is not material completion', () => {
  assert.equal(providerBindingReady({
    configured:true,
    channelEnabled:true,
    bindingReady:true,
    callableProbePassed:true,
    providerAvailable:true,
    observedAt:'2026-10-03T00:00:00Z',
  }), true);
});

test('UiAction never has direct material effect', () => {
  assert.equal(uiActionHasDirectMaterialEffect({
    actionId:'a1',
    targetScope:'VX13',
    resolvedTargetId:'VX13',
    capabilityRef:'x',
    intent:'prepare',
    previewOnly:false,
    authorizationRef:'owner-issued-ref',
  }), false);
});

test('BOTH/AUTO never resolve to a mutation target', () => {
  assert.equal(resolvedMutationTarget('BOTH'), null);
  assert.equal(resolvedMutationTarget('AUTO'), null);
});

test('SUCCEEDED without the full proof triplet is not material completion', () => {
  assert.equal(runClaimsMaterialCompletion({
    runRef:'r1',
    targetId:'MANOJOS3',
    executionChain:['KERNEL','READBACK','VERIFIER','RECEIPT'],
    state:'SUCCEEDED',
    stages:[],
    proof:{readbackRef:'rb'},
  }), false);
});

test('material completion requires readback, verification and receipt', () => {
  assert.equal(runClaimsMaterialCompletion({
    runRef:'r2',
    targetId:'VX13',
    executionChain:['MADRE','SPAWNER_HIJA','READBACK','MADRE_VERIFICATION','RECEIPT'],
    state:'SUCCEEDED',
    stages:[],
    proof:{
      readbackRef:'rb',
      verificationRef:'vr',
      receiptRef:'rr',
    },
  }), true);
});
