import type { ConcreteTargetId } from '../cockpit/systemTarget';
import type { ConnectionState, ReadinessState } from '../cockpit/truthLanes';

export type TargetParityId = ConcreteTargetId;

export type SourceMaturity =
  | 'DESIGN_CONSOLIDATION'
  | 'IMPLEMENTED_SOURCE'
  | 'FROZEN_SOURCE';

export type AdapterImplementationState =
  | 'CONTRACT_ONLY'
  | 'SOURCE_IMPLEMENTED'
  | 'SOURCE_TESTED'
  | 'INSTALLED';

export type BindingState =
  | 'UNCONFIGURED'
  | 'PREPARED_UNCONFIGURED'
  | 'BOUND_READONLY'
  | 'BOUND_GOVERNED';

export type SourceAlignment = 'MATCH' | 'DRIFT' | 'UNKNOWN';

export interface TargetAuthorityModel {
  policyAuthority: 'VX13_MADRE' | 'MANOJOS3_POLICY';
  executionAuthority: 'VX13_SPAWNER_HIJA' | 'MANOJOS3_KERNEL';
  verificationAuthority: 'VX13_MADRE' | 'MANOJOS3_VERIFIER';
}

export interface TargetParityDescriptor {
  targetId: TargetParityId;
  sourceMaturity: SourceMaturity;
  authority: TargetAuthorityModel;
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

export interface TargetIntegrationState {
  adapterImplementation: AdapterImplementationState;
  bindingState: BindingState;
}

export interface TargetRuntimeObservation {
  targetId: TargetParityId;
  connection: ConnectionState;
  readiness: ReadinessState;
  sourceRevision?: string;
  liveRevision?: string;
  capabilityCount?: number;
  observedAt: string;
  evidenceRefs: string[];
}

export interface TargetParityTruth {
  descriptor: TargetParityDescriptor;
  integration: TargetIntegrationState;
  observation?: TargetRuntimeObservation;
  sourceAlignment: SourceAlignment;
  governedReadPathReady: boolean;
  governedMutationPathReady: boolean;
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

export const MANOJOS3_PARITY_DESCRIPTOR: TargetParityDescriptor = {
  targetId: 'MANOJOS3',
  sourceMaturity: 'IMPLEMENTED_SOURCE',
  authority: {
    policyAuthority: 'MANOJOS3_POLICY',
    executionAuthority: 'MANOJOS3_KERNEL',
    verificationAuthority: 'MANOJOS3_VERIFIER',
  },
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
  requiredReadSurfaces: ['health', 'readiness', 'self', 'capabilities', 'skills'],
  ...COMMON_TARGET_GUARANTEES,
};

export const VX13_PARITY_DESCRIPTOR: TargetParityDescriptor = {
  targetId: 'VX13',
  sourceMaturity: 'DESIGN_CONSOLIDATION',
  authority: {
    policyAuthority: 'VX13_MADRE',
    executionAuthority: 'VX13_SPAWNER_HIJA',
    verificationAuthority: 'VX13_MADRE',
  },
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
  requiredReadSurfaces: ['health', 'readiness', 'self', 'capabilities'],
  ...COMMON_TARGET_GUARANTEES,
};

export const MANOJOS3_LIBRECHAT_INTEGRATION: TargetIntegrationState = {
  adapterImplementation: 'CONTRACT_ONLY',
  bindingState: 'PREPARED_UNCONFIGURED',
};

export const VX13_LIBRECHAT_INTEGRATION: TargetIntegrationState = {
  adapterImplementation: 'CONTRACT_ONLY',
  bindingState: 'UNCONFIGURED',
};

/** @deprecated Static descriptor only; it is not live state. */
export const MANOJOS3_PARITY_SOURCE = MANOJOS3_PARITY_DESCRIPTOR;
/** @deprecated Static descriptor only; it is not live state. */
export const VX13_PARITY_SOURCE = VX13_PARITY_DESCRIPTOR;

export function sourceAlignment(observation?: TargetRuntimeObservation): SourceAlignment {
  if (!observation?.sourceRevision || !observation.liveRevision) return 'UNKNOWN';
  return observation.sourceRevision === observation.liveRevision ? 'MATCH' : 'DRIFT';
}

export function reconcileTargetParity(
  descriptor: TargetParityDescriptor,
  integration: TargetIntegrationState,
  observation?: TargetRuntimeObservation,
): TargetParityTruth {
  const alignment = sourceAlignment(observation);
  const readBinding =
    integration.bindingState === 'BOUND_READONLY' ||
    integration.bindingState === 'BOUND_GOVERNED';

  const governedReadPathReady = Boolean(
    observation &&
    readBinding &&
    observation.connection !== 'OFFLINE' &&
    observation.connection !== 'UNKNOWN' &&
    observation.readiness === 'READY' &&
    alignment === 'MATCH',
  );

  const governedMutationPathReady = Boolean(
    observation &&
    integration.bindingState === 'BOUND_GOVERNED' &&
    observation.connection === 'CONNECTED' &&
    observation.readiness === 'READY' &&
    alignment === 'MATCH',
  );

  return {
    descriptor,
    integration,
    observation,
    sourceAlignment: alignment,
    governedReadPathReady,
    governedMutationPathReady,
  };
}

export function parityGuaranteesAligned(
  left: TargetParityDescriptor,
  right: TargetParityDescriptor,
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
