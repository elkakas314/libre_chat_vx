import { createHash, randomBytes } from 'node:crypto';

/** Server-only official Sign in with ChatGPT OSS protocol. Never bundle into browser JSX. */
export const CHATGPT_AUTHORIZE='https://auth.openai.com/api/accounts/authorize';
export const CHATGPT_TOKEN='https://auth.openai.com/api/accounts/oauth/token';
export const CHATGPT_RESOURCE='https://api.openai.com/v1';
export const CHATGPT_RESPONSES='https://api.openai.com/v1/responses';
export const CHATGPT_MODELS='https://api.openai.com/v1/models';
export const CHATGPT_SCOPE='chatgpt.tokens.use.direct';
const hostPattern=/^(?:urn:uuid:[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}|urn:ietf:params:oauth:jwk-thumbprint:[\w-]+|did:key:[A-Za-z0-9]+)$/i;

export interface SiwcStart {
  hostId:string;callback:string;actualAppName:string;
  issuedClientId?:string;requestPlanUsage:boolean;
}
export interface SiwcPending {
  url:string;state:string;nonce:string;codeVerifier:string;
  callback:string;expectedClientId:string;newRegistration:boolean;
  hostId:string;requestPlanUsage:boolean;
}
export function startSiwc(config:SiwcStart):SiwcPending {
  if(!hostPattern.test(config.hostId)) throw new Error('SIWC_HOST_ID_INVALID');
  let callback:URL;
  try { callback=new URL(config.callback); } catch {throw new Error('SIWC_LOOPBACK_REQUIRED');}
  if(callback.protocol!=='http:'||callback.hostname!=='127.0.0.1'||!callback.port||
    !!callback.username||!!callback.password||!!callback.search||!!callback.hash)
    throw new Error('SIWC_LOOPBACK_REQUIRED');
  if(!config.actualAppName.trim()||config.actualAppName.length>90)
    throw new Error('SIWC_APP_NAME_REQUIRED');
  if(config.issuedClientId&&!/^oaiapp_[\w-]+$/.test(config.issuedClientId))
    throw new Error('SIWC_ISSUED_CLIENT_INVALID');
  const state=randomBytes(32).toString('base64url');
  const nonce=randomBytes(32).toString('base64url');
  const codeVerifier=randomBytes(48).toString('base64url');
  const client=config.issuedClientId??'dynamic_agent_client';
  const uri=new URL(CHATGPT_AUTHORIZE),q=uri.searchParams;
  q.set('client_id',client);
  q.set('ext_agent_host_id',config.hostId);
  if(!config.issuedClientId)q.set('agent_name_hint',config.actualAppName);
  q.set('redirect_uri',config.callback);
  q.set('response_type','code');
  q.set('scope',config.requestPlanUsage
    ?'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct'
    :'openid profile email');
  q.set('resource',CHATGPT_RESOURCE);
  q.set('state',state);q.set('nonce',nonce);
  q.set('code_challenge_method','S256');
  q.set('code_challenge',createHash('sha256').update(codeVerifier).digest('base64url'));
  return {url:uri.toString(),state,nonce,codeVerifier,callback:config.callback,
    expectedClientId:client,newRegistration:!config.issuedClientId,
    hostId:config.hostId,requestPlanUsage:config.requestPlanUsage};
}

export function acceptSiwcCallback(pending:SiwcPending,callbackURL:string):{
  code:string;issuedClientId:string
} {
  const current=new URL(callbackURL),expected=new URL(pending.callback);
  if(current.origin!==expected.origin||current.pathname!==expected.pathname||!!current.hash)
    throw new Error('SIWC_CALLBACK_MISMATCH');
  if(current.searchParams.get('state')!==pending.state)throw new Error('SIWC_STATE_MISMATCH');
  if(current.searchParams.has('error'))throw new Error('SIWC_CONSENT_DECLINED');
  const returned=current.searchParams.get('client_id');
  if(pending.newRegistration&&(!returned||!/^oaiapp_[\w-]+$/.test(returned)))
    throw new Error('SIWC_CLIENT_ID_MISSING');
  if(!pending.newRegistration&&returned!==null&&returned!==pending.expectedClientId)
    throw new Error('SIWC_CLIENT_ID_MISMATCH');
  const code=current.searchParams.get('code');
  if(!code)throw new Error('SIWC_CODE_MISSING');
  return {code,issuedClientId:pending.newRegistration?returned!:pending.expectedClientId};
}

