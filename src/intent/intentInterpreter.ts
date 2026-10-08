import type { ConcreteTargetId, TargetScope } from '../cockpit/systemTarget';
import { isConcreteTarget } from '../cockpit/systemTarget';

export type NostromoIntentClass =
  | 'CONVERSATION'
  | 'RESEARCH'
  | 'VISUALIZE'
  | 'EXPLAIN'
  | 'TARGET_READ'
  | 'TARGET_COMMAND'
  | 'CLARIFY';

export interface IntentSignals {
  wantsExternalChange?: boolean;
  wantsSystemRead?: boolean;
  wantsResearch?: boolean;
  wantsVisualization?: boolean;
  wantsExplanation?: boolean;
  ambiguousReferent?: boolean;
  explicitTarget?: ConcreteTargetId;
  currentScope?: TargetScope;
}

export interface NostromoIntentDraft {
  intentClass: NostromoIntentClass;
  targetHint?: ConcreteTargetId;
  targetScope?: TargetScope;
  needsResearch: boolean;
  needsVisualization: boolean;
  needsClarification: boolean;
  materialRequested: boolean;
  authority: false;
}

export function interpretIntent(signals: IntentSignals): NostromoIntentDraft {
  if (signals.ambiguousReferent) {
    return {
      intentClass:'CLARIFY',
      targetHint:signals.explicitTarget,
      targetScope:signals.currentScope,
      needsResearch:false,
      needsVisualization:false,
      needsClarification:true,
      materialRequested:false,
      authority:false,
    };
  }
  if (signals.wantsExternalChange) {
    // AUTO/BOTH are read/view scopes. A material intent needs one concrete target.
    const concreteTarget = signals.explicitTarget ??
      (signals.currentScope && isConcreteTarget(signals.currentScope) ? signals.currentScope : undefined);
    return {
      intentClass:'TARGET_COMMAND',
      targetHint:concreteTarget,
      targetScope:signals.currentScope,
      needsResearch:Boolean(signals.wantsResearch),
      needsVisualization:Boolean(signals.wantsVisualization),
      needsClarification:!concreteTarget,
      materialRequested:true,
      authority:false,
    };
  }
  if (signals.wantsSystemRead) {
    return {
      intentClass:'TARGET_READ',
      targetHint:signals.explicitTarget,
      targetScope:signals.currentScope,
      needsResearch:false,
      needsVisualization:Boolean(signals.wantsVisualization),
      needsClarification:false,
      materialRequested:false,
      authority:false,
    };
  }
  if (signals.wantsResearch) {
    return {
      intentClass:'RESEARCH',
      targetScope:signals.currentScope,
      needsResearch:true,
      needsVisualization:Boolean(signals.wantsVisualization),
      needsClarification:false,
      materialRequested:false,
      authority:false,
    };
  }
  if (signals.wantsVisualization) {
    return {
      intentClass:'VISUALIZE',
      targetScope:signals.currentScope,
      needsResearch:false,
      needsVisualization:true,
      needsClarification:false,
      materialRequested:false,
      authority:false,
    };
  }
  if (signals.wantsExplanation) {
    return {
      intentClass:'EXPLAIN',
      targetScope:signals.currentScope,
      needsResearch:false,
      needsVisualization:false,
      needsClarification:false,
      materialRequested:false,
      authority:false,
    };
  }
  return {
    intentClass:'CONVERSATION',
    targetScope:signals.currentScope,
    needsResearch:false,
    needsVisualization:false,
    needsClarification:false,
    materialRequested:false,
    authority:false,
  };
}
