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

test('continuity skips external/human/owned scopes and keeps independent SOURCE work eligible', () => {
  const state=snapshot();
  state.gaps=[
    state.gaps[0],
    state.gaps[1],
    {gapId:'external',summary:'external',state:'GATE_EXTERNAL',priority:0,scope:'cloudflare',requiresLive:true,dependencies:[]},
    {gapId:'human',summary:'human',state:'GATE_HUMAN',priority:0,scope:'approval',requiresLive:true,dependencies:[]},
    state.gaps[2],
    state.gaps[3],
  ];
  const plan=buildLivingPlan(state.mode,state.gaps,state.ownership);
  assert.deepEqual(plan.eligible,['source']);
  assert.deepEqual(plan.ownedReady,['owned']);
  assert.deepEqual(plan.blockedLive,['live']);
  assert.equal(plan.waitingInternal,false);
  assert.equal(plan.nextEligible,'source');
});

test('a fully externally blocked SOURCE_ONLY plan does not misreport WAITING_INTERNAL or COMPLETE', () => {
  const state=snapshot();
  state.gaps=[
    {gapId:'external',summary:'external',state:'GATE_EXTERNAL',priority:0,scope:'external',requiresLive:true,dependencies:[]},
    {gapId:'live',summary:'live',state:'OPEN',priority:1,scope:'account',requiresLive:true,dependencies:[]},
  ];
  const plan=buildLivingPlan(state.mode,state.gaps,state.ownership);
  assert.deepEqual(plan.eligible,[]);
  assert.equal(plan.waitingInternal,false);
  assert.deepEqual(plan.blockedLive,['live']);
  assert.equal(closeoutCheck(state).complete,false);
});

test('a previously OWNED gap does not silently become OPEN without explicit FREE evidence', () => {
  const state=snapshot();
  state.mode='LIVE_BOUND';
  state.gaps=[{gapId:'claimed',summary:'previously claimed',state:'OWNED',priority:1,scope:'risky',requiresLive:true,dependencies:[]}];
  for (const ownership of [
    [],
    [{scope:'risky',state:'UNOBSERVED' as const}],
    [{scope:'risky',state:'STALE_CLAIM' as const}],
  ]) {
    const plan=buildLivingPlan(state.mode,state.gaps,ownership);
    assert.deepEqual(plan.eligible,['claimed']); // eligible ONLY for RECONCILE_REQUIRED readback
    assert.equal(plan.waitingInternal,false);
  }
  const active=buildLivingPlan(state.mode,state.gaps,[{scope:'risky',state:'OWNED'}]);
  assert.deepEqual(active.eligible,[]);
  assert.deepEqual(active.ownedReady,['claimed']);
  const released=buildLivingPlan(state.mode,state.gaps,[{scope:'risky',state:'FREE'}]);
  assert.deepEqual(released.eligible,['claimed']);
});

test('an unreconciled ownership scope does not suppress independent eligible work', () => {
  const state=snapshot();
  state.mode='LIVE_BOUND';
  state.gaps=[
    {gapId:'unproven-release',summary:'check old claim',state:'OWNED',priority:1,scope:'risky',requiresLive:true,dependencies:[]},
    {gapId:'other',summary:'independent work',state:'OPEN',priority:2,scope:'independent',requiresLive:true,dependencies:[]},
  ];
  const plan=buildLivingPlan(state.mode,state.gaps,[]);
  assert.deepEqual(plan.eligible,['unproven-release','other']);
  assert.equal(plan.waitingInternal,false);
});
