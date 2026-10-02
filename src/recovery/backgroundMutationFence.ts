export type MutationFenceStatus =
  | 'PREPARED' | 'SUBMITTED' | 'UNKNOWN_OUTCOME'
  | 'RECONCILING' | 'VERIFIED' | 'FAILED' | 'CANCELLED';

export interface BackgroundMutationFence {
  operationId: string;
  targetId: string;
  effectScope: string;
  authorityRef?: string;
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