export function siwcExchangeRequest(pending:SiwcPending,accepted:{
  code:string;issuedClientId:string
}) {
  if(!accepted.code||!accepted.issuedClientId||
    (!pending.newRegistration&&accepted.issuedClientId!==pending.expectedClientId))
    throw new Error('SIWC_EXCHANGE_MISMATCH');
  return {url:CHATGPT_TOKEN,method:'POST' as const,
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({grant_type:'authorization_code',code:accepted.code,
      client_id:accepted.issuedClientId,code_verifier:pending.codeVerifier,
      redirect_uri:pending.callback,resource:CHATGPT_RESOURCE}).toString()};
}

/** Only an OIDC verifier checking JWKS, issuer, audience, expiry, nonce may produce this value. */
export interface SiwcVerifiedIdentity {
  verification:'OIDC_JWKS_NONCE_AUD_VERIFIED';
  subject:string;issuedClientId:string;expectedNonce:string;
}
export interface SiwcGrantReadback {
  identity:SiwcVerifiedIdentity|null;
  scopes:readonly string[];
  tokenExpiresAtMs:number;expectedClientId:string;
  pendingNonce:string;nowMs:number;
}
export type SiwcState='AUTHORIZED'|'IDENTITY_UNVERIFIED'|'SCOPE_DENIED'|'EXPIRED';
export function siwcGrantState(g:SiwcGrantReadback):SiwcState {
  const x=g.identity;
  if(!x||x.verification!=='OIDC_JWKS_NONCE_AUD_VERIFIED'||
    !x.subject||x.issuedClientId!==g.expectedClientId||
    x.expectedNonce!==g.pendingNonce)return 'IDENTITY_UNVERIFIED';
  if(!g.scopes.includes(CHATGPT_SCOPE)||!g.scopes.includes('resource.invoke'))return 'SCOPE_DENIED';
  if(!Number.isFinite(g.tokenExpiresAtMs)||g.tokenExpiresAtMs<=g.nowMs+30_000)return 'EXPIRED';
  return 'AUTHORIZED';
}
export interface ChatGPTCatalogModel {slug:string;display_name:string;visibility:string;}
export function siwcVisibleModels(payload:unknown):readonly {slug:string;label:string}[] {
  if(!payload||typeof payload!=='object'||!Array.isArray((payload as {models?:unknown}).models))
    throw new Error('SIWC_CATALOG_INVALID');
  return (payload as {models:unknown[]}).models
    .filter((m):m is ChatGPTCatalogModel=>
      typeof m==='object'&&m!==null&&
      typeof (m as ChatGPTCatalogModel).slug==='string'&&
      !!(m as ChatGPTCatalogModel).slug&&
      typeof (m as ChatGPTCatalogModel).display_name==='string'&&
      (m as ChatGPTCatalogModel).visibility==='list')
    .map(m=>({slug:m.slug,label:m.display_name}));
}
/** No unsafe Responses parameters, no implicit provider/billing fallback. */
export interface SiwcMessage {role:'user'|'assistant'|'developer';content:string;}
export function siwcResponseBody(req:{
  grant:SiwcGrantReadback;model:string;
  liveCatalog:readonly {slug:string;label:string}[];
  messages:readonly SiwcMessage[];
}) {
  if(siwcGrantState(req.grant)!=='AUTHORIZED')throw new Error('SIWC_GRANT_REQUIRED');
  if(!req.liveCatalog.some(x=>x.slug===req.model))throw new Error('SIWC_MODEL_NOT_ADMITTED');
  if(!Array.isArray(req.messages)||req.messages.length===0||req.messages.length>128||
    req.messages.some(m=>!m||!['user','assistant','developer'].includes(m.role)||
      typeof m.content!=='string'||m.content.length>100000))
    throw new Error('SIWC_MESSAGES_UNSUPPORTED');
  return {model:req.model,input:req.messages.map(m=>({role:m.role,content:m.content})),
    store:false as const,stream:true as const};
}
/** Interrupted streams and failed terminal events cannot be mistaken for success. */
export async function siwcRequireCompletion(events:AsyncIterable<{type:string}>):Promise<'COMPLETED'> {
  let completed=false;
  for await(const e of events) {
    if(e.type==='response.failed')throw new Error('SIWC_RESPONSE_FAILED');
    if(e.type==='response.incomplete')throw new Error('SIWC_RESPONSE_INCOMPLETE');
    if(e.type==='response.completed')completed=true;
  }
  if(!completed)throw new Error('SIWC_UNKNOWN_OUTCOME');
  return 'COMPLETED';
}
