import type { ConcreteTargetId } from '../cockpit/systemTarget';

export type ClientSurface = 'DESKTOP_WEB' | 'MOBILE_WEB';

export type ResumeAction =
  | 'NOOP'
  | 'RESUME_ACTIVE_STREAM'
  | 'FETCH_STATUS_THEN_RESUME'
  | 'SNAPSHOT_RESYNC'
  | 'FRESH_LOAD'
  | 'OFFLINE_READONLY';

export interface ConversationContinuity {
  conversationId: string;
  surface: ClientSurface;
  networkReachable: boolean;
  backendReachable: boolean;
  authenticated: boolean;
  localSnapshotAvailable: boolean;
  snapshotFresh: boolean;
  knownActiveStreamId?: string;
  resumeProtocolAvailable: boolean;
}

export interface ResumePlan {
  action: ResumeAction;
  conversationId: string;
  mayReplayTargetMutation: false;
  requiresFreshAcl: boolean;
  requiresFreshTargetReadback: boolean;
  reason: string;
}

export function planConversationResume(
  state: ConversationContinuity,
  possibleTargetEffect = false,
): ResumePlan {
  if (!state.networkReachable) {
    return {
      action:state.localSnapshotAvailable ? 'OFFLINE_READONLY' : 'FRESH_LOAD',
      conversationId:state.conversationId,
      mayReplayTargetMutation:false,
      requiresFreshAcl:true,
      requiresFreshTargetReadback:possibleTargetEffect,
      reason:state.localSnapshotAvailable
        ? 'NETWORK_OFFLINE_LOCAL_SNAPSHOT_ONLY'
        : 'NETWORK_OFFLINE_NO_SNAPSHOT',
    };
  }

  if (!state.backendReachable || !state.authenticated) {
    return {
      action:'FRESH_LOAD',
      conversationId:state.conversationId,
      mayReplayTargetMutation:false,
      requiresFreshAcl:true,
      requiresFreshTargetReadback:possibleTargetEffect,
      reason:!state.backendReachable ? 'LIBRECHAT_BACKEND_UNAVAILABLE' : 'AUTHENTICATION_REQUIRED',
    };
  }

  if (state.knownActiveStreamId && state.resumeProtocolAvailable) {
    return {
      action:'RESUME_ACTIVE_STREAM',
      conversationId:state.conversationId,
      mayReplayTargetMutation:false,
      requiresFreshAcl:true,
      requiresFreshTargetReadback:possibleTargetEffect,
      reason:'KNOWN_ACTIVE_STREAM',
    };
  }

  if (state.resumeProtocolAvailable && !state.snapshotFresh) {
    return {
      action:'FETCH_STATUS_THEN_RESUME',
      conversationId:state.conversationId,
      mayReplayTargetMutation:false,
      requiresFreshAcl:true,
      requiresFreshTargetReadback:possibleTargetEffect,
      reason:'STATUS_MAY_REVEAL_ACTIVE_GENERATION',
    };
  }

  if (!state.snapshotFresh) {
    return {
      action:'SNAPSHOT_RESYNC',
      conversationId:state.conversationId,
      mayReplayTargetMutation:false,
      requiresFreshAcl:true,
      requiresFreshTargetReadback:possibleTargetEffect,
      reason:'STALE_SNAPSHOT',
    };
  }

  return {
    action:'NOOP',
    conversationId:state.conversationId,
    mayReplayTargetMutation:false,
    requiresFreshAcl:false,
    requiresFreshTargetReadback:possibleTargetEffect,
    reason:'ALREADY_FRESH',
  };
}

export interface DeviceHandoff {
  conversationId: string;
  from: ClientSurface;
  to: ClientSurface;
  sameBackendHistory: true;
  copyLocalExecutionState: false;
  targetMutationReplay: false;
}

export function handoffConversation(
  conversationId: string,
  from: ClientSurface,
  to: ClientSurface,
): DeviceHandoff {
  return {
    conversationId,
    from,
    to,
    sameBackendHistory:true,
    copyLocalExecutionState:false,
    targetMutationReplay:false,
  };
}

export interface PossibleTargetEffectRecovery {
  targetId: ConcreteTargetId;
  operationId: string;
  state: 'UNKNOWN_OUTCOME';
  retryAllowed: false;
  readbackRequired: true;
}

export function fencePossibleTargetEffect(
  targetId: ConcreteTargetId,
  operationId: string,
): PossibleTargetEffectRecovery {
  return {
    targetId,
    operationId,
    state:'UNKNOWN_OUTCOME',
    retryAllowed:false,
    readbackRequired:true,
  };
}
