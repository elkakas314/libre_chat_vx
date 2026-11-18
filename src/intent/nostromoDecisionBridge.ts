/** Pure decision bridge. It makes no network call and never grants material authority.
 * A native LibreChat runtime must explicitly consume this projection.
 */
import type { NostromoIntentDraft } from './intentInterpreter';
import type { InferenceIntentSignals } from '../llm/inferenceGateway';
import type { HybridTurnSignals } from '../llm/nostromoHybrid';

export interface NostromoDecisionHints {
  needsDeepReasoning?: boolean;
  needsLongContext?: boolean;
  needsVision?: boolean;
  /** Only opt in after verifying a suitable local model is available. */
  preferLocalVoice?: boolean;
}

export interface NostromoDecision {
  intent: NostromoIntentDraft;
  inferenceSignals: InferenceIntentSignals;
  hybridTurn: HybridTurnSignals;
  requiresMaterialExecution: boolean;
  requiresReadbackBeforeResponse: boolean;
  authority: false;
}

export function bridgeIntentToDecision(
  intent: NostromoIntentDraft,
  hints: NostromoDecisionHints = {},
): NostromoDecision {
  // An unresolved target must never be routed to a material executor.
  const materialReady = intent.materialRequested &&
    !intent.needsClarification && Boolean(intent.targetHint);
  const needsDeepReasoning = hints.needsDeepReasoning===true;
  const needsLongContext = hints.needsLongContext===true;
  const needsVision = hints.needsVision===true;
  const preferLocalVoice = hints.preferLocalVoice===true &&
    intent.intentClass==='CONVERSATION' &&
    !needsDeepReasoning && !needsLongContext && !needsVision;
  return {
    intent,
    inferenceSignals:{
      needsResearch:intent.needsResearch,
      needsVisualization:intent.needsVisualization,
      needsDeepReasoning,
      needsLongContext,
      needsVision,
      preferFast:intent.intentClass==='CONVERSATION' &&
        !needsDeepReasoning && !needsLongContext && !needsVision,
    },
    hybridTurn:{
      conversationalOnly:intent.intentClass==='CONVERSATION',
      needsDeepReasoning,
      needsResearch:intent.needsResearch,
      needsVisualization:intent.needsVisualization,
      needsLongContext,
      targetActionRequested:materialReady,
      preferLocalVoice,
    },
    requiresMaterialExecution:materialReady,
    requiresReadbackBeforeResponse:materialReady || intent.intentClass==='TARGET_READ',
    authority:false,
  };
}
