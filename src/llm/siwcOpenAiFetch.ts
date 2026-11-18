import { CHATGPT_RESPONSES, siwcGrantState } from './chatgptAuthorized';
import type { SiwcAccountCredentials } from './siwcSession';
import { siwcAccountPermission } from './siwcSession';
import type { NativeInferenceRouteResult } from '../librechat/nativeInferenceRouteAdapter';

export interface SiwcFetchAccount {
  record:SiwcAccountCredentials;
  visibleModels:readonly {slug:string;label:string}[];
}

export interface SiwcAgentClientRunContext {
  authenticatedUserId:string;
  agentId?:string;
  agent:unknown;
  conversationId?:string;
  messages:unknown;
}

export interface SiwcAgentClientRunBindingResolver {
  resolveAgentClientRunBinding(
    context:SiwcAgentClientRunContext,
  ):Promise<{route:NativeInferenceRouteResult;fetch:typeof fetch}|null>;
}

const rejectedFields=new Set([
  'background','conversation','max_output_tokens','max_tool_calls','metadata','moderation',
  'multi_agent','prompt','prompt_cache_retention','safety_identifier','temperature',
  'top_logprobs','top_p','truncation','user','previous_response_id',
]);

function responseURL(input:RequestInfo|URL):URL {
  try {
    const value=input instanceof Request?input.url:input.toString();
    const url=new URL(value);
    if(url.origin!=='https://api.openai.com'||url.pathname!=='/v1/responses'||url.search||url.hash)
      throw Error();
    return url;
  } catch { throw Error('SIWC_ENDPOINT_REJECTED'); }
}

async function requestBody(input:RequestInfo|URL,init?:RequestInit):Promise<Record<string,unknown>> {
  let raw=init?.body;
  if(raw==null&&input instanceof Request)raw=await input.clone().text();
  if(typeof raw!=='string'||raw.length>8_000_000)throw Error('SIWC_REQUEST_BODY_INVALID');
  let value:unknown;
  try{value=JSON.parse(raw);}catch{throw Error('SIWC_REQUEST_BODY_INVALID');}
  if(typeof value!=='object'||value===null||Array.isArray(value))throw Error('SIWC_REQUEST_BODY_INVALID');
  return value as Record<string,unknown>;
}

function assertAllowedBody(body:Record<string,unknown>,visibleModels:readonly {slug:string}[]):void {
  for(const key of rejectedFields)if(Object.hasOwn(body,key))throw Error('SIWC_FIELD_REJECTED');
  if(body.store!==false||body.stream!==true||typeof body.model!=='string'||
    !visibleModels.some(model=>model.slug===body.model))throw Error('SIWC_REQUEST_POLICY_REJECTED');
  if(!Array.isArray(body.input)||body.input.length===0||body.input.length>256)
    throw Error('SIWC_INPUT_REQUIRED');
  for(const item of body.input){
    if(!item||typeof item!=='object'||Array.isArray(item))throw Error('SIWC_INPUT_ITEM_REJECTED');
    const value=item as Record<string,unknown>;
    if(value.role==='system')throw Error('SIWC_SYSTEM_ROLE_REJECTED');
    if(value.type==='mcp_call'||value.type==='tool_search_call'||value.type==='computer_call')
      throw Error('SIWC_HOSTED_TOOL_REJECTED');
  }
  if(body.tools!==undefined){
    if(!Array.isArray(body.tools)||body.tools.some(tool=>{
      if(!tool||typeof tool!=='object'||Array.isArray(tool))return true;
      const outer=tool as Record<string,unknown>;
      return outer.type!=='namespace'||typeof outer.name!=='string'||!Array.isArray(outer.tools)||
          outer.tools.length===0||outer.tools.some(def=>!def||typeof def!=='object'||Array.isArray(def)||
          !['function',undefined].includes((def as Record<string,unknown>).type as string|undefined));
    }))throw Error('SIWC_TOOL_POLICY_REJECTED');
  }
}

/**
 * Fetch compatible with LangChain's OpenAI Responses transport. The access
 * token is resolved per request and injected only into the outbound header;
 * it is never copied into model options, request JSON, errors, or browser data.
 */
