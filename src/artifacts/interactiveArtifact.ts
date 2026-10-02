import type { ControlClass } from '../cockpit/controlDeck';
import type { TargetParityTruth } from '../adapters/targetParity';
import type { ConcreteTargetId, TargetScope } from '../cockpit/systemTarget';
import { resolvedMutationTarget } from '../cockpit/systemTarget';

export type InteractiveControlKind =
  | 'BUTTON'
  | 'SLIDER'
  | 'KNOB'
  | 'DECISION_RESPONSE'
  | 'AUTHORIZATION_RESPONSE';

export interface InteractiveArtifactControl {
  id: string;
  kind: InteractiveControlKind;
  label: string;
  class: ControlClass;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
}

export interface ArtifactUiIntent {
  controlId: string;
  scope: TargetScope;
  resolvedTargetId?: ConcreteTargetId;
  previewValue?: number;
  uiEffect: 'READ_ONLY' | 'PREVIEW' | 'PREPARE' | 'PREPARE_MATERIAL_REQUEST';
  directEffect: false;
  canPrepare: boolean;
  canSubmit: boolean;
  authorizationRef?: string;
  capabilityRef?: string;
}

export function artifactPreviewIntent(
  control: InteractiveArtifactControl,
  scope: TargetScope,
  previewValue?: number,
): ArtifactUiIntent {
  return {
    controlId: control.id,
    scope,
    resolvedTargetId: resolvedMutationTarget(scope) ?? undefined,
    previewValue,
    uiEffect: control.class === 'GREEN' ? 'READ_ONLY' : 'PREVIEW',
    directEffect: false,
    canPrepare: true,
    canSubmit: false,
  };
}

export function artifactCommitIntent(
  control: InteractiveArtifactControl,
  scope: TargetScope,
  target?: TargetParityTruth,
  authorizationRef?: string,
  capabilityRef?: string,
): ArtifactUiIntent {
  const resolvedTargetId = resolvedMutationTarget(scope) ?? undefined;

  if (control.class !== 'RED') {
    return {
      controlId: control.id,
      scope,
      resolvedTargetId,
      uiEffect: control.class === 'GREEN' ? 'READ_ONLY' : 'PREPARE',
      directEffect: false,
      canPrepare: true,
      canSubmit: false,
    };
  }

  return {
    controlId: control.id,
    scope,
    resolvedTargetId,
    uiEffect: 'PREPARE_MATERIAL_REQUEST',
    directEffect: false,
    canPrepare: Boolean(resolvedTargetId),
    canSubmit: Boolean(
      resolvedTargetId &&
      target?.governedMutationPathReady &&
      authorizationRef &&
      capabilityRef
    ),
    authorizationRef,
    capabilityRef,
  };
}
