import type { ConcreteTargetId } from '../cockpit/systemTarget';

export type NativeApprovalDecision = 'approve' | 'reject' | 'edit' | 'respond';
export type NativeApprovalSubmitState = 'idle' | 'submitting' | 'submitted' | 'expired' | 'error';

export interface NativeToolApprovalProjection {
  actionId: string;
  toolCallId: string;
  allowedDecisions: readonly NativeApprovalDecision[];
  selectedDecision?: NativeApprovalDecision;
  submitState: NativeApprovalSubmitState;
}

export interface TargetAuthorizationChallenge {
  targetId: ConcreteTargetId;
  capabilityRef: string;
  challengeRef: string;
  authorizationAuthorityRef: string;
}

export interface TargetAuthorizationResponseIntent {
  targetId: ConcreteTargetId;
  capabilityRef: string;
  challengeRef: string;
  authorizationAuthorityRef: string;
  nativeActionId: string;
  nativeToolCallId: string;
  decision: NativeApprovalDecision;
  directEffect: false;
  authority: false;
}

export function nativeToolApprovalGrantsTargetAuthorization(): false {
  return false;
}

export function projectTargetAuthorizationResponse(
  approval: NativeToolApprovalProjection,
  challenge: TargetAuthorizationChallenge,
): TargetAuthorizationResponseIntent | null {
  if (!approval.selectedDecision) return null;
  if (!approval.allowedDecisions.includes(approval.selectedDecision)) return null;
  if (approval.submitState === 'expired' || approval.submitState === 'error') return null;

  return {
    targetId:challenge.targetId,
    capabilityRef:challenge.capabilityRef,
    challengeRef:challenge.challengeRef,
    authorizationAuthorityRef:challenge.authorizationAuthorityRef,
    nativeActionId:approval.actionId,
    nativeToolCallId:approval.toolCallId,
    decision:approval.selectedDecision,
    directEffect:false,
    authority:false,
  };
}
