import type { SemanticProfileId } from './inferenceGateway';

export interface CloudflareGatewayEnvNames {
  accountId: 'CLOUDFLARE_ACCOUNT_ID';
  gatewayId: 'CLOUDFLARE_AI_GATEWAY_ID';
  apiToken: 'CLOUDFLARE_API_TOKEN';
  byokOnlyRequired: 'CLOUDFLARE_AIG_BYOK_ONLY_REQUIRED';
}

export const CLOUDFLARE_GATEWAY_ENV: CloudflareGatewayEnvNames = {
  accountId:'CLOUDFLARE_ACCOUNT_ID',
  gatewayId:'CLOUDFLARE_AI_GATEWAY_ID',
  apiToken:'CLOUDFLARE_API_TOKEN',
  byokOnlyRequired:'CLOUDFLARE_AIG_BYOK_ONLY_REQUIRED',
};

export const CLOUDFLARE_SEMANTIC_ROUTES: Readonly<Record<SemanticProfileId,string>> = {
  RAPIDO:'dynamic/nostromo-rapido',
  NORMAL:'dynamic/nostromo-normal',
  PENSAR:'dynamic/nostromo-pensar',
  CODIGO:'dynamic/nostromo-codigo',
  CONTEXTO_LARGO:'dynamic/nostromo-contexto-largo',
  VISION:'dynamic/nostromo-vision',
};

export interface CloudflareGatewayBinding {
  state: 'CONFIGURED_SOURCE_ONLY' | 'UNCONFIGURED';
  baseURL?: string;
  gatewayId?: string;
  authorizationSecretPresent: boolean;
  byokOnlyRequired: boolean;
  noWholesalePerRequest: true;
  unifiedBillingRequired: false;
  paidFallbackAllowed: false;
  authority: false;
  missing: readonly string[];
}

export function resolveCloudflareGatewayBinding(
  env: Readonly<Record<string,string|undefined>>,
): CloudflareGatewayBinding {
  const accountId=env[CLOUDFLARE_GATEWAY_ENV.accountId]?.trim();
  const gatewayId=env[CLOUDFLARE_GATEWAY_ENV.gatewayId]?.trim();
  const token=env[CLOUDFLARE_GATEWAY_ENV.apiToken]?.trim();
  const byokOnly=env[CLOUDFLARE_GATEWAY_ENV.byokOnlyRequired]?.toLowerCase()==='true';
  const missing:string[]=[];
  if (!accountId) missing.push(CLOUDFLARE_GATEWAY_ENV.accountId);
  if (!gatewayId) missing.push(CLOUDFLARE_GATEWAY_ENV.gatewayId);
  if (!token) missing.push(CLOUDFLARE_GATEWAY_ENV.apiToken);
  if (!byokOnly) missing.push('CLOUDFLARE_AIG_BYOK_ONLY_REQUIRED=true');

  return {
    state:missing.length===0 ? 'CONFIGURED_SOURCE_ONLY' : 'UNCONFIGURED',
    baseURL:accountId ? 'https://api.cloudflare.com/client/v4/accounts/'+accountId+'/ai/v1' : undefined,
    gatewayId,
    authorizationSecretPresent:Boolean(token),
    byokOnlyRequired:byokOnly,
    noWholesalePerRequest:true,
    unifiedBillingRequired:false,
    paidFallbackAllowed:false,
    authority:false,
    missing,
  };
}

export interface CloudflareChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: unknown;
}

export interface CloudflareChatRequest {
  model: string;
  messages: readonly CloudflareChatMessage[];
  stream: boolean;
}

export function buildCloudflareChatRequest(
  profile: SemanticProfileId,
  messages: readonly CloudflareChatMessage[],
  stream=true,
): CloudflareChatRequest {
  return { model:CLOUDFLARE_SEMANTIC_ROUTES[profile], messages, stream };
}

export interface CloudflareNonSecretHeaders {
  'cf-aig-gateway-id': string;
  'cf-aig-no-wholesale': 'true';
}

export function buildCloudflareNonSecretHeaders(binding: CloudflareGatewayBinding): CloudflareNonSecretHeaders | undefined {
  if (!binding.gatewayId) return undefined;
  return {
    'cf-aig-gateway-id':binding.gatewayId,
    'cf-aig-no-wholesale':'true',
  };
}
