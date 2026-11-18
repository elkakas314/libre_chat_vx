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
  INVESTIGAR:'dynamic/nostromo-investigar',
  VISUALIZAR:'dynamic/nostromo-visualizar',
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
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: unknown;
  name?: string;
  tool_call_id?: string;
  tool_calls?: readonly CloudflareToolCall[];
}

export interface CloudflareToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface CloudflareChatTool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: Readonly<Record<string,unknown>>;
    strict?: boolean;
  };
}

export type CloudflareChatToolChoice =
  | 'none'
  | 'auto'
  | 'required'
  | { type:'function'; function:{ name:string } };

export interface CloudflareChatOptions {
  tools?: readonly CloudflareChatTool[];
  toolChoice?: CloudflareChatToolChoice;
}

export interface CloudflareChatRequest {
  model: string;
  messages: readonly CloudflareChatMessage[];
  stream: boolean;
  tools?: readonly CloudflareChatTool[];
  tool_choice?: CloudflareChatToolChoice;
}

export function buildCloudflareChatRequest(
  profile: SemanticProfileId,
  messages: readonly CloudflareChatMessage[],
  stream=true,
  options: CloudflareChatOptions = {},
): CloudflareChatRequest {
  return {
    model:CLOUDFLARE_SEMANTIC_ROUTES[profile],
    messages,
    stream,
    ...(options.tools ? {tools:options.tools} : {}),
    ...(options.toolChoice ? {tool_choice:options.toolChoice} : {}),
  };
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

export interface CloudflareSecretResolver {
  get(name: 'CLOUDFLARE_API_TOKEN'): string | undefined;
}

export interface CloudflareHttpRequest {
  method: 'POST';
  headers: Readonly<Record<string,string>>;
  body: string;
}

export interface CloudflareHttpResponse {
  ok: boolean;
  status: number;
  body?: unknown;
}

export type CloudflareHttpFetch = (
  url: string,
  request: CloudflareHttpRequest,
) => Promise<CloudflareHttpResponse>;

export class CloudflareAiGatewayClient {
  constructor(
    private readonly binding: CloudflareGatewayBinding,
    private readonly secrets: CloudflareSecretResolver,
    private readonly http: CloudflareHttpFetch,
  ) {}

  async createChatCompletion(
    profile: SemanticProfileId,
    messages: readonly CloudflareChatMessage[],
    stream=true,
    options: CloudflareChatOptions = {},
  ): Promise<CloudflareHttpResponse> {
    if (this.binding.state!=='CONFIGURED_SOURCE_ONLY' || !this.binding.baseURL) {
      throw new Error('CLOUDFLARE_AI_GATEWAY_UNCONFIGURED');
    }
    const nonSecret=buildCloudflareNonSecretHeaders(this.binding);
    if (!nonSecret) throw new Error('CLOUDFLARE_AI_GATEWAY_ID_MISSING');

    const token=this.secrets.get('CLOUDFLARE_API_TOKEN')?.trim();
    if (!token) throw new Error('CLOUDFLARE_API_TOKEN_MISSING');

    return this.http(this.binding.baseURL+'/chat/completions',{
      method:'POST',
      headers:{
        Authorization:'Bearer '+token,
        'Content-Type':'application/json',
        ...nonSecret,
      },
      body:JSON.stringify(buildCloudflareChatRequest(profile,messages,stream,options)),
    });
  }
}
