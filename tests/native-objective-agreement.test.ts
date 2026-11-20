import test from 'node:test';
import assert from 'node:assert/strict';
import { NativeObjectiveAgreement, mongoConversationAgreementStore,
  type AgreementScope, type AgreementState, type ConversationAgreementStore } from '../src/librechat/nativeObjectiveAgreement';
import { resolveNativeAgreedObjective } from '../src/librechat/nativeInferenceRouteAdapter';

const scope:AgreementScope={userId:'u1',tenantId:'t1',conversationId:'conversation'};
const proposal=()=>({schema:'nostromo.objective.handoff.v1',objective_ref:'obj',conversation_ref:'conversation',agreement_ref:'model-claim',
  plan_hash:'a'.repeat(64),plan_version:7,execution_lane:'NOSTROMO_LOCAL',target_id:'NOSTROMO_LOCAL',objective:'Read status',
  expected_result:'status returned',acceptance_criteria:[{criterion_id:'c',predicate_ref:'status-read'}],capability_refs:['nostromo_estado'],
  context_refs:[],constraints:{no_paid_fallback:true as const,max_execution_seconds:30},risk:'R0',idempotency_key:'b'.repeat(64),
  readback_required:true as const,status:'AGREED',authority:false as const});

class MemoryStore implements ConversationAgreementStore {
  state?:AgreementState;
  async read(input:AgreementScope) { return input.userId===scope.userId && input.tenantId===scope.tenantId && input.conversationId===scope.conversationId
    ? {found:true,state:this.state?structuredClone(this.state):undefined} : {found:false}; }
  async compareAndSwap(input:AgreementScope,expected:number,next:AgreementState) {
    if (!(await this.read(input)).found || (this.state?.revision??0)!==expected) return false;
    this.state=structuredClone(next); return true;
  }
}

test('preview requires an explicit confirmation; host derives plan, agreement and idempotency',async()=>{
  const store=new MemoryStore(), service=new NativeObjectiveAgreement(store);
  const preview=await service.preview(scope,proposal(),0);
  assert.equal(preview.ok,true); if(!preview.ok)return;
  assert.equal(preview.preview.plan_version,1);
  assert.notEqual(preview.preview.plan_hash,proposal().plan_hash);
  assert.equal('agreement_ref' in preview.preview,false);
  assert.equal('idempotency_key' in preview.preview,false);
  assert.equal('status' in preview.preview,false);
  assert.equal(preview.phase,'PREVIEWED');
  assert.equal(await service.verify(scope,proposal()),false);
  const wrong=await service.confirm(scope,1,'f'.repeat(64),preview.revision);
  assert.deepEqual(wrong,{ok:false,reason:'PLAN_MISMATCH'});
  const agreed=await service.confirm(scope,1,preview.preview.plan_hash,preview.revision);
  assert.equal(agreed.ok,true);if(!agreed.ok)return;
  assert.notEqual(agreed.handoff.agreement_ref,'model-claim');
  assert.notEqual(agreed.handoff.idempotency_key,proposal().idempotency_key);
  assert.equal(await service.verify(scope,agreed.handoff),true);
  assert.equal(await service.verify({...scope,userId:'other'},agreed.handoff),false);
  assert.equal(await service.verify({...scope,tenantId:'other'},agreed.handoff),false);
  assert.equal(await service.verify(scope,{...agreed.handoff,objective:'different'}),false);
  assert.equal(await service.verify(scope,{...agreed.handoff,idempotency_key:'c'.repeat(64)}),false);
  const retry=await service.confirm(scope,1,preview.preview.plan_hash,preview.revision);
  assert.equal(retry.ok,true);
  if(retry.ok)assert.equal(retry.handoff.agreement_ref,agreed.handoff.agreement_ref);
});

