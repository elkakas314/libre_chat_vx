import type { ConcreteTargetId, TargetScope } from './systemTarget';
import type { TruthLanes } from './truthLanes';
import type { TentaclePresentationState } from './tentaclePresentation';
import type { CockpitWindow } from './windowRouter';
import type { ProviderHudProjection } from './providerStatusHud';

export interface TentacleHudModel {
  scope: TargetScope;
  focusedTarget?: ConcreteTargetId;
  presentation: TentaclePresentationState;
  focusLabel: string;
  windows: CockpitWindow[];
  evidenceFresh: boolean;
  inference?: ProviderHudProjection;
  authority: false;
}

export function deriveTentaclePresentation(lanes?: TruthLanes): TentaclePresentationState {
  if (!lanes || lanes.connection === 'UNKNOWN') return 'UNKNOWN';
  if (lanes.connection === 'OFFLINE' || lanes.evidence === 'CONFLICT') return 'BLOCKED';
  if (lanes.work === 'FAILED' || lanes.work === 'UNKNOWN_OUTCOME') return 'ATTENTION';
  if (lanes.work === 'RUNNING' || lanes.work === 'QUEUED' || lanes.work === 'WAITING') return 'WORKING';
  if (lanes.work === 'SUCCEEDED' && lanes.evidence === 'FRESH') return 'DONE';
  if (
    lanes.work === 'SUCCEEDED' ||
    lanes.evidence === 'STALE' ||
    lanes.evidence === 'MISSING'
  ) return 'OBSERVING';
  return 'IDLE';
}

export function moveTentacleHudScope(
  current: TentacleHudModel,
  scope: TargetScope,
): TentacleHudModel {
  return {
    ...current,
    scope,
    focusedTarget: scope === 'VX13' || scope === 'MANOJOS3' ? scope : undefined,
  };
}

/** Compatibility alias: this changes visual/read scope, not target authority. */
export const moveTentacleHud = moveTentacleHudScope;
