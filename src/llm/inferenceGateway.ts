export type SemanticProfileId =
  | 'RAPIDO'
  | 'NORMAL'
  | 'PENSAR'
  | 'INVESTIGAR'
  | 'VISUALIZAR'
  | 'CONTEXTO_LARGO'
  | 'VISION';

export type ProviderCapability =
  | 'TEXT'
  | 'VISION'
  | 'AUDIO'
  | 'STRUCTURED_OUTPUT'
  | 'TOOLS'
  | 'LONG_CONTEXT';

export type ProviderHealth = 'READY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';
export type ProviderQuotaState = 'AVAILABLE' | 'THROTTLED' | 'EXHAUSTED' | 'UNKNOWN';
export type ZeroCostState = 'VERIFIED_ZERO_COST' | 'UNKNOWN' | 'BILLABLE';
export type RouteLocality = 'LOCAL' | 'REMOTE';
export type RouteEvidence = 'LIVE_READBACK' | 'CONFIG_ONLY';

export interface SemanticProfile {
  id: SemanticProfileId;
  label: string;
  requiredCapabilities: readonly ProviderCapability[];
  minimumContextTokens?: number;
}

export const SEMANTIC_PROFILES: Readonly<Record<SemanticProfileId, SemanticProfile>> = {
  RAPIDO: { id:'RAPIDO', label:'Rápido', requiredCapabilities:['TEXT'] },
  NORMAL: { id:'NORMAL', label:'Normal', requiredCapabilities:['TEXT'] },
  PENSAR: { id:'PENSAR', label:'Pensar', requiredCapabilities:['TEXT','STRUCTURED_OUTPUT'] },
  INVESTIGAR: {
    id:'INVESTIGAR',
    label:'Investigar',
    requiredCapabilities:['TEXT','STRUCTURED_OUTPUT','TOOLS'],
  },
  VISUALIZAR: {
    id:'VISUALIZAR',
    label:'Visualizar',
    requiredCapabilities:['TEXT','STRUCTURED_OUTPUT'],
  },
  CONTEXTO_LARGO: {
    id:'CONTEXTO_LARGO',
    label:'Contexto largo',
    requiredCapabilities:['TEXT','LONG_CONTEXT'],
    minimumContextTokens:128000,
  },
  VISION: { id:'VISION', label:'Visión', requiredCapabilities:['TEXT','VISION'] },
};

export interface InferenceIntentSignals {
  needsResearch?: boolean;
  needsVisualization?: boolean;
  needsDeepReasoning?: boolean;
  needsLongContext?: boolean;
  needsVision?: boolean;
  preferFast?: boolean;
}

export function selectSemanticProfile(signals: InferenceIntentSignals): SemanticProfileId {
  if (signals.needsVision) return 'VISION';
  if (signals.needsResearch) return 'INVESTIGAR';
  if (signals.needsVisualization) return 'VISUALIZAR';
  if (signals.needsLongContext) return 'CONTEXTO_LARGO';
  if (signals.needsDeepReasoning) return 'PENSAR';
  if (signals.preferFast) return 'RAPIDO';
  return 'NORMAL';
}

export interface ProviderRoute {
  id: string;
  profile: SemanticProfileId;
  provider: string;
  model: string;
  routeModel: string;
  locality: RouteLocality;
  capabilities: readonly ProviderCapability[];
  health: ProviderHealth;
  quotaState: ProviderQuotaState;
  zeroCost: ZeroCostState;
  contextWindowTokens?: number;
  privacyAllowed: boolean;
  paidFallbackAllowed: boolean;
  latencyMs?: number;
  observedAtMs?: number;
  evidence: RouteEvidence;
  authority: false;
}

export interface ProviderAdmissionRequest {
  profile: SemanticProfileId;
  estimatedInputTokens?: number;
  nowMs?: number;
  maxFreshnessMs?: number;
}

export interface ProviderAdmission {
  routeId: string;
  admitted: boolean;
  reasons: readonly string[];
}

