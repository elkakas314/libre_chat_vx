/** Pure decision bridge. It makes no network call and never grants material authority.
 * A native LibreChat runtime must explicitly consume this projection.
 */
import type { NostromoIntentDraft } from './intentInterpreter';
import type { ConcreteTargetId } from '../cockpit/systemTarget';
import type { InferenceIntentSignals } from '../llm/inferenceGateway';
import type { HybridTurnSignals } from '../llm/nostromoHybrid';

/** Projection of a user-agreed goal read back by the authenticated LibreChat host.
 * This structure is NOT a material grant. Never populate it with model-authored text.
 */
export interface NativeAgreedTaskHandoff {
  source: 'HOST_AUTHENTICATED_USER_AGREEMENT';
  targetId: ConcreteTargetId;
  objectiveRef: string;
  planHash: string;
  sessionRef: string;
}

export interface NostromoDecisionHints {
  /** Must originate in native authenticated session state, not chat/tool output. */
  agreedTaskHandoff?: NativeAgreedTaskHandoff;
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
  requiresGoalAgreement: boolean;
  requiresReadbackBeforeResponse: boolean;
  authority: false;
}

export function bridgeIntentToDecision(
  intent: NostromoIntentDraft,
  hints: NostromoDecisionHints = {},
): NostromoDecision {
  // Intent + target are NOT enough: stay conversational until an agreed
  // objective has a native host readback. This pure bridge cannot authenticate
  // sessionRef nor mint target authorization; the target owner still governs R2.
  const handoff = hints.agreedTaskHandoff;
  const materialReady = intent.materialRequested &&
    !intent.needsClarification && Boolean(intent.targetHint) &&
    handoff?.source === 'HOST_AUTHENTICATED_USER_AGREEMENT' &&
    handoff.targetId === intent.targetHint &&
    typeof handoff.objectiveRef === 'string' && handoff.objectiveRef.trim().length > 0 &&
    typeof handoff.sessionRef === 'string' && handoff.sessionRef.trim().length > 0 &&
    typeof handoff.planHash === 'string' && /^[0-9a-f]{64}$/i.test(handoff.planHash);
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
      needsVision,
      targetActionRequested:materialReady,
      preferLocalVoice,
    },
    requiresMaterialExecution:materialReady,
    requiresGoalAgreement:intent.materialRequested && !materialReady,
    requiresReadbackBeforeResponse:materialReady || intent.intentClass==='TARGET_READ',
    authority:false,
  };
}
