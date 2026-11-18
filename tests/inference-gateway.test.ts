import test from 'node:test';
import assert from 'node:assert/strict';

import {
  NostromoInferenceGateway,
  StrictZeroCostRouteResolver,
  admitProviderRoute,
  chooseContextStrategy,
  selectSemanticProfile,
  type ProviderRoute,
} from '../src/llm/inferenceGateway';
import {
  CloudflareAiGatewayClient,
  buildCloudflareChatRequest,
  resolveCloudflareGatewayBinding,
} from '../src/llm/cloudflareAiGateway';
import { validateStructuredCognitiveEnvelope } from '../src/llm/structuredOutput';
import { projectProviderStatus } from '../src/llm/providerStatus';

const now=1_000_000;

function route(overrides:Partial<ProviderRoute>={}):ProviderRoute {
  return {
    id:'route-a',
    profile:'NORMAL',
    provider:'provider-a',
    model:'model-a',
    routeModel:'dynamic/nostromo-normal',
    locality:'REMOTE',
    capabilities:['TEXT'],
    health:'READY',
    quotaState:'AVAILABLE',
    zeroCost:'VERIFIED_ZERO_COST',
    contextWindowTokens:128000,
    privacyAllowed:true,
    paidFallbackAllowed:false,
    latencyMs:50,
    observedAtMs:now,
    evidence:'LIVE_READBACK',
    authority:false,
    ...overrides,
  };
}

test('semantic profile selection follows LibreChat comprehension and visualization purpose', () => {
  assert.equal(selectSemanticProfile({needsResearch:true}),'INVESTIGAR');
  assert.equal(selectSemanticProfile({needsVisualization:true}),'VISUALIZAR');
  assert.equal(selectSemanticProfile({needsVision:true}),'VISION');
  assert.equal(selectSemanticProfile({preferFast:true}),'RAPIDO');
  assert.equal(selectSemanticProfile({}),'NORMAL');
});

test('zero-cost guard rejects billable and config-only routes', () => {
  assert.equal(admitProviderRoute(route({zeroCost:'BILLABLE'}),{profile:'NORMAL',nowMs:now}).admitted,false);
  assert.equal(admitProviderRoute(route({evidence:'CONFIG_ONLY'}),{profile:'NORMAL',nowMs:now}).admitted,false);
});

test('resolver performs cognitive failover without admitting unhealthy primary', () => {
  const resolver=new StrictZeroCostRouteResolver();
  const result=resolver.resolve({profile:'NORMAL',nowMs:now},[
    route({id:'primary',health:'UNAVAILABLE',latencyMs:10}),
    route({id:'secondary',provider:'provider-b',model:'model-b',latencyMs:20}),
  ]);
  assert.equal(result.selected?.id,'secondary');
});

test('context policy prefers targeted reads then RAG then compact then long context', () => {
  assert.equal(chooseContextStrategy({
    targetedReadsSufficient:false,
    retrievalSufficient:true,
    compactionSufficient:true,
    wholeCorpusRequired:true,
    longContextAvailable:true,
  }),'RAG');
});

test('structured output rejects material authority fields', () => {
  assert.equal(validateStructuredCognitiveEnvelope({answer:'ok',profile:'NORMAL',authorized:true}).valid,false);
  assert.equal(validateStructuredCognitiveEnvelope({answer:'ok',profile:'NORMAL'}).valid,true);
});

test('Cloudflare binding never returns the token value and requires BYOK-only declaration', () => {
  const binding=resolveCloudflareGatewayBinding({
    CLOUDFLARE_ACCOUNT_ID:'account',
    CLOUDFLARE_AI_GATEWAY_ID:'gateway',
    CLOUDFLARE_API_TOKEN:'super-secret-token',
    CLOUDFLARE_AIG_BYOK_ONLY_REQUIRED:'true',
  });
  assert.equal(binding.state,'CONFIGURED_SOURCE_ONLY');
  assert.equal(binding.unifiedBillingRequired,false);
  assert.equal(JSON.stringify(binding).includes('super-secret-token'),false);
  assert.equal(buildCloudflareChatRequest('VISUALIZAR',[]).model,'dynamic/nostromo-visualizar');
});

test('provider status exposes inference truth only and never authority', () => {
  const view=projectProviderStatus(route(),now);
  assert.equal(view.profile,'NORMAL');
  assert.equal(view.freshness,'FRESH');
  assert.equal(view.authority,false);
  assert.equal(view.identityProfileVersion,'1.0.0');
});

test('InferenceGateway contract selects semantic profile and resolves an admitted route', () => {
  const gateway=new NostromoInferenceGateway();
  const profile=gateway.selectProfile({preferFast:true});
  assert.equal(profile,'RAPIDO');
  const selected=gateway.resolveProviderRoute({profile:'RAPIDO',nowMs:now},[
    route({id:'fast',profile:'RAPIDO',routeModel:'dynamic/nostromo-rapido'}),
  ]);
  assert.equal(selected.selected?.id,'fast');
  assert.equal(gateway.authority,false);
});

