import test from 'node:test';
import assert from 'node:assert/strict';
import {siwcPlanProviderRoutes} from '../src/llm/siwcProviderRoutes';
import type {SiwcAccountCredentials} from '../src/llm/siwcSession';

const now=1_800_000_000_000;
const account:SiwcAccountCredentials={
  clientId:'oaiapp_example',hostId:'urn:uuid:11111111-2222-4333-8444-555555555555',
  subject:'owner',identity:{verification:'OIDC_JWKS_NONCE_AUD_VERIFIED',
    subject:'owner',issuedClientId:'oaiapp_example',expectedNonce:'nonce'},
  scopes:['openid','resource.invoke','chatgpt.tokens.use.direct'],savedAtMs:now-1000,
  tokenExpiresAtMs:now+60_000,earliestRefreshAtMs:now,
  accessToken:'fixture',refreshToken:null,idToken:'fixture',
};
const visibleModels=[{slug:'live-model',label:'Live model'}];
const readbacks=[{model:'live-model',profile:'NORMAL' as const,capabilities:['TEXT' as const],
  contextWindowTokens:32_000,health:'READY' as const,quotaState:'AVAILABLE' as const,
  observedAtMs:now-1000}];

test('SIWC plan usage routes are emitted only from authorized account and account-visible model readbacks',()=>{
  const routes=siwcPlanProviderRoutes({account,visibleModels,readbacks,privacyAllowed:true,nowMs:now});
  assert.equal(routes.length,1);
  assert.equal(routes[0].provider,'CHATGPT_OAUTH_PLAN');
  assert.equal(routes[0].billingClass,'SUBSCRIPTION_SHARED');
  assert.equal(routes[0].zeroCost,'UNKNOWN');
  assert.equal(routes[0].planUsageConsent,'AUTHORIZED');
  assert.equal(routes[0].paidFallbackAllowed,false);

  assert.deepEqual(siwcPlanProviderRoutes({account:{...account,scopes:['openid']},
    visibleModels,readbacks,privacyAllowed:true,nowMs:now}),[]);
  assert.deepEqual(siwcPlanProviderRoutes({account,visibleModels:[{slug:'other',label:'Other'}],
    readbacks,privacyAllowed:true,nowMs:now}),[]);
  assert.deepEqual(siwcPlanProviderRoutes({account,visibleModels,readbacks,privacyAllowed:false,nowMs:now}),[]);
});

test('unverified or unusable model readbacks are not route candidates',()=>{
  const routes=siwcPlanProviderRoutes({account,visibleModels,readbacks:[
    {...readbacks[0],contextWindowTokens:0},
    {...readbacks[0],observedAtMs:now+1},
    {...readbacks[0],model:'not-visible'},
  ],privacyAllowed:true,nowMs:now});
  assert.deepEqual(routes,[]);
});
