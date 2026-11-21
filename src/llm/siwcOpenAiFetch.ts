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

/** The native Agents SDK emits ordinary function tools; SIWC accepts them in a namespace. */
function toSiwcNamespace(body:Record<string,unknown>):{body:Record<string,unknown>;namespace?:string} {
  if(!Array.isArray(body.tools)||body.tools.length===0)return {body};
  const tools=body.tools as unknown[];
  if(tools.some(tool=>tool&&typeof tool==='object'&&!Array.isArray(tool)&&
    (tool as Record<string,unknown>).type==='function')){
    if(tools.some(tool=>!tool||typeof tool!=='object'||Array.isArray(tool)||
      (tool as Record<string,unknown>).type!=='function'))
      throw Error('SIWC_TOOL_MIXED_FORMAT_REJECTED');
    const functions=tools.map(tool=>{
      const outer=tool as Record<string,unknown>;
      const definition=outer.function;
      const fn=definition&&typeof definition==='object'&&!Array.isArray(definition)
        ?definition as Record<string,unknown>:outer;
      if(typeof fn.name!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(fn.name)||
        !fn.parameters||typeof fn.parameters!=='object'||Array.isArray(fn.parameters))
        throw Error('SIWC_TOOL_DEFINITION_REJECTED');
      return {type:'function',name:fn.name,
        ...(typeof fn.description==='string'?{description:fn.description}:{}),
        parameters:fn.parameters,
        ...(typeof fn.strict==='boolean'?{strict:fn.strict}:{})};
    });
    const toolChoice=body.tool_choice;
    const normalizedToolChoice=toolChoice&&typeof toolChoice==='object'&&!Array.isArray(toolChoice)
      ?(()=>{
        const choice=toolChoice as Record<string,unknown>;
        if(choice.type!=='function'||typeof choice.name!=='string')
          throw Error('SIWC_TOOL_CHOICE_REJECTED');
        return {...choice,name:choice.name.startsWith('nostromo.')
          ?choice.name:`nostromo.${choice.name}`};
      })():toolChoice;
    if(typeof toolChoice==='string'&&!['auto','none','required'].includes(toolChoice))
      throw Error('SIWC_TOOL_CHOICE_REJECTED');
    return {body:{...body,...(toolChoice===undefined?{}:{tool_choice:normalizedToolChoice}),tools:[{
      type:'namespace',name:'nostromo',
      description:'Functions provided by the local NOSTROMO agent. LibreChat executes calls under its configured permissions.',
      tools:functions,
    }]},namespace:'nostromo'};
  }
  return {body};
}

/** Restores the local tool name on streamed Responses events before LangChain sees them. */
function localToolNames(response:Response,namespace:string):Response {
  if(!response.body)return response;
  const reader=response.body.getReader();
  const decoder=new TextDecoder();
  const encoder=new TextEncoder();
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('etag');
  let buffered='';
  const rewrite=(line:string)=>{
    if(!line.startsWith('data:'))return line;
    const raw=line.slice(5).trimStart();
    if(!raw||raw==='[DONE]')return line;
    let event:unknown;
    try{event=JSON.parse(raw);}catch{return line;}
    if(!event||typeof event!=='object'||Array.isArray(event))return line;
    const value=event as Record<string,unknown>;
    const item=value.item;
    if(item&&typeof item==='object'&&!Array.isArray(item)){
      const record=item as Record<string,unknown>;
      if(record.type==='function_call'&&typeof record.name==='string'&&
        record.name.startsWith(namespace+'.'))record.name=record.name.slice(namespace.length+1);
    }
    if(value.response&&typeof value.response==='object'&&!Array.isArray(value.response)){
      const result=value.response as Record<string,unknown>;
      if(Array.isArray(result.output))for(const output of result.output){
        if(!output||typeof output!=='object'||Array.isArray(output))continue;
        const record=output as Record<string,unknown>;
        if(record.type==='function_call'&&typeof record.name==='string'&&
          record.name.startsWith(namespace+'.'))record.name=record.name.slice(namespace.length+1);
      }
    }
    return `data: ${JSON.stringify(value)}`;
  };
  const stream=new ReadableStream<Uint8Array>({
    async pull(controller){
      try{
        while(true){
          const {done,value}=await reader.read();
          if(done){
            buffered+=decoder.decode();
            if(buffered){
              const lines=buffered.split('\n');
              const tail=lines.pop()??'';
              const output=lines.map(line=>rewrite(line)+'\n').join('')+(tail?rewrite(tail):'');
              if(output)controller.enqueue(encoder.encode(output));
              buffered='';
            }
            controller.close();return;
          }
          buffered+=decoder.decode(value,{stream:true});
          if(buffered.length>8_000_000)throw Error('SIWC_STREAM_BUFFER_LIMIT');
          const lines=buffered.split('\n');buffered=lines.pop()??'';
          if(lines.length){controller.enqueue(encoder.encode(lines.map(line=>rewrite(line)+'\n').join('')));return;}
        }
      }catch(error){controller.error(error);}
    },
    async cancel(reason){await reader.cancel(reason).catch(()=>{});},
  });
  return new Response(stream,{status:response.status,statusText:response.statusText,headers});
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
    const normalized=toSiwcNamespace(body);
    assertAllowedBody(normalized.body,account.visibleModels);
    const headers=new Headers(input instanceof Request?input.headers:undefined);
    new Headers(init.headers).forEach((value,key)=>headers.set(key,value));
    headers.delete('Authorization');
    headers.set('Authorization','Bearer '+account.record.accessToken);
    headers.set('Accept','text/event-stream');
    headers.set('Content-Type','application/json');
    const safeInit:RequestInit={...init,method:'POST',headers,redirect:'error',cache:'no-store',
      body:JSON.stringify(normalized.body)};
    const grant={identity:account.record.identity,scopes:account.record.scopes,
      tokenExpiresAtMs:account.record.tokenExpiresAtMs,expectedClientId:account.record.clientId,
      pendingNonce:account.record.identity.expectedNonce,nowMs:now()};
    if(siwcGrantState(grant)!=='AUTHORIZED')throw Error('SIWC_GRANT_INVALID');
    const response=await transport(CHATGPT_RESPONSES,safeInit);
    return normalized.namespace?localToolNames(response,normalized.namespace):response;
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
