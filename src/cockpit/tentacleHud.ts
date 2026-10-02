import type { SystemTarget } from './systemTarget';
import type { TruthLanes } from './truthLanes';
import type { TentaclePresentationState } from './tentaclePresentation';
import type { CockpitWindow } from './windowRouter';

export interface TentacleHudModel {
  target: SystemTarget;
  presentation: TentaclePresentationState;
  focusLabel: string;
  windows: CockpitWindow[];
  evidenceFresh: boolean;
  authority: false;
}

export function deriveTentaclePresentation(lanes?: TruthLanes): TentaclePresentationState {
  if (!lanes) return 'UNKNOWN';
  if (lanes.connection === 'OFFLINE' || lanes.evidence === 'CONFLICT') return 'BLOCKED';
  if (lanes.work === 'FAILED' || lanes.work === 'UNKNOWN_OUTCOME') return 'ATTENTION';
  if (lanes.work === 'RUNNING' || lanes.work === 'QUEUED' || lanes.work === 'WAITING') return 'WORKING';
  if (lanes.work === 'SUCCEEDED' && lanes.evidence === 'FRESH') return 'DONE';
  if (lanes.evidence === 'STALE' || lanes.evidence === 'MISSING') return 'OBSERVING';
  return 'IDLE';
}

export function moveTentacleHud(
  current: TentacleHudModel,
  target: SystemTarget,
): TentacleHudModel {
  return { ...current, target };
}
