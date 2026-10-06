import type { ProviderStatusView } from '../llm/providerStatus';

export interface ProviderHudProjection {
  lane: 'INFERENCE';
  label: string;
  profile: ProviderStatusView['profile'];
  provider: string;
  model: string;
  locality: ProviderStatusView['locality'];
  capabilities: ProviderStatusView['capabilities'];
  health: ProviderStatusView['health'];
  latencyMs?: number;
  quotaState: ProviderStatusView['quotaState'];
  freshness: ProviderStatusView['freshness'];
  identityProfileVersion: string;
  identityProfileHash: string;
  targetTruth: 'SEPARATE';
  authority: false;
}

export function providerStatusToHud(status: ProviderStatusView): ProviderHudProjection {
  return {
    lane: 'INFERENCE',
    label: `${status.profile} · ${status.provider}/${status.model}`,
    profile: status.profile,
    provider: status.provider,
    model: status.model,
    locality: status.locality,
    capabilities: status.capabilities,
    health: status.health,
    latencyMs: status.latencyMs,
    quotaState: status.quotaState,
    freshness: status.freshness,
    identityProfileVersion: status.identityProfileVersion,
    identityProfileHash: status.identityProfileHash,
    targetTruth: 'SEPARATE',
    authority: false,
  };
}
