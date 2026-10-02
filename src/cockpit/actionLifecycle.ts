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
  targetId: string;
  intent: string;
  previewOnly: boolean;
  authorityRef?: string;
}

export function clickMeansDone(): false { return false; }
export function previewHasMaterialEffect(action: UiActionIntent): boolean { return !action.previewOnly; }
