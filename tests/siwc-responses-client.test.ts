import test from 'node:test';
import assert from 'node:assert/strict';
import {SiwcResponsesClient} from '../src/llm/siwcResponsesClient';
import type {SiwcAccountCredentials} from '../src/llm/siwcSession';
const account:SiwcAccountCredentials={
  clientId:'oaiapp_example',hostId:'urn:uuid:11111111-2222-4333-8444-555555555555',
  subject:'example',identity:{verification:'OIDC_JWKS_NONCE_AUD_VERIFIED',
    subject:'example',issuedClientId:'oaiapp_example',expectedNonce:'testnonce'},
  scopes:['openid','offline_access','resource.invoke','chatgpt.tokens.use.direct'],
  savedAtMs:1000,tokenExpiresAtMs:4000000,earliestRefreshAtMs:1000,
  accessToken:'example',refreshToken:'example',idToken:'example',
};
const models=[{slug:'test-model',label:'Testing'}];
const messages=[{role:'user' as const,content:'Hola'}];
test('OAuth model catalog and streaming complete in a local stub',async()=>{
  const transport=(async(input:unknown,options?:RequestInit)=>{
    if(String(input).endsWith('/models'))
      return new Response(JSON.stringify({models:[{slug:'test-model',display_name:'Testing',visibility:'list'}]}));
    const body=JSON.parse(String(options?.body));
    assert.equal(body.store,false);assert.equal(body.stream,true);
    return new Response('data: {"type":"response.output_text.delta","delta":"hola"}\n\n'+
      'data: {"type":"response.completed"}\n\ndata: [DONE]\n\n');
  }) as typeof fetch;
  const client=new SiwcResponsesClient(transport,()=>2000);
  assert.deepEqual(await client.listModels(account),models);
  const response=await client.textResponse(account,{model:'test-model',catalog:models,messages});
  assert.equal(response.text,'hola');assert.equal(response.completed,true);
  assert.equal(response.materialAuthority,false);
});
test('partial streams and denied permission fail closed',async()=>{
  let count=0;
  const transport=(async()=>{count++;return new Response('data: {"type":"response.output_text.delta","delta":"partial"}\n\n');}) as typeof fetch;
  const client=new SiwcResponsesClient(transport,()=>2000);
  await assert.rejects(client.textResponse(account,{model:'test-model',catalog:models,messages}),/UNKNOWN_OUTCOME/);
  await assert.rejects(client.textResponse({...account,scopes:['openid']},
    {model:'test-model',catalog:models,messages}),/CONSENT_REQUIRED/);
  assert.equal(count,1);
});
