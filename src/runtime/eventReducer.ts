import type { CockpitState, TargetRuntimeState } from './cockpitState';
import type { DecisionCard } from '../cockpit/decisionInbox';
import type { DockItem } from '../cockpit/artifactDock';
import type { ModuleVisualCard } from '../cockpit/moduleVisualCard';
import type { CurrentFocus } from '../cockpit/currentFocus';

export type CockpitEvent =
  | { eventId: string; cursor: string; revision: string; kind: 'TARGET_STATE'; value: TargetRuntimeState }
  | { eventId: string; cursor: string; revision: string; kind: 'FOCUS'; value: CurrentFocus }
  | { eventId: string; cursor: string; revision: string; kind: 'DECISION_UPSERT'; value: DecisionCard }
  | { eventId: string; cursor: string; revision: string; kind: 'ARTIFACT_UPSERT'; value: DockItem }
  | { eventId: string; cursor: string; revision: string; kind: 'MODULE_UPSERT'; value: ModuleVisualCard }
  | { eventId: string; cursor: string; revision: string; kind: 'ALERT'; value: string };

function upsert<T>(items: T[], next: T, key: (item: T) => string): T[] {
  const nextKey = key(next);
  const found = items.findIndex((item) => key(item) === nextKey);
  if (found < 0) return [...items, next];
  const copy = [...items];
  copy[found] = next;
  return copy;
}

export class CockpitReducer {
  #seen = new Set<string>();

  apply(state: CockpitState, event: CockpitEvent): CockpitState {
    if (this.#seen.has(event.eventId)) return state;
    this.#seen.add(event.eventId);

    if (state.revision !== '0' && event.revision !== state.revision) {
      return {
        ...state,
        cursor: event.cursor,
        revision: event.revision,
        alerts: [...state.alerts, 'RESYNC_REQUIRED'],
      };
    }

    const base = { ...state, cursor: event.cursor, revision: event.revision };
    switch (event.kind) {
      case 'TARGET_STATE':
        return { ...base, targets: { ...state.targets, [event.value.targetId]: event.value } };
      case 'FOCUS':
        return { ...base, focus: event.value };
      case 'DECISION_UPSERT':
        return { ...base, decisions: upsert(state.decisions, event.value, (x) => x.decisionRef) };
      case 'ARTIFACT_UPSERT':
        return { ...base, artifacts: upsert(state.artifacts, event.value, (x) => x.ref) };
      case 'MODULE_UPSERT':
        return { ...base, modules: upsert(state.modules, event.value, (x) => x.moduleRef) };
      case 'ALERT':
        return { ...base, alerts: [...state.alerts, event.value] };
    }
  }
}
