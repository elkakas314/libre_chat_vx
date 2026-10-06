import type {
  ProviderCapability,
  ProviderHealth,
  ProviderQuotaState,
  ProviderRoute,
  SemanticProfileId,
} from './inferenceGateway';
import { nostromoIdentityProfileHash, NOSTROMO_IDENTITY_PROFILE } from './nostromoIdentity';

export interface ProviderStatusView {
  profile: SemanticProfileId;
  provider: string;
  model: string;
  locality: 'LOCAL' | 'REMOTE';
  capabilities: readonly ProviderCapability[];
  health: ProviderHealth;
  latencyMs?: number;
  quotaState: ProviderQuotaState;
  freshness: 'FRESH' | 'STALE' | 'UNKNOWN';
  identityProfileVersion: string;
  identityProfileHash: string;
  authority: false;
}

export function projectProviderStatus(
  route:ProviderRoute,
  nowMs=Date.now(),
  maxFreshnessMs=300_000,
):ProviderStatusView {
  const freshness=route.observedAtMs===undefined
    ? 'UNKNOWN'
    : nowMs-route.observedAtMs<=maxFreshnessMs ? 'FRESH' : 'STALE';
  return {
    profile:route.profile,
    provider:route.provider,
    model:route.model,
    locality:route.locality,
    capabilities:route.capabilities,
    health:route.health,
    latencyMs:route.latencyMs,
    quotaState:route.quotaState,
    freshness,
    identityProfileVersion:NOSTROMO_IDENTITY_PROFILE.version,
    identityProfileHash:nostromoIdentityProfileHash(),
    authority:false,
  };
}
