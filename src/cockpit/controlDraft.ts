export type DraftBlockReason = 'STALE_DRAFT' | 'ACL_REVOKED' | 'TARGET_CHANGED';

export interface ControlDraft {
  draftId: string;
  targetId: string;
  observedRevision: string;
  createdAt: string;
  preview: unknown;
}

export function validateDraftForApply(
  draft: ControlDraft,
  current: { targetId: string; observedRevision: string; aclAllowsAction: boolean },
): { ok: true } | { ok: false; reason: DraftBlockReason } {
  if (!current.aclAllowsAction) return { ok:false, reason:'ACL_REVOKED' };
  if (draft.targetId !== current.targetId) return { ok:false, reason:'TARGET_CHANGED' };
  if (draft.observedRevision !== current.observedRevision) return { ok:false, reason:'STALE_DRAFT' };
  return { ok:true };
}

// Preview is display-only. Reload/crash must never auto-apply a draft.
