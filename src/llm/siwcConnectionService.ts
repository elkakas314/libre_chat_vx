import { openSiwcLoopback, type SiwcLoopbackAttempt } from './siwcLoopback';
import {
  siwcExchangeRequest,
  type SiwcPending,
} from './chatgptAuthorized';
import { OPENAI_SIWC_JWKS_URI, type SiwcJwks } from './siwcIdentity';
import {
  siwcRefreshRequest,
  authorizeSiwcTokens,
  rotateSiwcTokens,
  siwcAccountPermission,
  siwcPublicState,
  type SiwcAccountCredentials,
  type SiwcCredentialVault,
} from './siwcSession';
import { SiwcResponsesClient } from './siwcResponsesClient';
import {
  createSiwcAgentClientRunBindingResolver,
  type SiwcAgentClientRunBindingResolver,
  type SiwcAgentClientRunContext,
} from './siwcOpenAiFetch';
import type { NativeInferenceRouteResult } from '../librechat/nativeInferenceRouteAdapter';

export interface SiwcConnectCompletion {
  state:ReturnType<typeof siwcPublicState>;
  models:readonly {slug:string;label:string}[];
}
export interface SiwcConnectAttempt {
  status:'CONSENT_REQUIRED';
  authorizationURL:string;
  completion:Promise<SiwcConnectCompletion>;
  cancel():Promise<void>;
}
export type SiwcConnectionStart=
  |{status:'CONNECTED';value:SiwcConnectCompletion}
  |SiwcConnectAttempt;
export type SiwcPublicConnectionState=
  |{status:'CONSENT_PENDING';state?:ReturnType<typeof siwcPublicState>}
  |{status:'DISCONNECTED'}
  |{status:'CONNECTED'|'REAUTH_REQUIRED';state:ReturnType<typeof siwcPublicState>};
type LoopbackFactory=(input:Parameters<typeof openSiwcLoopback>[0])=>Promise<SiwcLoopbackAttempt>;

export interface SiwcAgentClientHostApp {
  locals: {
    nostromoSiwc?: SiwcAgentClientRunBindingResolver;
  };
}

/** Registers the consent-aware resolver consumed by the guarded native AgentClient callsite. */
export function registerSiwcAgentClientResolver(
  app:SiwcAgentClientHostApp,
  resolver:SiwcAgentClientRunBindingResolver,
):()=>void {
  if(!app||typeof app.locals!=='object'||app.locals===null)
    throw Error('SIWC_AGENTCLIENT_APP_LOCALS_REQUIRED');
  if(Object.hasOwn(app.locals,'nostromoSiwc'))
    throw Error('SIWC_AGENTCLIENT_RESOLVER_ALREADY_REGISTERED');
  app.locals.nostromoSiwc=resolver;
  return ()=>{
    if(app.locals.nostromoSiwc===resolver)delete app.locals.nostromoSiwc;
  };
}

async function readJson(response:Response,limit:number,errorCode:string):Promise<unknown>{
  if(!response.ok)throw Error(errorCode);
  let raw:string;
  try{raw=await response.text();}catch{throw Error(errorCode);}
  if(raw.length>limit)throw Error(errorCode);
  try{return JSON.parse(raw) as unknown;}catch{throw Error(errorCode);}
}

/** Server-side SIWC lifecycle. Tokens remain inside the encrypted user-bound vault. */
export class SiwcConnectionService {
  private readonly pending=new Map<string,SiwcLoopbackAttempt>();
  private readonly responses:SiwcResponsesClient;
  private readonly transport:typeof fetch;
  private readonly now:()=>number;
  private readonly openLoopback:LoopbackFactory;

  constructor(private readonly options:{
    hostId:string;
    actualAppName:string;
    vault:SiwcCredentialVault;
    transport?:typeof fetch;
    now?:()=>number;
    timeoutMs?:number;
    openLoopback?:LoopbackFactory;
  }){
    if(!options.hostId||!options.actualAppName.trim())throw Error('SIWC_HOST_CONFIGURATION_REQUIRED');
    if(typeof options.vault.readForUser!=='function')throw Error('SIWC_USER_VAULT_LOOKUP_REQUIRED');
    this.transport=options.transport??fetch;
    this.now=options.now??(()=>Date.now());
    this.responses=new SiwcResponsesClient(this.transport,this.now);
    this.openLoopback=options.openLoopback??openSiwcLoopback;
  }

  private async jsonRequest(url:string,init:RequestInit,limit=300_000,errorCode='SIWC_OAUTH_REQUEST_FAILED'){
    let response:Response;
    try{
      response=await this.transport(url,{...init,cache:'no-store',redirect:'error',
        signal:init.signal??AbortSignal.timeout(15_000)});
    }catch{throw Error(errorCode);}
    return readJson(response,limit,errorCode);
  }

  async startForUser(userId:string):Promise<SiwcConnectionStart>{
    if(!userId||userId.length>256)throw Error('SIWC_AUTHENTICATED_USER_REQUIRED');
    const existing=await this.options.vault.readForUser!(userId);
    if(existing&&siwcAccountPermission(existing.record,this.now())==='AUTHORIZED'){
      const models=await this.responses.listModels(existing.record);
      return {status:'CONNECTED',value:{state:siwcPublicState(existing.record,this.now()),models}};
    }
    if(this.pending.has(userId))throw Error('SIWC_CONNECTION_ALREADY_PENDING');
    if(this.pending.size>=16)throw Error('SIWC_CONNECTION_CAPACITY_REACHED');
    const attempt=await this.openLoopback({
      hostId:this.options.hostId,
      actualAppName:this.options.actualAppName,
      ...(existing?{issuedClientId:existing.record.clientId}:{}),
      requestPlanUsage:true,
      ...(this.options.timeoutMs===undefined?{}:{timeoutMs:this.options.timeoutMs}),
    });
    this.pending.set(userId,attempt);
    const completion=this.complete(userId,attempt,existing).finally(()=>{
      if(this.pending.get(userId)===attempt)this.pending.delete(userId);
      void attempt.close().catch(()=>{});
    });
    void completion.catch(()=>{});
    return {
      status:'CONSENT_REQUIRED',authorizationURL:attempt.authorizationURL,completion,
      cancel:async()=>{
        if(this.pending.get(userId)===attempt)this.pending.delete(userId);
        await attempt.close();
      },
    };
  }

