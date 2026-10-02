import type { ConcreteTargetId } from '../cockpit/systemTarget';

export type MutationFenceStatus =
  | 'PREPARED'
  | 'SUBMITTED'
  | 'UNKNOWN_OUTCOME'
  | 'RECONCILING'
  | 'VERIFIED'
  | 'FAILED'
  | 'CANCELLED';

export interface BackgroundMutationFence {
  operationId: string;
  targetId: ConcreteTargetId;
  capabilityRef: string;
  effectScope: string;
  authorizationRef?: string;
  idempotencyKey?: string;
  expectedState?: unknown;
  status: MutationFenceStatus;
  readbackRequired: true;
}

export function mayReplayInBackground(): false {
  return false;
}

export function timeoutAfterPossibleEffect(fence: BackgroundMutationFence): BackgroundMutationFence {
  return { ...fence, status:'UNKNOWN_OUTCOME', readbackRequired:true };
}
