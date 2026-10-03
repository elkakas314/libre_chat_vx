export interface OfflineTextDraft {
  draftId: string;
  conversationId: string;
  text: string;
  createdAt: string;
  targetAction: false;
}

export type OfflineQueueItem = OfflineTextDraft;

export function canQueueOfflineTargetAction(): false {
  return false;
}

export function reconnectDraftNeedsRevalidation(): true {
  return true;
}

// Offline storage may keep a minimal user text draft.
// It must never contain a queued authorization, UiAction or material target mutation.
