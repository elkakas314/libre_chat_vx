import {
  MANOJOS3_LIBRECHAT_INTEGRATION,
  MANOJOS3_PARITY_DESCRIPTOR,
  type TargetRuntimeObservation,
  reconcileTargetParity,
} from './targetParity';

export const MANOJOS3_FLOW = [
  'LIBRECHAT',
  'MCP_OR_CONTROL_PLANE',
  'GOVERNOR',
  'POLICY_AUTH',
  'KERNEL',
  'ADAPTER',
  'READBACK',
  'VERIFIER_RECEIPT',
  'RECEIPT_PROJECTION',
] as const;

export interface Manojos3BindingTruth {
  configured: boolean;
  bindingReady: boolean;
  callableProbePassed: boolean;
  sourceRevision?: string;
  liveRevision?: string;
}

export function manojos3Parity(observation?: TargetRuntimeObservation) {
  return reconcileTargetParity(
    MANOJOS3_PARITY_DESCRIPTOR,
    MANOJOS3_LIBRECHAT_INTEGRATION,
    observation,
  );
}

// Governor is admission/orchestration, Policy owns authorization,
// Kernel owns execution, and Verifier owns material verification.
// LibreChat owns none of those authorities.