test('Cloudflare client sends OpenAI-compatible chat request without persisting the token', async () => {
  const binding=resolveCloudflareGatewayBinding({
    CLOUDFLARE_ACCOUNT_ID:'account',
    CLOUDFLARE_AI_GATEWAY_ID:'gateway',
    CLOUDFLARE_API_TOKEN:'present-only-for-binding-check',
    CLOUDFLARE_AIG_BYOK_ONLY_REQUIRED:'true',
  });
  let observedUrl='';
  let observedAuth='';
  let observedNoWholesale='';
  const client=new CloudflareAiGatewayClient(
    binding,
    {get:()=> 'runtime-token'},
    async (url,request)=>{
      observedUrl=url;
      observedAuth=request.headers.Authorization;
      observedNoWholesale=request.headers['cf-aig-no-wholesale'];
      return {ok:true,status:200,body:{stream:true}};
    },
  );
  const response=await client.createChatCompletion('NORMAL',[{role:'user',content:'hola'}]);
  assert.equal(response.status,200);
  assert.equal(observedUrl,'https://api.cloudflare.com/client/v4/accounts/account/ai/v1/chat/completions');
  assert.equal(observedAuth,'Bearer runtime-token');
  assert.equal(observedNoWholesale,'true');
  assert.equal(JSON.stringify(binding).includes('runtime-token'),false);
});

test('Cloudflare client preserves tool schemas and multi-turn tool replies', async () => {
  const binding=resolveCloudflareGatewayBinding({
    CLOUDFLARE_ACCOUNT_ID:'account',
    CLOUDFLARE_AI_GATEWAY_ID:'gateway',
    CLOUDFLARE_API_TOKEN:'present-only-for-binding-check',
    CLOUDFLARE_AIG_BYOK_ONLY_REQUIRED:'true',
  });
  let sentBody='';
  const client=new CloudflareAiGatewayClient(
    binding,
    {get:()=> 'runtime-token'},
    async (_url,request)=>{
      sentBody=request.body;
      return {ok:true,status:200,body:{choices:[]}};
    },
  );
  const tools=[{
    type:'function' as const,
    function:{name:'nostromo_estado',description:'Lee el estado',parameters:{type:'object',properties:{},additionalProperties:false}},
  }];
  const messages=[
    {role:'user' as const,content:'Consulta el estado.'},
    {role:'assistant' as const,content:null,tool_calls:[{id:'call-1',type:'function' as const,function:{name:'nostromo_estado',arguments:'{}'}}]},
    {role:'tool' as const,tool_call_id:'call-1',name:'nostromo_estado',content:'estado disponible'},
  ];
  const response=await client.createChatCompletion('INVESTIGAR',messages,true,{tools,toolChoice:'auto'});
  const payload=JSON.parse(sentBody);
  assert.equal(response.status,200);
  assert.deepEqual(payload.tools,tools);
  assert.equal(payload.tool_choice,'auto');
  assert.deepEqual(payload.messages,messages);
  assert.equal(payload.model,'dynamic/nostromo-investigar');
});

test('route admission fails closed for missing, future and stale LIVE timestamps', () => {
  const cases = [
    [undefined,'ROUTE_READBACK_TIMESTAMP_REQUIRED'],
    [Number.NaN,'ROUTE_READBACK_TIMESTAMP_REQUIRED'],
    [now+1,'ROUTE_READBACK_FROM_FUTURE'],
    [now-300_001,'ROUTE_READBACK_STALE'],
  ] as const;
  for (const [observedAtMs,reason] of cases) {
    const decision=admitProviderRoute(route({observedAtMs}),{profile:'NORMAL',nowMs:now});
    assert.equal(decision.admitted,false);
    assert.ok(decision.reasons.includes(reason),reason);
  }
  assert.equal(admitProviderRoute(route(),{profile:'NORMAL',nowMs:now}).admitted,true);
});

test('HUD freshness never claims a live readback from config, invalid or future timestamps', () => {
  assert.equal(projectProviderStatus(route({evidence:'CONFIG_ONLY'}),now).freshness,'UNKNOWN');
  assert.equal(projectProviderStatus(route({observedAtMs:undefined}),now).freshness,'UNKNOWN');
  assert.equal(projectProviderStatus(route({observedAtMs:Number.NaN}),now).freshness,'UNKNOWN');
  assert.equal(projectProviderStatus(route({observedAtMs:now+1}),now).freshness,'UNKNOWN');
  assert.equal(projectProviderStatus(route({observedAtMs:now-300_001}),now).freshness,'STALE');
  assert.equal(projectProviderStatus(route(),now).freshness,'FRESH');
});