test('new preview invalidates the old agreement, retains history and rejects stale confirmation',async()=>{
 const store=new MemoryStore(), service=new NativeObjectiveAgreement(store);
 const p=await service.preview(scope,proposal(),0);assert.ok(p.ok);if(!p.ok)return;
 const a=await service.confirm(scope,1,p.preview.plan_hash,p.revision);assert.ok(a.ok);if(!a.ok)return;
 const p2=await service.preview(scope,{...proposal(),objective:'Changed'},a.revision);assert.ok(p2.ok);if(!p2.ok)return;
 assert.equal(p2.preview.plan_version,2);
 assert.equal(store.state?.plans.length,2);
 assert.equal(await service.verify(scope,a.handoff),false);
 assert.deepEqual(await service.confirm(scope,1,p.preview.plan_hash,p.revision),{ok:false,reason:'PLAN_MISMATCH'});
 assert.deepEqual(await service.preview(scope,proposal(),0),{ok:false,reason:'REVISION_CONFLICT'});
});

test('competing previews use a compare-and-swap and cannot both win',async()=>{
 const store=new MemoryStore(),service=new NativeObjectiveAgreement(store);
 const results=await Promise.all([service.preview(scope,proposal(),0),service.preview(scope,{...proposal(),objective:'other'},0)]);
 assert.equal(results.filter((r)=>r.ok).length,1);
 assert.equal(store.state?.plans.length,1);
});

test('native preflight reads the host agreement again after asynchronous authority checks',async()=>{
 const store=new MemoryStore(),service=new NativeObjectiveAgreement(store);
 const p=await service.preview(scope,proposal(),0);assert.ok(p.ok);if(!p.ok)return;
 const a=await service.confirm(scope,1,p.preview.plan_hash,p.revision);assert.ok(a.ok);if(!a.ok)return;
 const tool={capabilityRef:'nostromo_estado',targetId:'NOSTROMO_LOCAL',toolId:'nostromo_estado',risk:'R0' as const,
   availability:'LIVE' as const,registryBacked:true,aclAllowed:true,adapterLive:true,sourceRevision:'test'};
 const host={verifyAgreement:(handoff:unknown)=>service.verify(scope,handoff),
   readCapabilities:async()=>({observedAtMs:1000,entries:[tool]}),checkOwnerAuthority:async()=>true};
 assert.equal((await resolveNativeAgreedObjective(a.handoff,host,1000)).ok,true);
 const invalidatingHost={...host,checkOwnerAuthority:async()=>{
   const newer=await service.preview(scope,{...proposal(),objective:'new'},a.revision);
   assert.equal(newer.ok,true);return true;
 }};
 assert.deepEqual(await resolveNativeAgreedObjective(a.handoff,invalidatingHost,1000),
   {ok:false,reason:'AGREEMENT_UNVERIFIED',authority:false});
});

test('Mongo adapter scopes reads and writes by owner, tenant, retention and revision',async()=>{
 const calls:{op:string;filter:Record<string,unknown>;update?:Record<string,unknown>}[]=[];
 const memory=new MemoryStore();await new NativeObjectiveAgreement(memory).preview(scope,proposal(),0);
 assert.ok(memory.state);
 const store=mongoConversationAgreementStore({
  findOne:async(filter)=>{calls.push({op:'find',filter});return {};},
  updateOne:async(filter,update)=>{calls.push({op:'update',filter,update});return {matchedCount:1};},
 });
 assert.deepEqual(await store.read(scope),{found:true,state:undefined});
 assert.equal(await store.compareAndSwap(scope,0,memory.state),true);
 assert.equal(calls[0].filter.user,'u1');assert.equal(calls[0].filter.tenantId,'t1');
 assert.equal(calls[0].filter.conversationId,'conversation');assert.equal(calls[0].filter.subagentThread,null);
 assert.ok(Array.isArray(calls[0].filter.$or));
 assert.deepEqual(calls[1].filter.nostromoObjectiveAgreement,{$exists:false});
 assert.equal(await store.compareAndSwap(scope,1,{revision:3,plans:[]}),false);
 const noTenant={...scope,tenantId:null};await store.read(noTenant);
 assert.deepEqual(calls.at(-1)?.filter.tenantId,{$exists:false});
});
