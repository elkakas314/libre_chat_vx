import test from 'node:test';
import assert from 'node:assert/strict';
import { mountSiwcConnectionApi, type SiwcConnectionRouter,
  type SiwcHttpHandler, type SiwcHttpResponse } from '../src/llm/siwcConnectionApi';

type Route={method:'GET'|'POST';handlers:SiwcHttpHandler[]};
function harness(){
  const routes:Route[]=[];
  const router:SiwcConnectionRouter={
    get(_path,...handlers){routes.push({method:'GET',handlers});},
    post(_path,...handlers){routes.push({method:'POST',handlers});},
  };
  let statusCode=200;
  let body:unknown;
  const response:SiwcHttpResponse={
    status(code){statusCode=code;return this;},
    json(value){body=value;return value;},
  };
  async function call(method:Route['method'],path:string,userId?:string){
    // The API registers state, connect, cancel in this order.
    const index=path==='/state'?0:path==='/connect'?1:2;
    const selected=routes[index];
    assert.equal(selected?.method,method);
    statusCode=200;body=undefined;
    const request={user:userId?{id:userId}:undefined,body:{userId:'attacker-controlled'}};
    const run=(at:number):Promise<void>=>new Promise((resolve,reject)=>{
      if(at>=selected!.handlers.length){resolve();return;}
      let advanced=false;
      const next=(error?:unknown)=>{
        if(advanced)return;
        advanced=true;
        if(error){reject(error);return;}
        void run(at+1).then(resolve,reject);
      };
      try{
        const result=selected!.handlers[at]!(request,response,next);
        if(result&&typeof (result as Promise<unknown>).then==='function')
          void (result as Promise<unknown>).then(()=>{if(!advanced)resolve();},reject);
        else if(!advanced)resolve();
      }catch(error){reject(error);}
    });
    await run(0);
    return {statusCode,body};
  }
  return {routes,router,call};
}

test('SIWC account routes require auth and CSRF and derive the account only from the session',async()=>{
  const h=harness();
  const userIds:string[]=[];
  let authCalls=0,csrfCalls=0;
  const auth:SiwcHttpHandler=(_req,_res,next)=>{authCalls++;next();};
  const csrf:SiwcHttpHandler=(_req,_res,next)=>{csrfCalls++;next();};
  const service={
    startForUser:async(userId:string)=>{
      userIds.push(userId);
      return {status:'CONSENT_REQUIRED' as const,
        authorizationURL:'https://auth.openai.com/api/accounts/authorize?client_id=public-client',
        completion:Promise.resolve({state:{clientId:'public-client',connected:true,
          planUsage:'DISABLED' as const,hostId:'host-fixture',subjectRef:'REDACTED',expiresAtMs:0},models:[]}),
        cancel:async()=>{},
      };
    },
    publicStateForUser:async(userId:string)=>{
      userIds.push(userId);return {status:'DISCONNECTED' as const};
    },
    cancelForUser:async(userId:string)=>{userIds.push(userId);},
  };
  mountSiwcConnectionApi({router:h.router,service,requireAuthenticatedUser:auth,verifyCsrf:csrf});

  const connect=await h.call('POST','/connect','librechat-user-1');
  assert.equal(connect.statusCode,202);
  assert.deepEqual(connect.body,{status:'CONSENT_REQUIRED',
    authorizationURL:'https://auth.openai.com/api/accounts/authorize?client_id=public-client'});
  await h.call('GET','/state','librechat-user-1');
  await h.call('POST','/cancel','librechat-user-1');
  assert.deepEqual(userIds,['librechat-user-1','librechat-user-1','librechat-user-1','librechat-user-1']);
  assert.equal(authCalls,3);
  assert.equal(csrfCalls,2);
});

test('SIWC account routes reject missing user identity and never echo submitted identity',async()=>{
  const h=harness();
  let serviceCalls=0;
  const pass:SiwcHttpHandler=(_req,_res,next)=>next();
  const service={
    startForUser:async()=>{serviceCalls++;throw Error('must not run');},
    publicStateForUser:async()=>{serviceCalls++;return {status:'DISCONNECTED' as const};},
    cancelForUser:async()=>{serviceCalls++;},
  };
  mountSiwcConnectionApi({router:h.router,service,requireAuthenticatedUser:pass,verifyCsrf:pass});
  const result=await h.call('POST','/connect');
  assert.equal(result.statusCode,401);
  assert.deepEqual(result.body,{error:'SIWC_AUTHENTICATED_USER_REQUIRED'});
  assert.equal(serviceCalls,0);
});

test('SIWC connect never returns a non-OpenAI authorization target',async()=>{
  const h=harness();
  const pass:SiwcHttpHandler=(_req,_res,next)=>next();
  const service={
    startForUser:async()=>({status:'CONSENT_REQUIRED' as const,
      authorizationURL:'https://example.invalid/steal-consent',completion:Promise.resolve({
        state:{clientId:'fixture',connected:true,planUsage:'DISABLED' as const,
          hostId:'fixture',subjectRef:'REDACTED',expiresAtMs:0},models:[]}),cancel:async()=>{}}),
    publicStateForUser:async()=>({status:'DISCONNECTED' as const}),
    cancelForUser:async()=>{},
  };
  mountSiwcConnectionApi({router:h.router,service,requireAuthenticatedUser:pass,verifyCsrf:pass});
  const result=await h.call('POST','/connect','librechat-user-1');
  assert.equal(result.statusCode,503);
  assert.deepEqual(result.body,{error:'SIWC_AUTHORIZATION_URL_REJECTED'});
});

test('SIWC routes resolve the service from the authenticated request and fail closed when unmounted',async()=>{
  const h=harness();
  const pass:SiwcHttpHandler=(_req,_res,next)=>next();
  let resolvedRequest:unknown;
  mountSiwcConnectionApi({router:h.router,
    service:(request)=>{resolvedRequest=request;return null;},
    requireAuthenticatedUser:pass,verifyCsrf:pass});
  const result=await h.call('GET','/state','librechat-user-1');
  assert.equal(result.statusCode,503);
  assert.deepEqual(result.body,{error:'SIWC_RUNTIME_UNAVAILABLE'});
  assert.ok(resolvedRequest);
});
