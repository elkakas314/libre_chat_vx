export type ResumableUiStreamClass =
  | 'CONVERSATION_GENERATION'
  | 'TOOL_UI'
  | 'APPROVAL_UI'
  | 'SUBAGENT_ACTIVITY';

export type NonReplayableMaterialClass =
  | 'TARGET_MUTATION_REQUEST'
  | 'TARGET_SIDE_EFFECT'
  | 'TARGET_AUTHORIZATION';

export function mayResumeUiStream(_kind: ResumableUiStreamClass): true {
  return true;
}

export function mayReplayTargetMaterialEffect(
  _kind: NonReplayableMaterialClass,
): false {
  return false;
}

export function reconnectRequiresTargetReadback(possibleMaterialEffect: boolean): boolean {
  return possibleMaterialEffect;
}
