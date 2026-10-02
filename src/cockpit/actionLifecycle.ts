import type { ConcreteTargetId, TargetScope } from './systemTarget';

export type ActionLifecycle =
  | 'DECISION_REQUIRED'
  | 'QUEUED'
  | 'RUNNING'
  | 'RECEIPT_OBSERVED'
  | 'VERIFIED'
  | 'FAILED'
  | 'UNKNOWN_OUTCOME';

export interface UiActionIntent {
  actionId: string;
  targetScope: TargetScope;
  resolvedTargetId?: ConcreteTargetId;
  capabilityRef?: string;
  intent: string;
  previewOnly: boolean;
  authorizationRef?: string;
}

export function clickMeansDone(): false { return false; }

/**
 * A UI intent never has a direct material effect by itself.
 * Preview and commit are both projections until a target-owned governed path accepts them.
 */
export function uiActionHasDirectMaterialEffect(_action: UiActionIntent): false {
  return false;
}

/** @deprecated UI preview never directly mutates a target. */
export function previewHasMaterialEffect(_action: UiActionIntent): false {
  return false;
}
