import { createPublicKey, verify as verifySignature, constants, timingSafeEqual } from 'node:crypto';
import type { SiwcVerifiedIdentity } from './chatgptAuthorized';

/** Server-only OIDC verifier. The caller fetches the pinned OpenAI JWKS over TLS. */
export const OPENAI_SIWC_ISSUER='https://auth.openai.com';
export const OPENAI_SIWC_JWKS_URI='https://auth.openai.com/.well-known/jwks.json';
type JwtObject=Record<string,unknown>;
export interface SiwcJwks {keys:readonly JsonWebKey[];}
function object(input:unknown):JwtObject {
  if(typeof input!=='object'||input===null||Array.isArray(input))throw new Error('SIWC_JWT_INVALID');
  return input as JwtObject;
}
function parseBase64Json(input:string):JwtObject {
  if(input.length>32768||!input||!/^[A-Za-z0-9_-]+$/.test(input))throw new Error('SIWC_JWT_INVALID');
  let data:unknown;
  try{data=JSON.parse(Buffer.from(input,'base64url').toString('utf8'));}catch{throw new Error('SIWC_JWT_INVALID');}
  return object(data);
}
function same(a:string,b:string):boolean{
  const left=Buffer.from(a),right=Buffer.from(b);
  return left.length===right.length&&timingSafeEqual(left,right);
}
export function verifySiwcIdToken(input:{
  idToken:string;issuedClientId:string;nonce:string;jwks:SiwcJwks;
  nowSec?:number;expectedSubject?:string;
}):SiwcVerifiedIdentity {
  const parts=input.idToken.split('.');
  if(parts.length!==3||input.idToken.length>65536||
     !parts.every(x=>x&&/^[A-Za-z0-9_-]+$/.test(x)))throw new Error('SIWC_JWT_INVALID');
  const [encodedHeader,encodedPayload,encodedSignature]=parts;
  const h=parseBase64Json(encodedHeader),p=parseBase64Json(encodedPayload);
  if(!['RS256','PS256','ES256'].includes(String(h.alg))||
    typeof h.kid!=='string'||!h.kid||h.kid.length>256||h.crit!==undefined||
    h.jku!==undefined||h.x5u!==undefined)throw new Error('SIWC_JWT_ALG_REJECTED');
  if(!input.jwks||!Array.isArray(input.jwks.keys)||input.jwks.keys.length>32)
    throw new Error('SIWC_JWKS_INVALID');
  const alg=h.alg as 'RS256'|'PS256'|'ES256';
  const matches=input.jwks.keys.filter(k=>k&&k.kid===h.kid&&
    (!k.use||k.use==='sig')&&(!k.key_ops||k.key_ops.includes('verify'))&&
    (!k.alg||k.alg===alg)&&
    ((alg==='ES256'&&k.kty==='EC'&&k.crv==='P-256')||
    (alg!=='ES256'&&k.kty==='RSA')));
  if(matches.length!==1)throw new Error('SIWC_JWKS_KEY_MISSING_OR_AMBIGUOUS');
  const key=matches[0];
  if((key as JsonWebKey&{d?:string}).d)throw new Error('SIWC_JWKS_PRIVATE_KEY');
  let valid=false;
  try{
    const publicKey=createPublicKey({key,format:'jwk'});
    const payload=Buffer.from(encodedHeader+'.'+encodedPayload);
    const signature=Buffer.from(encodedSignature,'base64url');
    valid=alg==='RS256'
      ?verifySignature('RSA-SHA256',payload,publicKey,signature)
      :alg==='PS256'
        ?verifySignature('RSA-SHA256',payload,{key:publicKey,padding:constants.RSA_PKCS1_PSS_PADDING,saltLength:32},signature)
        :verifySignature('sha256',payload,{key:publicKey,dsaEncoding:'ieee-p1363'},signature);
  }catch{valid=false;}
  if(!valid)throw new Error('SIWC_JWT_SIGNATURE_INVALID');
  const now=input.nowSec??Math.floor(Date.now()/1000),leeway=5;
  if(!Number.isSafeInteger(now)||!Number.isFinite(p.iat)||!Number.isFinite(p.exp)||
    typeof p.iat!=='number'||typeof p.exp!=='number'||
    p.exp<=now-leeway||p.iat>now+leeway||
    (p.nbf!==undefined&&(typeof p.nbf!=='number'||p.nbf>now+leeway)))
    throw new Error('SIWC_JWT_TIME_INVALID');
  if(p.iss!==OPENAI_SIWC_ISSUER||p.aud!==input.issuedClientId||
    typeof p.nonce!=='string'||!same(p.nonce,input.nonce)||
    typeof p.sub!=='string'||!p.sub||
    (input.expectedSubject!==undefined&&!same(p.sub,input.expectedSubject)))
    throw new Error('SIWC_JWT_CLAIMS_INVALID');
  return {verification:'OIDC_JWKS_NONCE_AUD_VERIFIED',
    subject:p.sub,issuedClientId:input.issuedClientId,expectedNonce:input.nonce};
}
