import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { registerSiwcAgentClientResolver, SiwcConnectionService,
  type SiwcAgentClientHostApp } from '../src/llm/siwcConnectionService';
import { SiwcProtectedFileVault } from '../src/llm/siwcProtectedVault';
import { startSiwc } from '../src/llm/chatgptAuthorized';
import { authorizeSiwcTokens } from '../src/llm/siwcSession';

const now=1_900_000_000_000;
const clientId='oaiapp_service_test';
const hostId='urn:uuid:11111111-2222-4333-8444-555555555555';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const signingJwk={...publicKey.export({format:'jwk'}),kid:'siwc-test-key',alg:'RS256',use:'sig'};
const jwks={keys:[signingJwk]};

test('AgentClient resolver registers once and only its owner can remove it',()=>{
  const app:SiwcAgentClientHostApp={locals:{}};
  const resolver={resolveAgentClientRunBinding:async()=>null};
  const unregister=registerSiwcAgentClientResolver(app,resolver);
  assert.equal(app.locals.nostromoSiwc,resolver);
  assert.throws(()=>registerSiwcAgentClientResolver(app,{resolveAgentClientRunBinding:async()=>null}),
    /SIWC_AGENTCLIENT_RESOLVER_ALREADY_REGISTERED/);
  app.locals.nostromoSiwc={resolveAgentClientRunBinding:async()=>null};
  unregister();
  assert.ok(app.locals.nostromoSiwc);
});

test('LibreChat registration publishes the same consent-aware service to routes and AgentClient',()=>{
  const app:SiwcAgentClientHostApp={locals:{}};
  const vault={readForUser:async()=>null} as unknown as import('../src/llm/siwcSession').SiwcCredentialVault;
  const service=new SiwcConnectionService({hostId,actualAppName:'NOSTROMO',vault});
  const unregister=service.registerLibreChat(app,async()=>({kind:'NO_ADMITTED_ROUTE',
    lane:'REMOTE_INFERENCE',profile:'NORMAL',admissions:[],reason:'NO_FRESH_ZERO_COST_ROUTE',
    requiresGoalAgreement:false,requiresReadbackBeforeResponse:false,authority:false}));
  assert.equal(app.locals.nostromoSiwcConnectionService,service);
  assert.equal(typeof app.locals.nostromoSiwc?.resolveAgentClientRunBinding,'function');
  assert.throws(()=>service.registerLibreChat(app,async()=>{throw Error('must not run');}),
    /SIWC_CONNECTION_SERVICE_ALREADY_REGISTERED/);
  unregister();
  assert.equal(app.locals.nostromoSiwcConnectionService,undefined);
  assert.equal(app.locals.nostromoSiwc,undefined);
});

test('service route resolver delegates readback inputs to the existing inference gateway',async()=>{
  const vault={readForUser:async()=>null} as unknown as import('../src/llm/siwcSession').SiwcCredentialVault;
  const service=new SiwcConnectionService({hostId,actualAppName:'NOSTROMO',vault,now:()=>now});
  let readbackUser='';
  const resolveRoute=service.createNativeInferenceRouteResolver(async(context)=>{
    readbackUser=context.authenticatedUserId;
    return {
      intentSignals:{},
      routes:[{id:'siwc:visible-model',profile:'RAPIDO',provider:'CHATGPT_OAUTH_PLAN',
        model:'visible-model',routeModel:'visible-model',locality:'REMOTE',capabilities:['TEXT'],
        health:'READY',quotaState:'AVAILABLE',zeroCost:'UNKNOWN',billingClass:'SUBSCRIPTION_SHARED',
        planUsageConsent:'AUTHORIZED',contextWindowTokens:8192,privacyAllowed:true,
        paidFallbackAllowed:false,observedAtMs:now-1000,evidence:'LIVE_READBACK',authority:false}],
      bindModel:(route)=>({endpoint:'openAI',model:route.model}),
      estimatedInputTokens:100,reservedOutputTokens:100,nowMs:now,
    };
  });
  const result=await resolveRoute({authenticatedUserId:'librechat-user-A',agentId:'nostromo-agent',
    agent:{id:'nostromo-agent'},conversationId:'conversation-A',messages:[]});
  assert.equal(readbackUser,'librechat-user-A');
  assert.equal(result.kind,'INFERENCE_ROUTE');
  if(result.kind==='INFERENCE_ROUTE'){
    assert.equal(result.provider,'CHATGPT_OAUTH_PLAN');
    assert.equal(result.nativeModel,'visible-model');
  }
});

