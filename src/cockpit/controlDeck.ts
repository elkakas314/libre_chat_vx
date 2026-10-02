import type { TargetParityTruth } from '../adapters/targetParity';

export type ControlClass = 'GREEN' | 'YELLOW' | 'RED';

export type ControlId =
  | 'EXPLAIN'
  | 'REFRESH_PULSE'
  | 'OPEN_EVIDENCE'
  | 'COPY_CONTEXT'
  | 'READ_LAST_GAP'
  | 'PREPARE_PROPOSAL'
  | 'PREPARE_READONLY_AUDIT'
  | 'PREPARE_QUARANTINE'
  | 'PREPARE_EVOLUTION'
  | 'EXECUTE'
  | 'DELETE'
  | 'MOVE'
  | 'APPLY_PATCH'
  | 'RESTART_MODULE';

export interface ControlSpec {
  id: ControlId;
  class: ControlClass;
  directEffect: false;
}

export const CONTROL_SPECS: readonly ControlSpec[] = [
  { id: 'EXPLAIN', class: 'GREEN', directEffect: false },
  { id: 'REFRESH_PULSE', class: 'GREEN', directEffect: false },
  { id: 'OPEN_EVIDENCE', class: 'GREEN', directEffect: false },
  { id: 'COPY_CONTEXT', class: 'GREEN', directEffect: false },
  { id: 'READ_LAST_GAP', class: 'GREEN', directEffect: false },
  { id: 'PREPARE_PROPOSAL', class: 'YELLOW', directEffect: false },
  { id: 'PREPARE_READONLY_AUDIT', class: 'YELLOW', directEffect: false },
  { id: 'PREPARE_QUARANTINE', class: 'YELLOW', directEffect: false },
  { id: 'PREPARE_EVOLUTION', class: 'YELLOW', directEffect: false },
  { id: 'EXECUTE', class: 'RED', directEffect: false },
  { id: 'DELETE', class: 'RED', directEffect: false },
  { id: 'MOVE', class: 'RED', directEffect: false },
  { id: 'APPLY_PATCH', class: 'RED', directEffect: false },
  { id: 'RESTART_MODULE', class: 'RED', directEffect: false },
];

export interface ControlIntent {
  controlId: ControlId;
  targetId: string;
  class: ControlClass;
  uiEffect: 'READ_ONLY' | 'PREPARE' | 'PREPARE_MATERIAL_REQUEST';
  canPrepare: boolean;
  directEffect: false;
  authorityRef?: string;
}

export function controlIntent(
  spec: ControlSpec,
  target: TargetParityTruth,
  authorityRef?: string,
): ControlIntent {
  if (spec.class === 'GREEN') {
    return {
      controlId: spec.id,
      targetId: target.source.targetId,
      class: spec.class,
      uiEffect: 'READ_ONLY',
      canPrepare: true,
      directEffect: false,
    };
  }

  if (spec.class === 'YELLOW') {
    return {
      controlId: spec.id,
      targetId: target.source.targetId,
      class: spec.class,
      uiEffect: 'PREPARE',
      canPrepare: true,
      directEffect: false,
    };
  }

  return {
    controlId: spec.id,
    targetId: target.source.targetId,
    class: spec.class,
    uiEffect: 'PREPARE_MATERIAL_REQUEST',
    canPrepare: target.materialReady && Boolean(authorityRef),
    directEffect: false,
    authorityRef,
  };
}
