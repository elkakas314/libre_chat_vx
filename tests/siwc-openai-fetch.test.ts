import test from 'node:test';
import assert from 'node:assert/strict';
import {bindSiwcRouteToAgentClient,createSiwcAgentClientRunAgent,createSiwcAgentClientRunBindingResolver,createSiwcOpenAiFetch} from '../src/llm/siwcOpenAiFetch';
import type {SiwcAccountCredentials} from '../src/llm/siwcSession';

const now=1_800_000_000_000;
const record:SiwcAccountCredentials={
  clientId:'oaiapp_example',hostId:'urn:uuid:11111111-2222-4333-8444-555555555555',
  subject:'fixture-subject',identity:{verification:'OIDC_JWKS_NONCE_AUD_VERIFIED',
    subject:'fixture-subject',issuedClientId:'oaiapp_example',expectedNonce:'fixture-nonce'},
  scopes:['openid','resource.invoke','chatgpt.tokens.use.direct'],savedAtMs:now-1000,
  tokenExpiresAtMs:now+60_000,earliestRefreshAtMs:now,
  accessToken:'test-oauth-bearer',refreshToken:null,idToken:'fixture',
};
const account={record,visibleModels:[{slug:'visible-model',label:'Visible'}]};
const allowedBody={model:'visible-model',store:false,stream:true,input:[
  {type:'message',role:'developer',content:'Responde en español.'},
  {type:'message',role:'user',content:'Hola'},
]};
const route={kind:'INFERENCE_ROUTE' as const,lane:'REMOTE_INFERENCE' as const,
  profile:'NORMAL' as const,routeId:'siwc:fixture',provider:'CHATGPT_OAUTH_PLAN',
  model:'visible-model',endpoint:'openAI',nativeModel:'visible-model',
  requiresGoalAgreement:false,requiresReadbackBeforeResponse:false,authority:false as const};

test('native AgentClient resolver binds only a fresh account-visible SIWC route for the authenticated user',async()=>{
  let accountReads=0,routeReads=0,readUser='';
  const resolver=createSiwcAgentClientRunBindingResolver({
    resolveRoute:async()=>{routeReads++;return route;},
    resolveAccount:async(userId)=>{accountReads++;readUser=userId;return account;},
    now:()=>now,
  });
  const context={authenticatedUserId:'librechat-user-fixture',agentId:'nostromo-agent',
    agent:{id:'nostromo-agent'},conversationId:'conversation-fixture',messages:[]};
  const binding=await resolver.resolveAgentClientRunBinding(context);
  assert.equal(binding?.route,route);
  assert.equal(typeof binding?.fetch,'function');
  assert.equal(readUser,context.authenticatedUserId);
  assert.equal(accountReads,1);
  assert.equal(routeReads,1);
  const unlinked=createSiwcAgentClientRunBindingResolver({
    resolveRoute:async()=>{routeReads++;return route;},
    resolveAccount:async()=>null,
    now:()=>now,
  });
  assert.equal(await unlinked.resolveAgentClientRunBinding(context),null);
  assert.equal(routeReads,1,'unlinked account must not request an SIWC route');
  const denied=createSiwcAgentClientRunBindingResolver({
    resolveRoute:async()=>route,
    resolveAccount:async()=>({...account,visibleModels:[{slug:'different-model',label:'Different'}]}),
    now:()=>now,
  });
  await assert.rejects(denied.resolveAgentClientRunBinding(context),/SIWC_MODEL_NOT_ACCOUNT_VISIBLE/);
  const noAdmittedRoute=createSiwcAgentClientRunBindingResolver({
    resolveRoute:async()=>({kind:'NO_ADMITTED_ROUTE',lane:'REMOTE_INFERENCE',profile:'NORMAL',
      admissions:[],reason:'NO_FRESH_ZERO_COST_ROUTE',requiresGoalAgreement:false,
      requiresReadbackBeforeResponse:false,authority:false}),
    resolveAccount:async()=>account,
    now:()=>now,
  });
  await assert.rejects(noAdmittedRoute.resolveAgentClientRunBinding(context),
    /SIWC_NATIVE_ROUTE_UNAVAILABLE/);
  const unsupportedProvider=createSiwcAgentClientRunBindingResolver({
    resolveRoute:async()=>({...route,provider:'CLOUDFLARE_AI_GATEWAY'}),
    resolveAccount:async()=>account,
    now:()=>now,
  });
  await assert.rejects(unsupportedProvider.resolveAgentClientRunBinding(context),
    /SIWC_NATIVE_ROUTE_PROVIDER_UNSUPPORTED/);
});