function signedIdToken(nonce:string,issuedAtSec=Math.floor(now/1000)-10){
  const header=Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT',kid:'siwc-test-key'})).toString('base64url');
  const payload=Buffer.from(JSON.stringify({iss:'https://auth.openai.com',aud:clientId,
    sub:'chatgpt-subject-test',nonce,iat:issuedAtSec,exp:Math.floor(now/1000)+3600})).toString('base64url');
  const input=`${header}.${payload}`;
  return `${input}.${sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url')}`;
}

test('SIWC connect binds signed plan consent to the LibreChat user and reads it back from the encrypted vault',async()=>{
  const directory=await mkdtemp(`${tmpdir()}/nostromo-siwc-connection-`);
  try{
    const vault=new SiwcProtectedFileVault(directory,randomBytes(32));
    let finish!: (accepted:{code:string;issuedClientId:string})=>void;
    let pendingAttempt:ReturnType<typeof startSiwc>|undefined;
    let tokenExchangeCount=0,modelReadCount=0,closed=0;
    const openLoopback=async(input:Parameters<typeof import('../src/llm/siwcLoopback').openSiwcLoopback>[0])=>{
      const {timeoutMs,...start}=input;
      pendingAttempt=startSiwc({...start,callback:'http://127.0.0.1:1455/auth/callback'});
      const completed=new Promise<{code:string;issuedClientId:string}>(resolve=>{finish=resolve;});
      return {pending:pendingAttempt,authorizationURL:pendingAttempt.url,completed,
        callbackURL:pendingAttempt.callback,close:async()=>{closed++;}};
    };
    const transport=(async(input:RequestInfo|URL,init?:RequestInit)=>{
      const url=String(input);
      if(url==='https://auth.openai.com/api/accounts/oauth/token'){
        tokenExchangeCount++;
        const body=new URLSearchParams(String(init?.body));
        assert.equal(body.get('code'),'synthetic-code');
        return Response.json({id_token:signedIdToken(pendingAttempt!.nonce),
          access_token:'synthetic-access-token',refresh_token:'synthetic-refresh-token',
          token_type:'Bearer',expires_in:3600,
          scope:'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct'});
      }
      if(url==='https://auth.openai.com/.well-known/jwks.json')return Response.json(jwks);
      if(url==='https://api.openai.com/v1/models'){
        modelReadCount++;
        assert.equal(new Headers(init?.headers).get('authorization'),'Bearer synthetic-access-token');
        return Response.json({models:[{slug:'visible-model',display_name:'Visible model',visibility:'list'}]});
      }
      throw Error('UNEXPECTED_TEST_ENDPOINT');
    }) as unknown as typeof fetch;
    const service=new SiwcConnectionService({hostId,actualAppName:'NOSTROMO',vault,transport,
      now:()=>now,openLoopback});
    const start=await service.startForUser('librechat-user-A');
    assert.equal(start.status,'CONSENT_REQUIRED');
    if(start.status!=='CONSENT_REQUIRED')return;
    assert.match(start.authorizationURL,/auth\.openai\.com\/api\/accounts\/authorize/);
    assert.match(start.authorizationURL,/chatgpt\.tokens\.use\.direct/);
    assert.doesNotMatch(start.authorizationURL,/synthetic-access-token/);
    finish({code:'synthetic-code',issuedClientId:clientId});
    const completion=await start.completion;
    assert.equal(completion.state.connected,true);
    assert.equal(completion.state.planUsage,'AUTHORIZED');
    assert.deepEqual(completion.models,[{slug:'visible-model',label:'Visible model'}]);
    assert.equal(JSON.stringify(completion).includes('synthetic-access-token'),false);
    const saved=await vault.readForUser('librechat-user-A');
    assert.equal(saved?.record.clientId,clientId);
    assert.equal(saved?.record.libreChatUserId,'librechat-user-A');
    assert.equal(await vault.readForUser('librechat-user-B'),null);
    assert.equal((await service.resolveAccount('librechat-user-A'))?.visibleModels[0]?.slug,'visible-model');
    assert.equal(await service.resolveAccount('librechat-user-B'),null);
    const already=await service.startForUser('librechat-user-A');
    assert.equal(already.status,'CONNECTED');
    assert.equal(tokenExchangeCount,1);
    assert.equal(modelReadCount,3);
    assert.ok(closed>=1);
  }finally{await rm(directory,{recursive:true,force:true});}
});