export function admitProviderRoute(
  route: ProviderRoute,
  request: ProviderAdmissionRequest,
): ProviderAdmission {
  const profile=SEMANTIC_PROFILES[request.profile];
  const reasons:string[]=[];

  if (route.profile !== request.profile) reasons.push('PROFILE_MISMATCH');
  if (route.health !== 'READY') reasons.push('HEALTH_'+route.health);
  if (route.quotaState !== 'AVAILABLE') reasons.push('QUOTA_'+route.quotaState);
  if (route.zeroCost !== 'VERIFIED_ZERO_COST') reasons.push('ZERO_COST_'+route.zeroCost);
  if (route.paidFallbackAllowed) reasons.push('PAID_FALLBACK_FORBIDDEN');
  if (!route.privacyAllowed) reasons.push('PRIVACY_POLICY_REJECTED');
  if (route.evidence !== 'LIVE_READBACK') reasons.push('LIVE_READBACK_REQUIRED');

  for (const capability of profile.requiredCapabilities) {
    if (!route.capabilities.includes(capability)) reasons.push('CAPABILITY_'+capability+'_MISSING');
  }

  const requiredContext=Math.max(
    profile.minimumContextTokens ?? 0,
    request.estimatedInputTokens ?? 0,
  );
  if (requiredContext > 0 && (route.contextWindowTokens ?? 0) < requiredContext) {
    reasons.push('CONTEXT_FIT_FAILED');
  }

  if (route.observedAtMs !== undefined) {
    const now=request.nowMs ?? Date.now();
    const maxFreshness=request.maxFreshnessMs ?? 300_000;
    if (now - route.observedAtMs > maxFreshness) reasons.push('ROUTE_READBACK_STALE');
  }

  return { routeId:route.id, admitted:reasons.length===0, reasons };
}

export interface ProviderResolution {
  profile: SemanticProfileId;
  selected?: ProviderRoute;
  admissions: readonly ProviderAdmission[];
}

export interface ProviderRouteResolver {
  resolve(request: ProviderAdmissionRequest, routes: readonly ProviderRoute[]): ProviderResolution;
}

export class StrictZeroCostRouteResolver implements ProviderRouteResolver {
  resolve(request: ProviderAdmissionRequest, routes: readonly ProviderRoute[]): ProviderResolution {
    const candidates=routes.filter((route)=>route.profile===request.profile);
    const admissions=candidates.map((route)=>admitProviderRoute(route,request));
    const allowed=candidates
      .filter((route)=>admissions.find((a)=>a.routeId===route.id)?.admitted)
      .sort((a,b)=>(a.latencyMs ?? Number.MAX_SAFE_INTEGER)-(b.latencyMs ?? Number.MAX_SAFE_INTEGER));
    return { profile:request.profile, selected:allowed[0], admissions };
  }
}

export interface InferenceGateway {
  readonly owner: 'CLOUDFLARE_AI_GATEWAY';
  readonly authority: false;
  selectProfile(signals: InferenceIntentSignals): SemanticProfileId;
  resolveProviderRoute(
    request: ProviderAdmissionRequest,
    routes: readonly ProviderRoute[],
  ): ProviderResolution;
}

export class NostromoInferenceGateway implements InferenceGateway {
  readonly owner='CLOUDFLARE_AI_GATEWAY' as const;
  readonly authority=false as const;

  constructor(
    private readonly resolver: ProviderRouteResolver = new StrictZeroCostRouteResolver(),
  ) {}

  selectProfile(signals: InferenceIntentSignals): SemanticProfileId {
    return selectSemanticProfile(signals);
  }

  resolveProviderRoute(
    request: ProviderAdmissionRequest,
    routes: readonly ProviderRoute[],
  ): ProviderResolution {
    return this.resolver.resolve(request,routes);
  }
}

export type ContextStrategy = 'TARGETED_READS' | 'RAG' | 'COMPACT' | 'LONG_CONTEXT' | 'UNAVAILABLE';

export interface ContextPolicySignals {
  targetedReadsSufficient: boolean;
  retrievalSufficient: boolean;
  compactionSufficient: boolean;
  wholeCorpusRequired: boolean;
  longContextAvailable: boolean;
}

export function chooseContextStrategy(signals: ContextPolicySignals): ContextStrategy {
  if (signals.targetedReadsSufficient) return 'TARGETED_READS';
  if (signals.retrievalSufficient) return 'RAG';
  if (signals.compactionSufficient) return 'COMPACT';
  if (signals.wholeCorpusRequired && signals.longContextAvailable) return 'LONG_CONTEXT';
  return 'UNAVAILABLE';
}
