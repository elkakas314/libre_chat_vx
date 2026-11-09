import test from 'node:test';
import assert from 'node:assert/strict';

import { planModelPool, type ModelCandidate } from '../src/llm/modelRegistry';

const now=10_000;
function candidate(id:string,overrides:Partial<ModelCandidate>={}):ModelCandidate {
  return {
    candidateId:id,
    provider:'provider',
    model:id,
    profiles:['NORMAL'],
    capabilities:['TEXT'],
    health:'READY',
    quotaState:'AVAILABLE',
    zeroCost:'VERIFIED_ZERO_COST',
    privacyAllowed:true,
    observedAtMs:now,
    latencyMs:100,
    quotaRemainingRatio:0.5,
    evidenceRefs:['live'],
    ...overrides,
  };
}

test('model registry keeps a larger admitted reserve pool behind active models', () => {
  const candidates=Array.from({length:10},(_,i)=>candidate('m'+i,{quotaRemainingRatio:1-i/20,latencyMs:100+i}));
  const plan=planModelPool('NORMAL',candidates,{activeTarget:6,nowMs:now});
  assert.equal(plan.active.length,6);
  assert.equal(plan.reserve.length,4);
  assert.equal(plan.authority,false);
});

test('billable or exhausted models are rejected rather than silently used', () => {
  const plan=planModelPool('NORMAL',[
    candidate('free'),
    candidate('paid',{zeroCost:'BILLABLE'}),
    candidate('empty',{quotaState:'EXHAUSTED'}),
  ],{nowMs:now});
  assert.equal(plan.active.some((x)=>x.candidateId==='free'),true);
  assert.equal(plan.rejected.length,2);
});

test('model candidate admission rejects absent, future and stale observation timestamps', () => {
  const cases = [
    [undefined,'READBACK_TIMESTAMP_REQUIRED'],
    [Number.NaN,'READBACK_TIMESTAMP_REQUIRED'],
    [now+1,'READBACK_FROM_FUTURE'],
    [now-300_001,'READBACK_STALE'],
  ] as const;
  for (const [observedAtMs,reason] of cases) {
    const plan=planModelPool('NORMAL',[candidate('invalid',{observedAtMs})],{nowMs:now});
    assert.equal(plan.active.length,0);
    assert.ok(plan.rejected[0].reasons.includes(reason));
  }
  assert.equal(planModelPool('NORMAL',[candidate('fresh')],{nowMs:now}).active.length,1);
});
