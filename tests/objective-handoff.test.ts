import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { isObjectiveHandoff } from '../src/contracts/objectiveHandoff';
import { resolveAgreedObjective, type ObjectiveHandoffHost } from '../src/intent/nostromoDecisionBridge';
import { resolveNativeAgreedObjective } from '../src/librechat/nativeInferenceRouteAdapter';

const handoff = () => ({
  schema:'nostromo.objective.handoff.v1', objective_ref:'obj', conversation_ref:'chat', agreement_ref:'agreement',
  plan_hash:'a'.repeat(64), plan_version:1, execution_lane:'NOSTROMO_LOCAL', target_id:'NOSTROMO_LOCAL',
  objective:'Read state', expected_result:'State is returned', acceptance_criteria:[{criterion_id:'state',predicate_ref:'state-read'}],
  capability_refs:['state'], context_refs:[], constraints:{no_paid_fallback:true,max_execution_seconds:30},
  risk:'R0', idempotency_key:'b'.repeat(64), readback_required:true, status:'AGREED', authority:false,
});
const live = { capabilityRef:'state', targetId:'NOSTROMO_LOCAL',toolId:'nostromo_estado',risk:'R0' as const,
  availability:'LIVE' as const, registryBacked:true,aclAllowed:true,adapterLive:true,sourceRevision:'receipt' };
const host = (): ObjectiveHandoffHost => ({
  verifyAgreement:async()=>true,
  readCapabilities:async()=>({observedAtMs:1000,entries:[live]}),
  checkOwnerAuthority:async()=>true,
});

test('schema validates real contract vocabulary and rejects invalid lanes and authority', () => {
  assert.equal(isObjectiveHandoff(handoff()),true);
  for(const change of [
    {target_id:'VX13'}, {authority:true}, {readback_required:false}, {plan_hash:'bad'},
    {idempotency_key:'no'}, {constraints:{no_paid_fallback:false,max_execution_seconds:30}},
    {capability_refs:['state','state']}, {acceptance_criteria:[{criterion_id:'x',predicate_ref:'x',command:'sh'}]},
    {context_refs:['x'.repeat(513)]}, {extra:'unrecognized'},
  ]) assert.equal(isObjectiveHandoff({...handoff(),...change}),false, JSON.stringify(change));
  assert.equal(isObjectiveHandoff({...handoff(),execution_lane:'EXTERNAL_TARGET',target_id:'VX13'}),true);
});

test('resolution requires host agreement, fresh unambiguous live capabilities and owner authority', async () => {
  assert.equal((await resolveAgreedObjective(handoff(),host(),1000)).ok,true);
  const check = async (override:Partial<ObjectiveHandoffHost>,reason:string) => {
    const result=await resolveAgreedObjective(handoff(),{...host(),...override},1000);
    assert.deepEqual(result,{ok:false,reason,authority:false});
  };
  await check({verifyAgreement:async()=>false},'AGREEMENT_UNVERIFIED');
  await check({readCapabilities:async()=>({observedAtMs:-60001,entries:[live]})},'CAPABILITIES_STALE');
  await check({readCapabilities:async()=>({observedAtMs:1000,entries:[]})},'CAPABILITY_UNRESOLVED');
  await check({readCapabilities:async()=>({observedAtMs:1000,entries:[live,live]})},'CAPABILITY_AMBIGUOUS');
  await check({readCapabilities:async()=>({observedAtMs:1000,entries:[{...live,availability:'STALE'}]})},'CAPABILITY_UNAVAILABLE');
  await check({readCapabilities:async()=>({observedAtMs:1000,entries:[{...live,risk:'R2'}]})},'RISK_MISMATCH');
  await check({checkOwnerAuthority:async()=>false},'AUTHORITY_DENIED');
  await check({verifyAgreement:async()=>{throw Error('offline');}},'HOST_READ_FAILED');
  assert.deepEqual(await resolveAgreedObjective({...handoff(),status:'VERIFIED'},host(),1000),{ok:false,reason:'INVALID_HANDOFF',authority:false});
});

test('input is frozen before asynchronous host checks and cannot be replaced while waiting', async () => {
  const request=handoff();
  let resume!:()=>void;
  const wait=new Promise<void>((resolve)=>{resume=resolve;});
  let observed='';
  const h=host();
  h.verifyAgreement=async (snapshot)=>{await wait;observed=snapshot.plan_hash;return true;};
  const result=resolveAgreedObjective(request,h,1000);
  request.plan_hash='c'.repeat(64); resume();
  assert.equal((await result).ok,true);
  assert.equal(observed,'a'.repeat(64));
});

test('native entry resolves a deterministic preflight without an inference provider', async () => {
  const result=await resolveNativeAgreedObjective(handoff(),host(),1000);
  assert.equal(result.ok,true);
  if(result.ok) {
    assert.equal(result.tools[0].toolId,'nostromo_estado');
    assert.equal(result.authority,false);
  }
});
