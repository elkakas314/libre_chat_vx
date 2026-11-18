import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { registerSiwcAgentClientResolver, SiwcConnectionService,
  type SiwcAgentClientHostApp } from '../src/llm/siwcConnectionService';
import { SiwcProtectedFileVault } from '../src/llm/siwcProtectedVault';
import { startSiwc } from '../src/llm/chatgptAuthorized';

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

function signedIdToken(nonce:string){
  const header=Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT',kid:'siwc-test-key'})).toString('base64url');
  const payload=Buffer.from(JSON.stringify({iss:'https://auth.openai.com',aud:clientId,
    sub:'chatgpt-subject-test',nonce,iat:Math.floor(now/1000)-10,exp:Math.floor(now/1000)+3600})).toString('base64url');
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