test('refresh rotation is encrypted before JWKS verification and resumes without reusing the consumed refresh token',async()=>{
  const directory=await mkdtemp(`${tmpdir()}/nostromo-siwc-refresh-`);
  try{
    const vault=new SiwcProtectedFileVault(directory,randomBytes(32));
    const pending=startSiwc({hostId,callback:'http://127.0.0.1:1455/auth/callback',
      actualAppName:'NOSTROMO',requestPlanUsage:true});
    const original=authorizeSiwcTokens({pending,issuedClientId:clientId,
      response:{id_token:signedIdToken(pending.nonce),access_token:'old-access',
        refresh_token:'old-refresh',token_type:'Bearer',expires_in:60,
        scope:'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct'},
      jwks,nowMs:now,authenticatedUserId:'librechat-user-A'});
    await vault.update(clientId,null,original);
    let currentNow=now+35_000,refreshCount=0,jwksAvailable=false,modelReadCount=0;
    const transport=(async(input:RequestInfo|URL,init?:RequestInit)=>{
      const url=String(input);
      if(url==='https://auth.openai.com/api/accounts/oauth/token'){
        refreshCount++;
        assert.equal(new URLSearchParams(String(init?.body)).get('refresh_token'),'old-refresh');
        return Response.json({id_token:signedIdToken('',Math.floor(currentNow/1000)),
          access_token:'new-access',refresh_token:'new-refresh',token_type:'Bearer',expires_in:3600});
      }
      if(url==='https://auth.openai.com/.well-known/jwks.json')
        return jwksAvailable?Response.json(jwks):Response.json({error:'temporary'}, {status:503});
      if(url==='https://api.openai.com/v1/models'){
        modelReadCount++;
        assert.equal(new Headers(init?.headers).get('authorization'),'Bearer new-access');
        return Response.json({models:[{slug:'visible-model',display_name:'Visible model',visibility:'list'}]});
      }
      throw Error('UNEXPECTED_TEST_ENDPOINT');
    }) as unknown as typeof fetch;
    const service=new SiwcConnectionService({hostId,actualAppName:'NOSTROMO',vault,transport,
      now:()=>currentNow});
    await assert.rejects(service.resolveAccount('librechat-user-A'),/SIWC_JWKS_FETCH_FAILED/);
    const checkpoint=await vault.readForUser('librechat-user-A');
    assert.equal(checkpoint?.record.accessToken,'old-access');
    assert.equal(checkpoint?.record.pendingRefresh?.accessToken,'new-access');
    assert.equal(checkpoint?.record.pendingRefresh?.refreshToken,'new-refresh');
    assert.equal(refreshCount,1);
    assert.equal(modelReadCount,0);

    jwksAvailable=true;
    const account=await service.resolveAccount('librechat-user-A');
    assert.equal(account?.record.accessToken,'new-access');
    assert.equal(account?.record.refreshToken,'new-refresh');
    assert.equal(account?.record.pendingRefresh,undefined);
    assert.deepEqual(account?.record.scopes,original.scopes);
    assert.equal(refreshCount,1);
    assert.equal(modelReadCount,1);
    const promoted=await vault.readForUser('librechat-user-A');
    assert.equal(promoted?.record.accessToken,'new-access');
    assert.equal(promoted?.record.pendingRefresh,undefined);
  }finally{await rm(directory,{recursive:true,force:true});}
});
