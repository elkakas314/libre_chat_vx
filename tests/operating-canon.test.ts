import test from 'node:test';
import assert from 'node:assert/strict';

import { buildBootstrap, closeoutCheck } from '../src/operating/bootstrap';
import { buildLivingPlan, proofNeedsRevalidation } from '../src/operating/reconcile';
import type { OperatingSnapshot } from '../src/operating/types';

function snapshot(): OperatingSnapshot {
  return {
    snapshotId: 's1',
    mode: 'SOURCE_ONLY',
    evidenceCutoffHead: 'abc',
    targetVersion: 1,
    git: { head:'abc', originMain:'abc', clean:true, status:'ALIGNED' },
    doNotTouch: ['local'],
    ownership: [{ scope:'busy', state:'OWNED', ownerRef:'other' }],
    proofs: [
      {
        proofId:'p1',
        subject:'source',
        proofClass:'SOURCE_READBACK',
        state:'VALID',
        dependencyFingerprint:'same',
        dependencies:['a'],
        evidenceRefs:['commit:a'],
      },
    ],
    gaps: [
      {
        gapId:'done',
        summary:'done',
        state:'PASS',
        priority:0,
        scope:'done',
        requiresLive:false,
        dependencies:[],
      },
      {
        gapId:'owned',
        summary:'owned',
        state:'OPEN',
        priority:1,
        scope:'busy',
        requiresLive:false,
        dependencies:['done'],
      },
      {
        gapId:'source',
        summary:'source',
        state:'OPEN',
        priority:2,
        scope:'free',
        requiresLive:false,
        dependencies:['done'],
      },
      {
        gapId:'live',
        summary:'live',
        state:'OPEN',
        priority:3,
        scope:'live',
        requiresLive:true,
        dependencies:['done'],
      },
    ],
  };
}

test('bootstrap emits canonical JSON shape and skips owned/live-only gaps in SOURCE_ONLY', () => {
  const result = buildBootstrap(snapshot());
  assert.equal(result.canon, 'LIBRECHAT_OPERATING_CANON');
  assert.equal(result.target_version, 1);
  assert.equal(result.snapshot_id, 's1');
  assert.deepEqual(result.eligible_source_only, ['source']);
  assert.deepEqual(result.blocked_live, ['live']);
  assert.deepEqual(result.ownership.owned, ['busy']);
  assert.equal(result.next_action, 'source');
});

test('dependency-cleared BLOCKED_DEPENDENCY reopens without editing the gap file', () => {
  const state = snapshot();
  state.mode = 'LIVE_BOUND';
  state.gaps = [
    state.gaps[0],
    {
      gapId:'was-blocked',
      summary:'dependency now satisfied',
      state:'BLOCKED_DEPENDENCY',
      priority:1,
      scope:'ready',
      requiresLive:true,
      dependencies:['done'],
    },
  ];

  const plan = buildLivingPlan(state.mode, state.gaps, state.ownership);
  assert.deepEqual(plan.eligible, ['was-blocked']);
});

test('WAITING_INTERNAL only applies when every dependency-ready actionable gap is owned', () => {
  const state = snapshot();
  state.gaps = [state.gaps[0], state.gaps[1]];
  const plan = buildLivingPlan(state.mode, state.gaps, state.ownership);
  assert.deepEqual(plan.eligible, []);
  assert.equal(plan.waitingInternal, true);
});

test('closeout check is pure and external gates do not become overall COMPLETE', () => {
  const state = snapshot();
  state.gaps = [
    state.gaps[0],
    {
      gapId:'external',
      summary:'external boundary',
      state:'GATE_EXTERNAL',
      priority:1,
      scope:'external',
      requiresLive:true,
      dependencies:['done'],
    },
  ];
  const result = closeoutCheck(state);
  assert.equal(result.complete, false);
  assert.equal(result.internalComplete, true);
  assert.deepEqual(result.externalGates, ['external']);
});

test('proof invalidation depends on relevant fingerprint, not global HEAD', () => {
  const proof = snapshot().proofs[0];
  assert.equal(proofNeedsRevalidation(proof, 'same'), false);
  assert.equal(proofNeedsRevalidation(proof, 'changed'), true);
});
