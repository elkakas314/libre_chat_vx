import type { ControlClass } from '../cockpit/controlDeck';
import type { TargetParityTruth } from '../adapters/targetParity';

export type InteractiveControlKind =
  | 'BUTTON'
  | 'SLIDER'
  | 'KNOB'
  | 'DECISION'
  | 'AUTHORIZATION';

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
  targetId: string;
  previewValue?: number;
  uiEffect: 'READ_ONLY' | 'PREVIEW' | 'PREPARE' | 'PREPARE_MATERIAL_REQUEST';
  directEffect: false;
  canPrepare: boolean;
  authorityRef?: string;
}

export function artifactPreviewIntent(
  control: InteractiveArtifactControl,
  target: TargetParityTruth,
  previewValue?: number,
): ArtifactUiIntent {
  if (control.class === 'GREEN') {
    return {
      controlId: control.id,
      targetId: target.source.targetId,
      previewValue,
      uiEffect: 'READ_ONLY',
      directEffect: false,
      canPrepare: true,
    };
  }

  return {
    controlId: control.id,
    targetId: target.source.targetId,
    previewValue,
    uiEffect: 'PREVIEW',
    directEffect: false,
    canPrepare: true,
  };
}

export function artifactCommitIntent(
  control: InteractiveArtifactControl,
  target: TargetParityTruth,
  authorityRef?: string,
): ArtifactUiIntent {
  if (control.class !== 'RED') {
    return {
      controlId: control.id,
      targetId: target.source.targetId,
      uiEffect: control.class === 'GREEN' ? 'READ_ONLY' : 'PREPARE',
      directEffect: false,
      canPrepare: true,
    };
  }

  return {
    controlId: control.id,
    targetId: target.source.targetId,
    uiEffect: 'PREPARE_MATERIAL_REQUEST',
    directEffect: false,
    canPrepare: target.materialReady && Boolean(authorityRef),
    authorityRef,
  };
}
