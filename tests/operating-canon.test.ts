import test from 'node:test';
import assert from 'node:assert/strict';

import { buildBootstrap, closeoutCheck } from '../src/operating/bootstrap';
import { proofNeedsRevalidation } from '../src/operating/reconcile';
import type { OperatingSnapshot } from '../src/operating/types';

function snapshot(): OperatingSnapshot {
  return {
    snapshotId: 's1',
    mode: 'SOURCE_ONLY',
    evidenceCutoffHead: 'abc',
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

test('bootstrap skips owned gap and live-only gap in SOURCE_ONLY', () => {
  const result = buildBootstrap(snapshot());
  assert.deepEqual(result.eligible, ['source']);
  assert.equal(result.nextAction, 'source');
});

test('closeout check is pure and reports gaps/proofs', () => {
  const result = closeoutCheck(snapshot());
  assert.equal(result.complete, false);
  assert.equal(result.openGaps.includes('source'), true);
});

test('proof invalidation depends on relevant fingerprint, not global HEAD', () => {
  const proof = snapshot().proofs[0];
  assert.equal(proofNeedsRevalidation(proof, 'same'), false);
  assert.equal(proofNeedsRevalidation(proof, 'changed'), true);
});