export function createSiwcOpenAiFetch(
  authenticatedUserId:string,
  resolveAccount:(userId:string)=>Promise<SiwcFetchAccount|null>,
  transport:typeof fetch=fetch,
  now:()=>number=()=>Date.now(),
):typeof fetch {
  if(!authenticatedUserId||authenticatedUserId.length>256)
    throw Error('SIWC_AUTHENTICATED_USER_REQUIRED');
  const wrapped=async (input:RequestInfo|URL,init:RequestInit={})=>{
    responseURL(input);
    if((init.method??(input instanceof Request?input.method:'GET')).toUpperCase()!=='POST')
      throw Error('SIWC_METHOD_REJECTED');
    const account=await resolveAccount(authenticatedUserId);
    if(!account||siwcAccountPermission(account.record,now())!=='AUTHORIZED'||!account.record.accessToken)
      throw Error('SIWC_USER_CONSENT_REQUIRED');
    const body=await requestBody(input,init);
    assertAllowedBody(body,account.visibleModels);
    const headers=new Headers(input instanceof Request?input.headers:undefined);
    new Headers(init.headers).forEach((value,key)=>headers.set(key,value));
    headers.delete('Authorization');
    headers.set('Authorization','Bearer '+account.record.accessToken);
    headers.set('Accept','text/event-stream');
    headers.set('Content-Type','application/json');
    const safeInit:RequestInit={...init,method:'POST',headers,redirect:'error',cache:'no-store',
      body:JSON.stringify(body)};
    const grant={identity:account.record.identity,scopes:account.record.scopes,
      tokenExpiresAtMs:account.record.tokenExpiresAtMs,expectedClientId:account.record.clientId,
      pendingNonce:account.record.identity.expectedNonce,nowMs:now()};
    if(siwcGrantState(grant)!=='AUTHORIZED')throw Error('SIWC_GRANT_INVALID');
    return transport(CHATGPT_RESPONSES,safeInit);
  };
  return wrapped as typeof fetch;
}

/** Builds the resolver consumed by the guarded pinned AgentClient callsite. */
export function createSiwcAgentClientRunBindingResolver(dependencies:{
  resolveRoute:(context:SiwcAgentClientRunContext)=>Promise<NativeInferenceRouteResult>;
  resolveAccount:(userId:string)=>Promise<SiwcFetchAccount|null>;
  transport?:typeof fetch;
  now?:()=>number;
}):SiwcAgentClientRunBindingResolver {
  return {
    async resolveAgentClientRunBinding(context) {
      if(!context.authenticatedUserId)throw Error('SIWC_AUTHENTICATED_USER_REQUIRED');
      const account=await dependencies.resolveAccount(context.authenticatedUserId);
      if(!account)return null;
      const now=(dependencies.now??(()=>Date.now()))();
      if(siwcAccountPermission(account.record,now)!=='AUTHORIZED'||!account.record.accessToken)
        throw Error('SIWC_USER_CONSENT_REQUIRED');
      const route=await dependencies.resolveRoute(context);
      if(route.kind==='NO_ADMITTED_ROUTE')throw Error('SIWC_NATIVE_ROUTE_UNAVAILABLE');
      if(route.kind==='GOVERNED_HANDOFF_CANDIDATE')throw Error('SIWC_GOVERNED_HANDOFF_REQUIRED');
      if(route.kind!=='INFERENCE_ROUTE')throw Error('SIWC_NATIVE_ROUTE_RESULT_INVALID');
      if(route.provider!=='CHATGPT_OAUTH_PLAN'||route.endpoint!=='openAI')
        throw Error('SIWC_NATIVE_ROUTE_PROVIDER_UNSUPPORTED');
      if(!route.nativeModel)throw Error('SIWC_NATIVE_ROUTE_MODEL_REQUIRED');
      if(!account.visibleModels.some(model=>model.slug===route.nativeModel))
        throw Error('SIWC_MODEL_NOT_ACCOUNT_VISIBLE');
      return {
        route,
        fetch:createSiwcOpenAiFetch(context.authenticatedUserId,
          dependencies.resolveAccount,dependencies.transport??fetch,dependencies.now),
      };
    },
  };
}

/** Minimal ephemeral model binding consumed by LibreChat's existing AgentClient/Agents SDK. */
export function bindSiwcRouteToAgentClient(
  route:NativeInferenceRouteResult,
  fetchSiwc:typeof fetch,
):{
  provider:'openAI';
  model:string;
  model_parameters:Record<string,unknown>;
} {
  if(route.kind!=='INFERENCE_ROUTE'||route.provider!=='CHATGPT_OAUTH_PLAN'||
    route.endpoint!=='openAI'||!route.nativeModel)
    throw Error('SIWC_NATIVE_ROUTE_REQUIRED');
  return {
    provider:'openAI',
    model:route.nativeModel,
    model_parameters:{
      model:route.nativeModel,
      apiKey:'siwc-managed-no-secret',
      useResponsesApi:true,
      zdrEnabled:true,
      streaming:true,
      maxTokens:-1,
      maxRetries:0,
      configuration:{fetch:fetchSiwc},
    },
  };
}

/**
 * Creates the runtime-only agent object to pass in createRun({ agents }).
 * The saved NOSTROMO agent remains untouched; its instructions, identity,
 * tool registry, and permission metadata are retained on the run clone.
 */
export function createSiwcAgentClientRunAgent<
  T extends {provider:string;model?:string;model_parameters?:Record<string,unknown>},
>(
  agent:T,
  route:NativeInferenceRouteResult,
  fetchSiwc:typeof fetch,
):T&{
  provider:'openAI';
  model:string;
  model_parameters:Record<string,unknown>;
} {
  const binding=bindSiwcRouteToAgentClient(route,fetchSiwc);
  return {
    ...agent,
    provider:binding.provider,
    model:binding.model,
    model_parameters:{...binding.model_parameters},
  };
}
