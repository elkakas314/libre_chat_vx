import {
  MANOJOS3_PARITY_SOURCE,
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

export function manojos3Parity(
  observation?: TargetRuntimeObservation,
) {
  return reconcileTargetParity(MANOJOS3_PARITY_SOURCE, observation);
}

// AUTH_REQUIRED is target-owned and cannot be satisfied by transport/UI alone.
// Source evidence: MANOJOS3 exposes LibreChat thread.read R0 / message.send R2
// only when a real binding exists; the adapter is fail-closed while unconfigured.