test('SIWC Responses fetch injects a user-consented bearer and preserves native SSE transport',async()=>{
  let captured:{url:unknown;init?:RequestInit}|undefined;
  const transport=(async(url:unknown,init?:RequestInit)=>{
    captured={url,init};return new Response('data: {"type":"response.completed"}\n\n',{
      headers:{'Content-Type':'text/event-stream'},
    });
  }) as unknown as typeof fetch;
  let resolvedUserId='';
  const fetchSiwc=createSiwcOpenAiFetch('librechat-user-fixture',async(userId)=>{
    resolvedUserId=userId;return account;
  },transport,()=>now);
  const controller=new AbortController();
  const response=await fetchSiwc('https://api.openai.com/v1/responses',{
    method:'POST',headers:{Authorization:'Bearer stale-key'},body:JSON.stringify(allowedBody),
    signal:controller.signal,
  });
  assert.equal(response.status,200);
  assert.equal(resolvedUserId,'librechat-user-fixture');
  assert.equal(captured?.url,'https://api.openai.com/v1/responses');
  const headers=new Headers(captured?.init?.headers);
  assert.equal(headers.get('authorization'),'Bearer test-oauth-bearer');
  assert.equal(headers.get('accept'),'text/event-stream');
  assert.equal(captured?.init?.signal,controller.signal);
  assert.equal(captured?.init?.redirect,'error');
  assert.equal(captured?.init?.cache,'no-store');
  assert.deepEqual(JSON.parse(String(captured?.init?.body)),allowedBody);
});

test('AgentClient binding is ephemeral, route-bound, and contains no OAuth credentials',()=>{
  const fetchSiwc=createSiwcOpenAiFetch('librechat-user-fixture',async()=>account);
  const binding=bindSiwcRouteToAgentClient(route,fetchSiwc);
  assert.equal(binding.provider,'openAI');
  assert.equal(binding.model,'visible-model');
  assert.equal(binding.model_parameters.useResponsesApi,true);
  assert.equal(binding.model_parameters.streaming,true);
  assert.equal(binding.model_parameters.apiKey,'siwc-managed-no-secret');
  assert.equal((binding.model_parameters.configuration as {fetch:typeof fetch}).fetch,fetchSiwc);
  assert.equal(JSON.stringify(binding).includes(String(record.accessToken)),false);
  const persistedAgent={id:'nostromo-agent',provider:'ollama',model:'qwen3:4b',
    instructions:'Identidad persistente NOSTROMO',toolDefinitions:[{name:'nostromo_estado'}],
    model_parameters:{model:'qwen3:4b',temperature:0.2}};
  const runAgent=createSiwcAgentClientRunAgent(persistedAgent,route,fetchSiwc);
  assert.equal(runAgent.id,persistedAgent.id);
  assert.equal(runAgent.instructions,persistedAgent.instructions);
  assert.deepEqual(runAgent.toolDefinitions,persistedAgent.toolDefinitions);
  assert.equal(runAgent.model_parameters.model,'visible-model');
  assert.equal(runAgent.model_parameters.temperature,undefined);
  assert.equal(persistedAgent.model,'qwen3:4b');
  assert.equal(persistedAgent.model_parameters.model,'qwen3:4b');
  assert.throws(()=>bindSiwcRouteToAgentClient({
    kind:'INFERENCE_ROUTE',lane:'REMOTE_INFERENCE',profile:'NORMAL',routeId:'local',
    provider:'OLLAMA_LOCAL',model:'qwen',endpoint:'openAI',nativeModel:'qwen',
    requiresGoalAgreement:false,requiresReadbackBeforeResponse:false,authority:false,
  },fetchSiwc),/NATIVE_ROUTE_REQUIRED/);
});

test('SIWC transport fails closed for missing consent, wrong models, system role, hosted tools, and forbidden fields',async()=>{
  let requests=0;
  const transport=(async()=>{requests++;return new Response('ok');}) as unknown as typeof fetch;
  const fetchSiwc=createSiwcOpenAiFetch('librechat-user-fixture',async()=>account,transport,()=>now);
  const make=(body:Record<string,unknown>,url='https://api.openai.com/v1/responses')=>
    fetchSiwc(url,{method:'POST',body:JSON.stringify(body)});
  await assert.rejects(make({...allowedBody,model:'hidden-model'}),/POLICY_REJECTED/);
  await assert.rejects(make({...allowedBody,input:[{type:'message',role:'system',content:'x'}]}),/SYSTEM_ROLE_REJECTED/);
  await assert.rejects(make({...allowedBody,input:[{role:'system',content:'x'}]}),/SYSTEM_ROLE_REJECTED/);
  await assert.rejects(make({...allowedBody,previous_response_id:'resp_fixture'}),/FIELD_REJECTED/);
  await assert.rejects(make({...allowedBody,tools:[{type:'mcp',server_label:'remote'}]}),/TOOL_POLICY_REJECTED/);
  await assert.rejects(make(allowedBody,'https://api.openai.com/v1/chat/completions'),/ENDPOINT_REJECTED/);
  const denied=createSiwcOpenAiFetch('librechat-user-fixture',async()=>({...account,record:{...record,scopes:['openid']}}),transport,()=>now);
  await assert.rejects(denied('https://api.openai.com/v1/responses',{
    method:'POST',body:JSON.stringify(allowedBody),
  }),/CONSENT_REQUIRED/);
  assert.equal(requests,0);
});
