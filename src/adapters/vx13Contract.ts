import {
  VX13_LIBRECHAT_INTEGRATION,
  VX13_PARITY_DESCRIPTOR,
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

export function vx13Parity(observation?: TargetRuntimeObservation) {
  return reconcileTargetParity(
    VX13_PARITY_DESCRIPTOR,
    VX13_LIBRECHAT_INTEGRATION,
    observation,
  );
}

// Tentáculo HUD != Tentáculo Link.
// Madre owns policy/authorization and verification.
// Spawner/hija owns execution.
// No live state is inferred from source design.
