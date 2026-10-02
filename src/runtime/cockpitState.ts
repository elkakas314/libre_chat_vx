import type { TruthLanes } from '../cockpit/truthLanes';
import type { CurrentFocus } from '../cockpit/currentFocus';
import type { DecisionCard } from '../cockpit/decisionInbox';
import type { DockItem } from '../cockpit/artifactDock';
import type { ModuleVisualCard } from '../cockpit/moduleVisualCard';

export interface TargetRuntimeState {
  targetId: string;
  lanes: TruthLanes;
  observedRevision?: string;
  observedAt?: string;
}

export interface CockpitState {
  revision: string;
  cursor: string;
  focus?: CurrentFocus;
  targets: Record<string, TargetRuntimeState>;
  decisions: DecisionCard[];
  artifacts: DockItem[];
  modules: ModuleVisualCard[];
  followedRunRefs: string[];
  alerts: string[];
}

export function emptyCockpitState(): CockpitState {
  return {
    revision: '0',
    cursor: '0',
    targets: {},
    decisions: [],
    artifacts: [],
    modules: [],
    followedRunRefs: [],
    alerts: [],
  };
}
