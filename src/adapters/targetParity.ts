export type TargetParityId = 'VX13' | 'MANOJOS3';

export type SourceMaturity =
  | 'DESIGN_CONSOLIDATION'
  | 'IMPLEMENTED_SOURCE'
  | 'FROZEN_SOURCE';

export type BindingState =
  | 'UNCONFIGURED'
  | 'PREPARED_UNCONFIGURED'
  | 'BOUND_READONLY'
  | 'BOUND_GOVERNED';

export type RuntimeState =
  | 'NO_VERIFICADO'
  | 'OFFLINE'
  | 'DEGRADED'
  | 'LIVE';

export type AuthorityOwner =
  | 'VX13_MADRE'
  | 'MANOJOS3_POLICY_KERNEL';

export interface TargetParityContract {
  targetId: TargetParityId;
  sourceMaturity: SourceMaturity;
  bindingState: BindingState;
  runtimeState: RuntimeState;
  authorityOwner: AuthorityOwner;
  ingress: readonly string[];
  executionChain: readonly string[];
  requiredReadSurfaces: readonly string[];
  capabilityDiscovery: true;
  sourceVsLiveSeparated: true;
  connectionReadinessWorkEvidenceSeparated: true;
  readbackRequiredForEffects: true;
  verificationRequiredForEffects: true;
  receiptRequiredForEffects: true;
  uiAuthority: false;
}

export const COMMON_TARGET_GUARANTEES = {
  capabilityDiscovery: true,
  sourceVsLiveSeparated: true,
  connectionReadinessWorkEvidenceSeparated: true,
  readbackRequiredForEffects: true,
  verificationRequiredForEffects: true,
  receiptRequiredForEffects: true,
  uiAuthority: false,
} as const;

export const MANOJOS3_PARITY_SOURCE: TargetParityContract = {
  targetId: 'MANOJOS3',
  sourceMaturity: 'IMPLEMENTED_SOURCE',
  bindingState: 'PREPARED_UNCONFIGURED',
  runtimeState: 'NO_VERIFICADO',
  authorityOwner: 'MANOJOS3_POLICY_KERNEL',
  ingress: ['MCP_OR_CONTROL_PLANE'],
  executionChain: [
    'GOVERNOR',
    'POLICY',
    'KERNEL',
    'ADAPTER',
    'READBACK',
    'VERIFIER',
    'RECEIPT',
  ],
  requiredReadSurfaces: [
    'health',
    'readiness',
    'self',
    'capabilities',
    'skills',
  ],
  ...COMMON_TARGET_GUARANTEES,
};

export const VX13_PARITY_SOURCE: TargetParityContract = {
  targetId: 'VX13',
  sourceMaturity: 'DESIGN_CONSOLIDATION',
  bindingState: 'UNCONFIGURED',
  runtimeState: 'NO_VERIFICADO',
  authorityOwner: 'VX13_MADRE',
  ingress: ['TENTACULO_LINK'],
  executionChain: [
    'SWITCH',
    'MADRE_POLICY_AUTH',
    'MANIFESTATOR_IF_NEEDED',
    'SPAWNER_HIJA_ADAPTER',
    'READBACK',
    'MADRE_VERIFICATION',
    'RECEIPT_PROJECTION',
  ],
  requiredReadSurfaces: [
    'health',
    'readiness',
    'self',
    'capabilities',
  ],
  ...COMMON_TARGET_GUARANTEES,
};

export interface TargetRuntimeObservation {
  targetId: TargetParityId;
  connected: boolean;
  readiness: 'READY' | 'NOT_READY' | 'UNCONFIGURED' | 'UNKNOWN';
  sourceRevision?: string;
  liveRevision?: string;
  capabilityCount?: number;
  observedAt: string;
  evidenceRefs: string[];
}

export interface TargetParityTruth {
  source: TargetParityContract;
  observation?: TargetRuntimeObservation;
  sourceMatchesLive: boolean | null;
  materialReady: boolean;
}

export function reconcileTargetParity(
  source: TargetParityContract,
  observation?: TargetRuntimeObservation,
): TargetParityTruth {
  if (!observation) {
    return {
      source,
      sourceMatchesLive: null,
      materialReady: false,
    };
  }

  const sourceMatchesLive =
    Boolean(observation.sourceRevision) &&
    Boolean(observation.liveRevision) &&
    observation.sourceRevision === observation.liveRevision;

  return {
    source,
    observation,
    sourceMatchesLive,
    materialReady:
      observation.connected &&
      observation.readiness === 'READY' &&
      source.bindingState === 'BOUND_GOVERNED' &&
      sourceMatchesLive,
  };
}

export function parityGuaranteesAligned(
  left: TargetParityContract,
  right: TargetParityContract,
): boolean {
  return (
    left.capabilityDiscovery === right.capabilityDiscovery &&
    left.sourceVsLiveSeparated === right.sourceVsLiveSeparated &&
    left.connectionReadinessWorkEvidenceSeparated === right.connectionReadinessWorkEvidenceSeparated &&
    left.readbackRequiredForEffects === right.readbackRequiredForEffects &&
    left.verificationRequiredForEffects === right.verificationRequiredForEffects &&
    left.receiptRequiredForEffects === right.receiptRequiredForEffects &&
    left.uiAuthority === false &&
    right.uiAuthority === false
  );
}
