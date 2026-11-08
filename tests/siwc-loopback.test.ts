import test from 'node:test';
import assert from 'node:assert/strict';
import {openSiwcLoopback} from '../src/llm/siwcLoopback';
const hostId='urn:uuid:cb0d6cb9-991b-4f49-a1ab-96cbb21ec8af';
test('localhost callback starts before browser, validates state and completes once',async()=>{
  const attempt=await openSiwcLoopback({hostId,actualAppName:'LibreChat VX NOSTROMO',
    requestPlanUsage:true,timeoutMs:5000});
  try{
    const redirect=new URL(attempt.authorizationURL);
    assert.equal(redirect.searchParams.get('redirect_uri'),attempt.callbackURL);
    assert.equal(redirect.searchParams.get('client_id'),'dynamic_agent_client');
    const wrong=await fetch(attempt.callbackURL+'?state=wrong&client_id=oaiapp_valid&code=secret-code');
    assert.equal(wrong.status,400);
    const good=await fetch(attempt.callbackURL+'?state='+attempt.pending.state+
      '&client_id=oaiapp_valid&code=secret-code');
    assert.equal(good.status,200);
    assert.equal((await good.text()).includes('secret-code'),false);
    const result=await attempt.completed;
    assert.deepEqual(result,{code:'secret-code',issuedClientId:'oaiapp_valid'});
  } finally{await attempt.close();}
});
test('cancellation rejects one-shot attempt with no granted identity',async()=>{
  const a=await openSiwcLoopback({hostId,actualAppName:'LibreChat VX',requestPlanUsage:false,timeoutMs:5000});
  const pending=assert.rejects(a.completed,/CANCELLED/);
  await a.close();
  await pending;
});
test('listener rejects unreasonable timeout',async()=>{
  await assert.rejects(openSiwcLoopback({hostId,actualAppName:'LibreChat VX',
    requestPlanUsage:true,timeoutMs:0}),/TIMEOUT_INVALID/);
});