  private async complete(userId:string,attempt:SiwcLoopbackAttempt,
    existing:Awaited<ReturnType<NonNullable<SiwcCredentialVault['readForUser']>>>):Promise<SiwcConnectCompletion>{
    const accepted=await attempt.completed;
    const exchange=siwcExchangeRequest(attempt.pending,accepted);
    const tokenResponse=await this.jsonRequest(exchange.url,{
      method:exchange.method,headers:exchange.headers,body:exchange.body,
    },131_072,'SIWC_TOKEN_EXCHANGE_FAILED');
    const jwks=await this.jsonRequest(OPENAI_SIWC_JWKS_URI,{method:'GET',headers:{Accept:'application/json'}},
      131_072,'SIWC_JWKS_FETCH_FAILED') as SiwcJwks;
    const credentials=authorizeSiwcTokens({
      pending:attempt.pending as SiwcPending,
      issuedClientId:accepted.issuedClientId,
      response:tokenResponse,
      jwks,
      nowMs:this.now(),
      ...(existing?{previous:existing.record}:{}),
      authenticatedUserId:userId,
    });
    await this.options.vault.update(credentials.clientId,existing?.version??null,credentials);
    const readback=await this.options.vault.readForUser!(userId);
    if(!readback||readback.record.clientId!==credentials.clientId||
      readback.record.subject!==credentials.subject||readback.record.libreChatUserId!==userId||
      siwcAccountPermission(readback.record,this.now())!=='AUTHORIZED')
      throw Error('SIWC_VAULT_USER_READBACK_FAILED');
    const models=await this.responses.listModels(readback.record);
    return {state:siwcPublicState(readback.record,this.now()),models};
  }

  /** Per-user resolver used by the native AgentClient route binding. */
  async resolveAccount(userId:string):Promise<{
    record:SiwcAccountCredentials;
    visibleModels:readonly {slug:string;label:string}[];
  }|null>{
    if(!userId||userId.length>256)throw Error('SIWC_AUTHENTICATED_USER_REQUIRED');
    let current=await this.options.vault.readForUser!(userId);
    if(!current)return null;
    let record=current.record;
    if(record.libreChatUserId!==userId)return null;
    if(record.tokenExpiresAtMs<=this.now()+30_000){
      if(!record.refreshToken||!record.scopes.includes('offline_access')||
        record.earliestRefreshAtMs>this.now())return null;
      const request=siwcRefreshRequest(record);
      const response=await this.jsonRequest(request.url,{
        method:request.method,headers:request.headers,body:request.body,
      },131_072,'SIWC_TOKEN_REFRESH_FAILED');
      const rotated=rotateSiwcTokens(record,response,this.now());
      try{
        await this.options.vault.update(record.clientId,current.version,rotated);
      }catch(error){
        if(!(error instanceof Error)||!error.message.includes('VERSION_CONFLICT'))throw error;
        const concurrent=await this.options.vault.readForUser!(userId);
        if(!concurrent||concurrent.record.libreChatUserId!==userId||
          siwcAccountPermission(concurrent.record,this.now())!=='AUTHORIZED')return null;
        current=concurrent;
      }
      if(current.record===record)record=rotated;
      else record=current.record;
    }
    if(siwcAccountPermission(record,this.now())!=='AUTHORIZED')return null;
    const visibleModels=await this.responses.listModels(record);
    return {record,visibleModels};
  }

  createAgentClientRunBindingResolver(resolveRoute:(
    context:SiwcAgentClientRunContext,
  )=>Promise<NativeInferenceRouteResult>){
    return createSiwcAgentClientRunBindingResolver({
      resolveRoute,
      resolveAccount:(userId)=>this.resolveAccount(userId),
      transport:this.transport,
      now:this.now,
    });
  }

  /** Installs this service's authenticated, per-user binding into LibreChat app.locals. */
  registerAgentClient(app:SiwcAgentClientHostApp,resolveRoute:(
    context:SiwcAgentClientRunContext,
  )=>Promise<NativeInferenceRouteResult>):()=>void {
    return registerSiwcAgentClientResolver(app,this.createAgentClientRunBindingResolver(resolveRoute));
  }

  async cancelForUser(userId:string):Promise<void>{
    const attempt=this.pending.get(userId);
    if(!attempt)return;
    this.pending.delete(userId);
    await attempt.close();
  }

  /** Public, token-free session state for the authenticated LibreChat account. */
  async publicStateForUser(userId:string):Promise<SiwcPublicConnectionState>{
    if(!userId||userId.length>256)throw Error('SIWC_AUTHENTICATED_USER_REQUIRED');
    const current=await this.options.vault.readForUser!(userId);
    const pending=this.pending.has(userId);
    if(!current||current.record.libreChatUserId!==userId)
      return {status:pending?'CONSENT_PENDING':'DISCONNECTED'};
    const state=siwcPublicState(current.record,this.now());
    if(pending)return {status:'CONSENT_PENDING',state};
    return state.planUsage==='AUTHORIZED'
      ?{status:'CONNECTED',state}
      :{status:'REAUTH_REQUIRED',state};
  }
}
