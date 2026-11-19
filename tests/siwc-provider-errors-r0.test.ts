import test from 'node:test';
import assert from 'node:assert/strict';
import {SiwcProviderFailure,SiwcResponsesClient} from '../src/llm/siwcResponsesClient';
import type {SiwcAccountCredentials} from '../src/llm/siwcSession';

const account:SiwcAccountCredentials={
  clientId:'oaiapp_fixture',hostId:'urn:uuid:11111111-2222-4333-8444-555555555555',
  subject:'owner',identity:{verification:'OIDC_JWKS_NONCE_AUD_VERIFIED',
    subject:'owner',issuedClientId:'oaiapp_fixture',expectedNonce:'nonce'},
  scopes:['openid','offline_access','resource.invoke','chatgpt.tokens.use.direct'],
  savedAtMs:1000,tokenExpiresAtMs:4000000,earliestRefreshAtMs:1000,
  accessToken:'fixture-only',refreshToken:'fixture-only',idToken:'fixture-only',
};
const request={model:'fixture-model',catalog:[{slug:'fixture-model',label:'Fixture'}],
  messages:[{role:'user' as const,content:'Hola'}]};
const client=(response:Response)=>new SiwcResponsesClient(
  (async()=>response) as unknown as typeof fetch,()=>2000);
function event(value:unknown):Response {
  return new Response('data: '+JSON.stringify(value)+'\n\n',{
    headers:{'x-request-id':'req_local_123','content-type':'text/event-stream'},
  });
}
async function inspect(response:Response,expected:{
  message:string;code?:string;http?:number;
  shape?:'error'|'detail'|'unknown';terminal?:'response.failed'|'response.incomplete';
}) {
  await assert.rejects(client(response).textResponse(account,request),error=>{
    assert.ok(error instanceof SiwcProviderFailure);
    assert.equal(error.message,expected.message);
    assert.equal(error.httpStatus,expected.http);
    assert.equal(error.providerCode,expected.code);
    assert.equal(error.responseShape,expected.shape);
    assert.equal(error.terminalEvent,expected.terminal);
    assert.equal(error.requestId,'req_local_123');
    assert.doesNotMatch(error.message,/fixture-only|Hola/);
    return true;
  });
}
test('SIWC failed event preserves safe quota-limit code, without declaring completion',async()=>{
  await inspect(event({type:'response.failed',response:{
    error:{code:'subscription_sharing_usage_limit_exceeded',message:'Not displayed'},
  }}),{message:'SIWC_RESPONSE_NOT_COMPLETED',
    code:'subscription_sharing_usage_limit_exceeded',terminal:'response.failed'});
});
test('SIWC incomplete event is terminal failure with typed code',async()=>{
  await inspect(event({type:'response.incomplete',response:{
    error:{code:'subscription_sharing_usage_unavailable'},
  }}),{message:'SIWC_RESPONSE_NOT_COMPLETED',
    code:'subscription_sharing_usage_unavailable',terminal:'response.incomplete'});
});
test('SIWC HTTP 429 preserves subscription limit code and status',async()=>{
  await inspect(new Response(JSON.stringify({error:{
    code:'subscription_sharing_usage_limit_exceeded',message:'No secrets here',
  }}),{status:429,headers:{'x-request-id':'req_local_123'}}),{
    message:'SIWC_RESPONSES_HTTP_429',http:429,
    shape:'error',code:'subscription_sharing_usage_limit_exceeded'});
});
test('SIWC prestream 503 supports nonstandard detail shape without text leakage',async()=>{
  await inspect(new Response(JSON.stringify({detail:'untrusted text'}),{
    status:503,headers:{'x-request-id':'req_local_123'},
  }),{message:'SIWC_RESPONSES_HTTP_503',http:503,shape:'detail'});
});
test('SIWC oversized HTTP error body is canceled at the read limit',async()=>{
  let canceled=false;
  const body=new ReadableStream<Uint8Array>({
    pull(controller){controller.enqueue(new Uint8Array(32_769));},
    cancel(){canceled=true;},
  });
  await inspect(new Response(body,{status:502,
    headers:{'x-request-id':'req_local_123'}}),{
    message:'SIWC_RESPONSES_HTTP_502',http:502,shape:'unknown',
  });
  assert.equal(canceled,true);
});
test('SIWC untrusted codes are never echoed as diagnostic text',async()=>{
  await inspect(event({type:'response.failed',response:{
    error:{code:'sensitive model=foo; bearer=token'},
  }}),{message:'SIWC_RESPONSE_NOT_COMPLETED',terminal:'response.failed'});
});
