import test from 'node:test';
import assert from 'node:assert/strict';
import {
  startSiwc, acceptSiwcCallback, siwcExchangeRequest, siwcGrantState,
  siwcVisibleModels, siwcResponseBody, siwcRequireCompletion, type SiwcGrantReadback,
} from '../src/llm/chatgptAuthorized';
const hostId='urn:uuid:8c622827-47f7-4c89-a680-70f9f93125c0';
const callback='http://127.0.0.1:1455/auth/callback';
const begin=()=>startSiwc({hostId,callback,actualAppName:'LibreChat VX NOSTROMO',requestPlanUsage:true});
const grant:SiwcGrantReadback={
  identity:{verification:'OIDC_JWKS_NONCE_AUD_VERIFIED',subject:'subject1',
    issuedClientId:'oaiapp_valid',expectedNonce:'nonce1'},
  scopes:['openid','resource.invoke','chatgpt.tokens.use.direct'],
  tokenExpiresAtMs:3_800_000,expectedClientId:'oaiapp_valid',
  pendingNonce:'nonce1',nowMs:1_000_000,
};
test('SIWC authorization is loopback-only, random PKCE, no client secret',()=>{
  const p=begin(),uri=new URL(p.url);
  assert.equal(uri.searchParams.get('client_id'),'dynamic_agent_client');
  assert.equal(uri.searchParams.get('code_challenge_method'),'S256');
  assert.ok(uri.searchParams.get('scope')?.includes('chatgpt.tokens.use.direct'));
  assert.equal(uri.searchParams.has('client_secret'),false);
  assert.throws(()=>startSiwc({hostId,callback:'http://localhost:1455/auth/callback',
    actualAppName:'VX',requestPlanUsage:true}),/LOOPBACK/);
  assert.throws(()=>startSiwc({hostId:'email@example.com',callback,
    actualAppName:'VX',requestPlanUsage:true}),/HOST_ID/);
});
test('callback checks state, exact loopback URI and dynamic issued ID',()=>{
  const p=begin(),url=callback+'?state='+p.state+'&client_id=oaiapp_valid&code=code';
  const accepted=acceptSiwcCallback(p,url);
  const req=siwcExchangeRequest(p,accepted);
  assert.equal(accepted.issuedClientId,'oaiapp_valid');
  assert.equal(new URLSearchParams(req.body).get('code_verifier'),p.codeVerifier);
  assert.throws(()=>acceptSiwcCallback(p,callback+'?state=wrong&code=code&client_id=oaiapp_valid'),/STATE/);
  assert.throws(()=>acceptSiwcCallback(p,callback+'?state='+p.state+'&code=code'),/CLIENT_ID/);
  assert.throws(()=>acceptSiwcCallback(p,'http://127.0.0.1:1500/auth/callback?state='+p.state+'&client_id=oaiapp_valid&code=code'),/CALLBACK/);
});
test('reauthorization rejects switched client identity',()=>{
  const p=startSiwc({hostId,callback,actualAppName:'NOSTROMO',
    issuedClientId:'oaiapp_expected',requestPlanUsage:true});
  assert.throws(()=>acceptSiwcCallback(p,callback+'?state='+p.state+'&client_id=oaiapp_other&code=x'),/MISMATCH/);
});
test('verified identity, explicit scope and non-expired token required',()=>{
  assert.equal(siwcGrantState(grant),'AUTHORIZED');
  assert.equal(siwcGrantState({...grant,identity:null}),'IDENTITY_UNVERIFIED');
  assert.equal(siwcGrantState({...grant,scopes:['openid']}),'SCOPE_DENIED');
  assert.equal(siwcGrantState({...grant,tokenExpiresAtMs:1_000_000}),'EXPIRED');
  assert.equal(siwcGrantState({...grant,identity:{...grant.identity!,expectedNonce:'bad'}}),'IDENTITY_UNVERIFIED');
});
test('account-specific models and restricted Responses options',()=>{
  const catalog=siwcVisibleModels({models:[
    {slug:'allowed',display_name:'Available',visibility:'list'},
    {slug:'hidden',display_name:'Hidden',visibility:'hidden'},
  ]});
  assert.deepEqual(catalog,[{slug:'allowed',label:'Available'}]);
  const request=siwcResponseBody({grant,model:'allowed',liveCatalog:catalog,
    messages:[{role:'user',content:'hola'}]});
  assert.equal(request.store,false);assert.equal(request.stream,true);
  assert.equal(Object.hasOwn(request,'temperature'),false);
  assert.equal(Object.hasOwn(request,'previous_response_id'),false);
  assert.throws(()=>siwcResponseBody({grant,model:'hidden',liveCatalog:catalog,
    messages:[{role:'user',content:'hola'}]}),/MODEL_NOT_ADMITTED/);
  assert.throws(()=>siwcResponseBody({grant,model:'allowed',liveCatalog:catalog,
    messages:[{role:'system' as 'user',content:'disallowed'}]}),/UNSUPPORTED/);
});
test('response.failed or missing terminal response.completed fail closed',async()=>{
  async function* success(){yield {type:'response.output_text.delta'};yield {type:'response.completed'};}
  async function* unfinished(){yield {type:'response.output_text.delta'};}
  async function* failed(){yield {type:'response.failed'};}
  assert.equal(await siwcRequireCompletion(success()),'COMPLETED');
  await assert.rejects(siwcRequireCompletion(unfinished()),/UNKNOWN_OUTCOME/);
  await assert.rejects(siwcRequireCompletion(failed()),/RESPONSE_FAILED/);
});
