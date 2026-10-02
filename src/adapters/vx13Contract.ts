import {
  VX13_PARITY_SOURCE,
  type TargetRuntimeObservation,
  reconcileTargetParity,
} from './targetParity';

export const VX13_ADAPTER_STATE = 'DESIGN_ONLY' as const;

export const VX13_AUTHORITY_CHAIN = [
  'TENTACULO_LINK',
  'SWITCH',
  'MADRE',
  'MANIFESTATOR_IF_NEEDED',
  'SPAWNER_HIJA_ADAPTER',
  'READBACK',
  'MADRE_VERIFICATION',
  'RECEIPT_PROJECTION',
] as const;

export function vx13Parity(
  observation?: TargetRuntimeObservation,
) {
  return reconcileTargetParity(VX13_PARITY_SOURCE, observation);
}

// VX13 is source/design-only in the current remote repository.
// No live capabilities, mutation lane or material readiness may be inferred
// until a real Tentaculo Link / Madre runtime contract is observed.
