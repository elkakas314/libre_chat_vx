import type { ProviderCapability, ProviderHealth, ProviderQuotaState,
  ProviderRoute, SemanticProfileId } from './inferenceGateway';
import type { SiwcAccountCredentials } from './siwcSession';
import { siwcAccountPermission } from './siwcSession';

/** Account-specific host readback. Capabilities/context are evidence inputs, never inferred from a model slug. */
export interface SiwcModelReadback {
  model:string;
  profile:SemanticProfileId;
  capabilities:readonly ProviderCapability[];
  contextWindowTokens:number;
  health:ProviderHealth;
  quotaState:ProviderQuotaState;
  latencyMs?:number;
  observedAtMs:number;
}

/**
 * Projects verified SIWC account/model state into the existing NOSTROMO route
 * resolver. Shared plan usage is deliberately distinct from a zero-cost route.
 */
export function siwcPlanProviderRoutes(input:{
  account:SiwcAccountCredentials;
  visibleModels:readonly {slug:string;label:string}[];
  readbacks:readonly SiwcModelReadback[];
  privacyAllowed:boolean;
  nowMs:number;
}):readonly ProviderRoute[] {
  if(siwcAccountPermission(input.account,input.nowMs)!=='AUTHORIZED')return [];
  if(!input.privacyAllowed||!Number.isSafeInteger(input.nowMs))return [];
  const visible=new Set(input.visibleModels.map(model=>model.slug));
  const routes:ProviderRoute[]=[];
  for(const readback of input.readbacks){
    if(!visible.has(readback.model)||!Number.isSafeInteger(readback.contextWindowTokens)||
      readback.contextWindowTokens<=0||!Number.isSafeInteger(readback.observedAtMs)||
      readback.observedAtMs>input.nowMs)continue;
    routes.push({
      id:`siwc:${input.account.clientId}:${readback.model}:${readback.profile}`,
      profile:readback.profile,
      provider:'CHATGPT_OAUTH_PLAN',
      model:readback.model,
      routeModel:readback.model,
      locality:'REMOTE',
      capabilities:[...new Set(readback.capabilities)],
      health:readback.health,
      quotaState:readback.quotaState,
      zeroCost:'UNKNOWN',
      billingClass:'SUBSCRIPTION_SHARED',
      planUsageConsent:'AUTHORIZED',
      contextWindowTokens:readback.contextWindowTokens,
      privacyAllowed:true,
      paidFallbackAllowed:false,
      ...(readback.latencyMs===undefined?{}:{latencyMs:readback.latencyMs}),
      observedAtMs:readback.observedAtMs,
      evidence:'LIVE_READBACK',
      authority:false,
    });
  }
  return routes;
}
