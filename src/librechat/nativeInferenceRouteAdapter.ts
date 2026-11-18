import { interpretIntent, type IntentSignals } from '../intent/intentInterpreter';
import {
  bridgeIntentToDecision,
  type NostromoDecisionHints,
} from '../intent/nostromoDecisionBridge';
import {
  NostromoInferenceGateway,
  type InferenceIntentSignals,
  type ProviderAdmission,
  type ProviderRoute,
  type SemanticProfileId,
} from '../llm/inferenceGateway';
import { chooseHybridLane } from '../llm/nostromoHybrid';

export interface NativeModelBinding {
  endpoint: string;
  model: string;
}

export interface NativeInferenceRouteInput {
  /** Signals must be derived by the authenticated native host, never model text. */
  intentSignals: IntentSignals;
  /** Agreed handoff, if any, must be read from authenticated native session state. */
  decisionHints?: NostromoDecisionHints;
  /** Fresh route readbacks only; config candidates do not qualify. */
  routes: readonly ProviderRoute[];
  /** Sanitized native endpoint mapping for each admitted provider route. */
  bindModel: (route: ProviderRoute) => NativeModelBinding | undefined;
  /** Measured input budget plus an explicit completion reserve. */
  estimatedInputTokens: number;
  reservedOutputTokens: number;
  /** True when the current native agent turn has selected tools. */
  toolCallingRequired?: boolean;
  nowMs?: number;
}

export type NativeInferenceRouteResult =
  | {
      kind: 'INFERENCE_ROUTE';
      lane: 'LOCAL_VOICE' | 'REMOTE_INFERENCE';
      profile: SemanticProfileId;
      routeId: string;
      provider: string;
      model: string;
      endpoint: string;
      nativeModel: string;
      requiresGoalAgreement: boolean;
      requiresReadbackBeforeResponse: boolean;
      authority: false;
    }
  | {
      kind: 'NO_ADMITTED_ROUTE';
      lane: 'LOCAL_VOICE' | 'REMOTE_INFERENCE';
      profile: SemanticProfileId;
      admissions: readonly ProviderAdmission[];
      reason:
        | 'INVALID_TOKEN_BUDGET'
        | 'NO_FRESH_ZERO_COST_ROUTE'
        | 'NATIVE_MODEL_BINDING_MISSING'
        | 'TARGET_HANDOFF_UNAVAILABLE';
      requiresGoalAgreement: boolean;
      requiresReadbackBeforeResponse: boolean;
      authority: false;
    }
  | {
      kind: 'GOVERNED_HANDOFF_CANDIDATE';
      targetId: string;
      objectiveRef: string;
      planHash: string;
      sessionRef: string;
      authority: false;
    };

const gateway = new NostromoInferenceGateway();

/**
 * Adapts the existing intent and provider routers to a native LibreChat turn.
 * It selects a model endpoint only after live, fresh, zero-cost admission and
 * context reservation. It never executes a target or authenticates agreement.
 */
export function resolveNativeInferenceRoute(
  input: NativeInferenceRouteInput,
): NativeInferenceRouteResult {
  const intent = interpretIntent(input.intentSignals);
  const decision = bridgeIntentToDecision(intent, input.decisionHints);

  if (decision.requiresMaterialExecution && input.decisionHints?.agreedTaskHandoff) {
    const handoff = input.decisionHints.agreedTaskHandoff;
    return {
      kind: 'GOVERNED_HANDOFF_CANDIDATE',
      targetId: handoff.targetId,
      objectiveRef: handoff.objectiveRef,
      planHash: handoff.planHash,
      sessionRef: handoff.sessionRef,
      authority: false,
    };
  }

  const toolCallingRequired = input.toolCallingRequired === true;
  const inferenceSignals: InferenceIntentSignals = {
    ...decision.inferenceSignals,
    needsResearch: decision.inferenceSignals.needsResearch || toolCallingRequired,
    preferFast: decision.inferenceSignals.preferFast && !toolCallingRequired,
  };
  const turnSignals = {
    ...decision.hybridTurn,
    needsResearch: decision.hybridTurn.needsResearch || toolCallingRequired,
    preferLocalVoice: decision.hybridTurn.preferLocalVoice && !toolCallingRequired,
  };
  const profile = gateway.selectProfile(inferenceSignals);
  const selectedLane = chooseHybridLane(turnSignals);
  if (selectedLane === 'TARGET_OBJECTIVE') {
    const handoff = input.decisionHints?.agreedTaskHandoff;
    if (handoff) {
      return {
        kind: 'GOVERNED_HANDOFF_CANDIDATE',
        targetId: handoff.targetId,
        objectiveRef: handoff.objectiveRef,
        planHash: handoff.planHash,
        sessionRef: handoff.sessionRef,
        authority: false,
      };
    }
    return {
      kind: 'NO_ADMITTED_ROUTE',
      lane: 'REMOTE_INFERENCE',
      profile,
      admissions: [],
      reason: 'TARGET_HANDOFF_UNAVAILABLE',
      requiresGoalAgreement: true,
      requiresReadbackBeforeResponse: decision.requiresReadbackBeforeResponse,
      authority: false,
    };
  }
  const lane = selectedLane;

  const budget = input.estimatedInputTokens + input.reservedOutputTokens;
  if (
    !Number.isSafeInteger(input.estimatedInputTokens) ||
    input.estimatedInputTokens <= 0 ||
    !Number.isSafeInteger(input.reservedOutputTokens) ||
    input.reservedOutputTokens <= 0 ||
    !Number.isSafeInteger(budget)
  ) {
    return {
      kind: 'NO_ADMITTED_ROUTE',
      lane,
      profile,
      admissions: [],
      reason: 'INVALID_TOKEN_BUDGET',
      requiresGoalAgreement: decision.requiresGoalAgreement,
      requiresReadbackBeforeResponse: decision.requiresReadbackBeforeResponse,
      authority: false,
    };
  }

  const locality = lane === 'LOCAL_VOICE' ? 'LOCAL' : 'REMOTE';
  const routes = input.routes.filter((route) => route.locality === locality);
  const resolution = gateway.resolveProviderRoute(
    {
      profile,
      estimatedInputTokens: budget,
      ...(input.nowMs === undefined ? {} : { nowMs: input.nowMs }),
    },
    routes,
  );
  const selected = resolution.selected;
  if (!selected) {
    return {
      kind: 'NO_ADMITTED_ROUTE',
      lane,
      profile,
      admissions: resolution.admissions,
      reason: 'NO_FRESH_ZERO_COST_ROUTE',
      requiresGoalAgreement: decision.requiresGoalAgreement,
      requiresReadbackBeforeResponse: decision.requiresReadbackBeforeResponse,
      authority: false,
    };
  }

  const binding = input.bindModel(selected);
  if (!binding?.endpoint || !binding.model) {
    return {
      kind: 'NO_ADMITTED_ROUTE',
      lane,
      profile,
      admissions: resolution.admissions,
      reason: 'NATIVE_MODEL_BINDING_MISSING',
      requiresGoalAgreement: decision.requiresGoalAgreement,
      requiresReadbackBeforeResponse: decision.requiresReadbackBeforeResponse,
      authority: false,
    };
  }

  return {
    kind: 'INFERENCE_ROUTE',
    lane,
    profile,
    routeId: selected.id,
    provider: selected.provider,
    model: selected.model,
    endpoint: binding.endpoint,
    nativeModel: binding.model,
    requiresGoalAgreement: decision.requiresGoalAgreement,
    requiresReadbackBeforeResponse: decision.requiresReadbackBeforeResponse,
    authority: false,
  };
}
