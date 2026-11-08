import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { startSiwc } from '../src/llm/chatgptAuthorized';
import { verifySiwcIdToken } from '../src/llm/siwcIdentity';
import { authorizeSiwcTokens, rotateSiwcTokens, siwcRefreshRequest, siwcPublicState,
  siwcAccountPermission } from '../src/llm/siwcSession';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const pub={...publicKey.export({format:'jwk'}),kid:'key1',alg:'RS256',use:'sig'};
const jwks={keys:[pub]};
const callback='http://127.0.0.1:1455/auth/callback';
const hostId='urn:uuid:11111111-2222-4333-8444-555555555555';
const pending=startSiwc({hostId,callback,actualAppName:'LibreChat VX NOSTROMO',requestPlanUsage:true});
const clientId='oaiapp_test';
const now=1900000000;
function jwt(overrides:Record<string,unknown>={},headerOverrides:Record<string,unknown>={}){
  const header=Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT',kid:'key1',...headerOverrides})).toString('base64url');
  const payload=Buffer.from(JSON.stringify({iss:'https://auth.openai.com',aud:clientId,
    sub:'subject-A',nonce:pending.nonce,iat:now-10,exp:now+3600,...overrides})).toString('base64url');
  const body=header+'.'+payload;
  return body+'.'+sign('RSA-SHA256',Buffer.from(body),privateKey).toString('base64url');
}
const token=(scope='openid profile email offline_access resource.invoke chatgpt.tokens.use.direct')=>({
  id_token:jwt(),scope,access_token:'a-token',refresh_token:'r-token',
  token_type:'Bearer',expires_in:3600,
});
test('OIDC verifies RSA signature, pinned issuer, client audience, expiry and nonce',()=>{
  const identity=verifySiwcIdToken({idToken:jwt(),issuedClientId:clientId,
    nonce:pending.nonce,jwks,nowSec:now});
  assert.equal(identity.subject,'subject-A');
  for(const claims of [{iss:'https://attacker.invalid'},{aud:'oaiapp_other'},
    {nonce:'wrong'},{exp:now-100},{iat:now+100},{sub:'subject-B'}]){
    assert.throws(()=>verifySiwcIdToken({idToken:jwt(claims),
      issuedClientId:clientId,nonce:pending.nonce,jwks,nowSec:now,
      expectedSubject:'subject-A'}));
  }
});
test('OIDC rejects key substitution, alg none, private JWKS, invalid signature',()=>{
  assert.throws(()=>verifySiwcIdToken({idToken:jwt(),issuedClientId:clientId,
    nonce:pending.nonce,jwks:{keys:[]},nowSec:now}),/MISSING/);
  assert.throws(()=>verifySiwcIdToken({idToken:jwt({}, {alg:'none'}),
    issuedClientId:clientId,nonce:pending.nonce,jwks,nowSec:now}),/ALG/);
  assert.throws(()=>verifySiwcIdToken({idToken:jwt().slice(0,-3)+'abc',
    issuedClientId:clientId,nonce:pending.nonce,jwks,nowSec:now}),/SIGNATURE/);
  const invalidPrivate={...pub,d:'SECRET_PRIVATE'};
  assert.throws(()=>verifySiwcIdToken({idToken:jwt(),issuedClientId:clientId,
    nonce:pending.nonce,jwks:{keys:[invalidPrivate]},nowSec:now}),/PRIVATE/);
});
test('OAuth exchange admits only account-bound signed identity',()=>{
  const s=authorizeSiwcTokens({pending,issuedClientId:clientId,response:token(),
    jwks,nowMs:now*1000});
  assert.equal(s.subject,'subject-A');assert.equal(siwcAccountPermission(s,now*1000),'AUTHORIZED');
  assert.equal(siwcPublicState(s,now*1000).subjectRef,'REDACTED');
  assert.equal(JSON.stringify(siwcPublicState(s,now*1000)).includes('a-token'),false);
  assert.throws(()=>authorizeSiwcTokens({pending,issuedClientId:'oaiapp_bad',
    response:token(),jwks,nowMs:now*1000}),/CLAIMS/);
  assert.throws(()=>authorizeSiwcTokens({pending,issuedClientId:clientId,
    response:{...token(),id_token:jwt({sub:'subject-B'})},jwks,nowMs:now*1000,
    previous:s}),/CLAIMS/);
  assert.throws(()=>authorizeSiwcTokens({pending,issuedClientId:clientId,
    response:{...token(),scope:'openid'},jwks,nowMs:now*1000,
    previous:{...s,hostId:'urn:uuid:22222222-2222-4333-8444-555555555555'}}),/MISMATCH/);
});
test('Plan authorization and refresh are separate and rotate token atomically',()=>{
  const record=authorizeSiwcTokens({pending,issuedClientId:clientId,response:token(),
    jwks,nowMs:now*1000});
  const body=new URLSearchParams(siwcRefreshRequest(record).body);
  assert.equal(body.get('grant_type'),'refresh_token');
  assert.equal(body.get('client_id'),clientId);
  const rotated=rotateSiwcTokens(record,{access_token:'new-access',refresh_token:'new-refresh',
    token_type:'Bearer',scope:'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct',
    expires_in:3600},(now+120)*1000);
  assert.equal(rotated.refreshToken,'new-refresh');
  assert.equal(rotated.accessToken,'new-access');
  assert.equal(siwcAccountPermission(rotated,(now+120)*1000),'AUTHORIZED');
  assert.throws(()=>rotateSiwcTokens(record,{access_token:'new-access',
    token_type:'Bearer',scope:'openid',expires_in:3600},now*1000),/INVALID/);
  assert.equal(siwcAccountPermission({...record,scopes:['openid']},now*1000),'DISABLED');
  assert.equal(siwcAccountPermission({...record,tokenExpiresAtMs:now*1000},now*1000),'DISABLED');
});
