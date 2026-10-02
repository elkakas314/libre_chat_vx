import type { TargetParityTruth } from '../adapters/targetParity';
import type { ConcreteTargetId, TargetScope } from './systemTarget';
import { resolvedMutationTarget } from './systemTarget';

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

export type ControlBlocker =
  | 'CONCRETE_TARGET_REQUIRED'
  | 'GOVERNED_MUTATION_PATH_NOT_READY'
  | 'CAPABILITY_REQUIRED'
  | 'TARGET_AUTHORIZATION_REQUIRED';

export interface ControlIntent {
  controlId: ControlId;
  scope: TargetScope;
  resolvedTargetId?: ConcreteTargetId;
  class: ControlClass;
  uiEffect: 'READ_ONLY' | 'PREPARE' | 'PREPARE_MATERIAL_REQUEST';
  canPrepare: boolean;
  canSubmit: boolean;
  blockers: ControlBlocker[];
  directEffect: false;
  capabilityRef?: string;
  authorizationRef?: string;
}

export function controlIntent(
  spec: ControlSpec,
  scope: TargetScope,
  target?: TargetParityTruth,
  authorizationRef?: string,
  capabilityRef?: string,
): ControlIntent {
  const resolvedTargetId = resolvedMutationTarget(scope) ?? undefined;

  if (spec.class === 'GREEN') {
    return {
      controlId: spec.id,
      scope,
      resolvedTargetId,
      class: spec.class,
      uiEffect: 'READ_ONLY',
      canPrepare: true,
      canSubmit: false,
      blockers: [],
      directEffect: false,
    };
  }

  if (spec.class === 'YELLOW') {
    return {
      controlId: spec.id,
      scope,
      resolvedTargetId,
      class: spec.class,
      uiEffect: 'PREPARE',
      canPrepare: true,
      canSubmit: false,
      blockers: [],
      directEffect: false,
    };
  }

  const blockers: ControlBlocker[] = [];
  if (!resolvedTargetId) blockers.push('CONCRETE_TARGET_REQUIRED');
  if (!target?.governedMutationPathReady) blockers.push('GOVERNED_MUTATION_PATH_NOT_READY');
  if (!capabilityRef) blockers.push('CAPABILITY_REQUIRED');
  if (!authorizationRef) blockers.push('TARGET_AUTHORIZATION_REQUIRED');

  return {
    controlId: spec.id,
    scope,
    resolvedTargetId,
    class: spec.class,
    uiEffect: 'PREPARE_MATERIAL_REQUEST',
    canPrepare: Boolean(resolvedTargetId),
    canSubmit: blockers.length === 0,
    blockers,
    directEffect: false,
    capabilityRef,
    authorizationRef,
  };
}
