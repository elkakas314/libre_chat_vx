import test from 'node:test';
import assert from 'node:assert/strict';
import {Vx13LinkReadOnlyAdapter, type Vx13LinkReadback} from '../src/adapters/vx13LinkReadOnlyAdapter';
import {NostromoTargetGateway} from '../src/targets/targetGateway';
const ctx={principalRef:'principal_00001',tenantRef:'tenant_00001',sessionRef:'session_00001',
  requestId:'request_00001',expectedEpoch:'epoch_00001'};
const readback:Vx13LinkReadback={
  origin:'TENTACULO_LINK',endpointId:'VX13',requestId:ctx.requestId,tenantRef:ctx.tenantRef,
  epoch:ctx.expectedEpoch,status:'OK',observedAt:new Date(1000000).toISOString(),
  observedRevision:'revision_001',evidenceRefs:['evidence:vx13-1000'],
  authenticated:true,aclVerified:true,verificationPassed:true,value:{mode:'SOURCE_ONLY'},
};
test('VX13 adapter registers existing TargetGateway, no new authority',async()=>{
  const a=new Vx13LinkReadOnlyAdapter({invoke:async()=>readback},()=>1040000);
  const gw=new NostromoTargetGateway([a]);
  assert.deepEqual(gw.configuredTargets(),['VX13']);
  const r=await gw.read('VX13',{operation:'ui.snapshot',args:ctx});
  assert.equal(r.status,'OK');assert.equal(r.truth.truthClass,'EXTERNAL');
  assert.equal(r.truth.status,'VERIFIED');assert.equal(a.authority,false);
  assert.deepEqual(await a.discoverCapabilities(),[]);
  const mutation=await a.submitMutation({operationId:'m',targetId:'VX13',capabilityRef:'x',
    operation:'write'});
  assert.equal(mutation.status,'UNAVAILABLE');
});
test('unadmitted read ops and missing principal/epoch fail before transport',async()=>{
  let calls=0;
  const a=new Vx13LinkReadOnlyAdapter({invoke:async()=>{calls++;return readback;}},()=>1040000);
  assert.equal((await a.read({operation:'deleteAll',args:ctx})).status,'UNAVAILABLE');
  assert.equal((await a.read({operation:'health'})).status,'UNAVAILABLE');
  assert.equal((await a.read({operation:'ui.snapshot',args:{...ctx,other:'x'}})).status,'UNAVAILABLE');
  assert.equal(calls,0);
});
test('do not project result of wrong target, tenant, epoch, time, or ACL',async()=>{
  for(const change of [{tenantRef:'tenant_other'}, {epoch:'epoch_other'},
    {requestId:'other_request'}, {authenticated:false}, {aclVerified:false},
    {verificationPassed:false}, {evidenceRefs:[]},
    {observedAt:new Date(1000).toISOString()}]){
    const a=new Vx13LinkReadOnlyAdapter({invoke:async()=>({...readback,...change})},()=>1040000);
    const r=await a.read({operation:'health',args:ctx});
    assert.equal(r.status,'UNAVAILABLE');assert.equal(r.truth.status,'NO_VERIFICADO');
    assert.equal(r.value,undefined);
  }
});
test('transport errors are redacted and never retried',async()=>{
  let count=0;
  const a=new Vx13LinkReadOnlyAdapter({invoke:async()=>{count++;throw Error('private-token-here');}},()=>1040000);
  const r=await a.read({operation:'readiness',args:ctx});
  assert.equal(count,1);assert.equal(r.status,'UNAVAILABLE');
  assert.equal(JSON.stringify(r).includes('private-token-here'),false);
});
