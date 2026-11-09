import test from 'node:test';
import assert from 'node:assert/strict';
import {OraculoAdvisoryBridge,projectOraculoReadback,validateOraculoRequest,
  type OraculoAdvisoryReadback} from '../src/adapters/oraculoAdvisoryBridge';
const good:OraculoAdvisoryReadback={
  endpointId:'ORACULO',requestId:'request-000004',status:'OK',observedAt:new Date(1_000_000).toISOString(),
  peerIdentityVerified:true,verificationPassed:true,evidenceRefs:['receipt:oraculo-123456'],
  receiptRef:'receipt:oraculo-123456',releaseId:'a0cb8966d521',value:{ready:true},
};
test('only advisory read operations and bounded references pass',()=>{
  assert.equal(validateOraculoRequest({operation:'ORACULO_HEALTH',requestId:'request-000001'}),true);
  assert.equal(validateOraculoRequest({operation:'ORACULO_QUERY',requestId:'request-000002',objective:'resume'}),true);
  assert.equal(validateOraculoRequest({operation:'ORACULO_QUERY',requestId:'short',objective:'a'}),false);
  assert.equal(validateOraculoRequest({operation:'ORACULO_QUERY',requestId:'request-000003'}),false);
  assert.equal(validateOraculoRequest({operation:'ORACULO_TOOL_REQUEST' as 'ORACULO_QUERY',requestId:'request-000003'}),false);
});
test('unbound adapter never calls a gateway and is unverified',async()=>{
  const b=new OraculoAdvisoryBridge();
  const x=await b.read({operation:'ORACULO_HEALTH',requestId:'request-000010'});
  assert.equal(x.status,'UNAVAILABLE');assert.equal(x.authority,false);
});
test('only fresh mTLS and verifier readback can project VERIFIED_READ',()=>{
  assert.equal(projectOraculoReadback(good,1_040_000).status,'VERIFIED_READ');
  assert.equal(projectOraculoReadback({...good,peerIdentityVerified:false},1_040_000).status,'NO_VERIFICADO');
  assert.equal(projectOraculoReadback({...good,verificationPassed:false},1_040_000).status,'NO_VERIFICADO');
  assert.equal(projectOraculoReadback({...good,evidenceRefs:[]},1_040_000).status,'NO_VERIFICADO');
  assert.equal(projectOraculoReadback(good,2_000_000).status,'NO_VERIFICADO');
  assert.equal(projectOraculoReadback({...good,status:'DEGRADED',peerIdentityVerified:false},1_040_000).status,'NO_VERIFICADO');
});
test('bridge delegates once, no mutations, never elevates degraded query',async()=>{
  let calls=0;
  const b=new OraculoAdvisoryBridge({invoke:async()=>{
    calls++;return {...good,status:'DEGRADED',value:'insufficient evidence'};
  }},()=>1_040_000);
  const x=await b.read({operation:'ORACULO_QUERY',requestId:'request-000004',objective:'¿estado?'});
  assert.equal(calls,1);assert.equal(x.status,'DEGRADED');
  assert.equal(x.authority,false);assert.equal(x.value,undefined);
});

test('response correlation mismatch and transport errors do not become verified read',async()=>{
  const wrong=new OraculoAdvisoryBridge({invoke:async()=>({...good,requestId:'request-other'})},()=>1_040_000);
  assert.equal((await wrong.read({operation:'ORACULO_HEALTH',requestId:'request-000004'})).status,'NO_VERIFICADO');
  const broken=new OraculoAdvisoryBridge({invoke:async()=>{throw new Error('sensitive internal error');}},()=>1_040_000);
  const result=await broken.read({operation:'ORACULO_HEALTH',requestId:'request-000004'});
  assert.equal(result.status,'UNAVAILABLE');
  assert.equal(JSON.stringify(result).includes('sensitive internal'),false);
});
