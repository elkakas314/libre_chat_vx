import type { SiwcPending, SiwcVerifiedIdentity, SiwcGrantReadback } from './chatgptAuthorized';
import { CHATGPT_RESOURCE, CHATGPT_TOKEN, siwcGrantState } from './chatgptAuthorized';
import { verifySiwcIdToken, type SiwcJwks } from './siwcIdentity';

/** All credentials must stay in a host-side, access-controlled persistent vault. */
export interface SiwcAccountCredentials {
  clientId:string;hostId:string;subject:string;identity:SiwcVerifiedIdentity;
  scopes:readonly string[];savedAtMs:number;tokenExpiresAtMs:number;
  earliestRefreshAtMs:number;accessToken:string|null;refreshToken:string|null;
  idToken:string;
}
export interface SiwcCredentialVault {
  /** Atomic CAS by client ID; implementations encrypt / set owner-only storage. */
  update(clientId:string,expectedVersion:string|null,record:SiwcAccountCredentials):
    Promise<{version:string}>;
  read(clientId:string):Promise<{version:string;record:SiwcAccountCredentials}|null>;
}
type TokenData={
  id_token?:unknown;access_token?:unknown;refresh_token?:unknown;
  expires_in?:unknown;earliest_refresh_at?:unknown;
  token_type?:unknown;scope?:unknown;
};
function parseScopes(raw:unknown):readonly string[] {
  if(typeof raw!=='string'||raw.length>4096)throw new Error('SIWC_SCOPES_MISSING');
  return [...new Set(raw.split(/\s+/).filter(Boolean))];
}
function credentials(raw:unknown):TokenData {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('SIWC_TOKENS_INVALID');
  return raw as TokenData;
}
function planTokens(d:TokenData):{accessToken:string|null;refreshToken:string|null;expiresIn:number} {
  if(d.access_token===undefined && d.refresh_token===undefined)
    return {accessToken:null,refreshToken:null,expiresIn:0};
  if(typeof d.access_token!=='string'||!d.access_token||
    typeof d.refresh_token!=='string'||!d.refresh_token||
    d.token_type!=='Bearer'||typeof d.expires_in!=='number'||
    !Number.isInteger(d.expires_in)||d.expires_in<60||d.expires_in>86400)
    throw new Error('SIWC_TOKENS_INVALID');
  return {accessToken:d.access_token,refreshToken:d.refresh_token,expiresIn:d.expires_in};
}
export function authorizeSiwcTokens(args:{
  pending:SiwcPending;issuedClientId:string;response:unknown;jwks:SiwcJwks;
  nowMs:number;previous?:SiwcAccountCredentials;
}):SiwcAccountCredentials {
  const {pending,issuedClientId,nowMs}=args;
  if(!/^oaiapp_[\w-]+$/.test(issuedClientId)||!Number.isSafeInteger(nowMs))
    throw new Error('SIWC_CLIENT_INVALID');
  if(!pending.newRegistration&&issuedClientId!==pending.expectedClientId)
    throw new Error('SIWC_CLIENT_MISMATCH');
  if(args.previous && (args.previous.clientId!==issuedClientId||
      args.previous.hostId!==pending.hostId))
    throw new Error('SIWC_ACCOUNT_MISMATCH');
  const d=credentials(args.response);
  if(typeof d.id_token!=='string'||!d.id_token)throw new Error('SIWC_ID_TOKEN_REQUIRED');
  const identity=verifySiwcIdToken({
    idToken:d.id_token,jwks:args.jwks,nonce:pending.nonce,issuedClientId,
    nowSec:Math.floor(nowMs/1000),expectedSubject:args.previous?.subject,
  });
  const scopes=parseScopes(d.scope),tokens=planTokens(d);
  if(scopes.includes('chatgpt.tokens.use.direct')&&!tokens.accessToken)
    throw new Error('SIWC_PLAN_TOKENS_MISSING');
  return {
    clientId:issuedClientId,hostId:pending.hostId,subject:identity.subject,identity,
    scopes,savedAtMs:nowMs,tokenExpiresAtMs:nowMs+tokens.expiresIn*1000,
    earliestRefreshAtMs:typeof d.earliest_refresh_at==='number'&&
      Number.isFinite(d.earliest_refresh_at) ? d.earliest_refresh_at*1000 : nowMs,
    accessToken:tokens.accessToken,refreshToken:tokens.refreshToken,idToken:d.id_token,
  };
}
export function siwcRefreshRequest(record:SiwcAccountCredentials) {
  if(!record.refreshToken || !record.accessToken || !record.scopes.includes('offline_access'))
    throw new Error('SIWC_REFRESH_UNAVAILABLE');
  return {url:CHATGPT_TOKEN,method:'POST' as const,
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({grant_type:'refresh_token',client_id:record.clientId,
      refresh_token:record.refreshToken,resource:CHATGPT_RESOURCE}).toString()};
}
export function rotateSiwcTokens(previous:SiwcAccountCredentials,
  raw:unknown,nowMs:number):SiwcAccountCredentials {
  const d=credentials(raw),t=planTokens(d),scopes=parseScopes(d.scope);
  if(!t.accessToken||!t.refreshToken||!Number.isSafeInteger(nowMs))
    throw new Error('SIWC_REFRESH_INVALID');
  if(d.id_token!==undefined&&d.id_token!==previous.idToken)
    throw new Error('SIWC_REFRESH_ID_TOKEN_REQUIRES_REVALIDATION');
  return {
    ...previous,accessToken:t.accessToken,refreshToken:t.refreshToken,
    scopes,savedAtMs:nowMs,tokenExpiresAtMs:nowMs+t.expiresIn*1000,
    earliestRefreshAtMs:typeof d.earliest_refresh_at==='number'&&
      Number.isFinite(d.earliest_refresh_at)?d.earliest_refresh_at*1000:nowMs,
  };
}
export function siwcAccountPermission(record:SiwcAccountCredentials,nowMs:number):'AUTHORIZED'|'DISABLED'{
  const grant:SiwcGrantReadback={
    identity:record.identity,scopes:record.scopes,nowMs,
    tokenExpiresAtMs:record.tokenExpiresAtMs,expectedClientId:record.clientId,
    pendingNonce:record.identity.expectedNonce,
  };
  return record.accessToken&&siwcGrantState(grant)==='AUTHORIZED'?'AUTHORIZED':'DISABLED';
}
/** Never leak tokens into a browser response or exception. */
export function siwcPublicState(r:SiwcAccountCredentials,nowMs:number) {
  return {clientId:r.clientId,connected:true,planUsage:siwcAccountPermission(r,nowMs),
    hostId:r.hostId,subjectRef:'REDACTED',expiresAtMs:r.tokenExpiresAtMs};
}
