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
  // A timestamp alone does not establish live provider evidence. Fail closed
  // for configuration-only observations, malformed clocks and future timestamps.
  const observed=route.observedAtMs;
  const freshness:ProviderStatusView['freshness'] =
    route.evidence!=='LIVE_READBACK' || observed===undefined ||
    !Number.isFinite(observed) || !Number.isFinite(nowMs) ||
    !Number.isFinite(maxFreshnessMs) || maxFreshnessMs<0 || observed>nowMs
      ? 'UNKNOWN'
      : nowMs-observed<=maxFreshnessMs ? 'FRESH' : 'STALE';
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
