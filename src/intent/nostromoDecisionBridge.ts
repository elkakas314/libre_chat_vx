/** Pure decision bridge. It makes no network call and never grants material authority.
 * A native LibreChat runtime must explicitly consume this projection.
 */
import type { NostromoIntentDraft } from './intentInterpreter';
import type { ConcreteTargetId } from '../cockpit/systemTarget';
import type { InferenceIntentSignals } from '../llm/inferenceGateway';
import type { HybridTurnSignals } from '../llm/nostromoHybrid';
import { isObjectiveHandoff, type ObjectiveHandoff } from '../contracts/objectiveHandoff';
import { exposeTool, type ToolProjection } from '../cockpit/targetToolGate';

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

/** Host-supplied interfaces: the model/contract cannot implement these authority checks. */
export interface ObjectiveHandoffHost {
  /** Verify the authenticated principal/session, full agreed plan and version,
   * and host-derived idempotency binding; a model-supplied claim is insufficient. */
  verifyAgreement(handoff: ObjectiveHandoff): Promise<boolean>;
  /** Fetch owner-controlled LIVE discovery and ACL data, never SOURCE inventory. */
  readCapabilities(handoff: ObjectiveHandoff): Promise<{
    observedAtMs: number;
    entries: readonly (ToolProjection & { capabilityRef: string })[];
  }>;
  checkOwnerAuthority(handoff: ObjectiveHandoff, tool: ToolProjection): Promise<boolean>;
}

/**
 * Admit only a fully validated, host-verified agreement and fresh owner reads.
 * This is a preflight result, not a grant or dispatch: callers must recheck the
 * owner's authority at execution time, bind arguments and reconcile outcomes.
 */
export async function resolveAgreedObjective(
  input: unknown,
  host: ObjectiveHandoffHost,
  nowMs?: number,
): Promise<{ ok: true; handoff: ObjectiveHandoff; tools: readonly ToolProjection[]; authority: false } |
  { ok: false; reason: string; authority: false }> {
  const denied = (reason: string) => ({ ok: false as const, reason, authority: false as const });
  let snapshot: unknown;
  try { snapshot = structuredClone(input); } catch { return denied('INVALID_HANDOFF'); }
  if (!isObjectiveHandoff(snapshot) || snapshot.status !== 'AGREED') return denied('INVALID_HANDOFF');
  const freeze = (value: unknown): void => {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
  };
  freeze(snapshot);
  const handoff = snapshot;
  if (nowMs !== undefined && !Number.isFinite(nowMs)) return denied('INVALID_CLOCK');
  try {
    if (!await host.verifyAgreement(handoff)) return denied('AGREEMENT_UNVERIFIED');
    const projection = await host.readCapabilities(handoff);
    const checkedAtMs = nowMs ?? Date.now();
    if (!Number.isFinite(projection.observedAtMs) || projection.observedAtMs > checkedAtMs || checkedAtMs - projection.observedAtMs > 60_000) return denied('CAPABILITIES_STALE');
    const tools: ToolProjection[] = [];
    for (const ref of handoff.capability_refs) {
      const candidates = projection.entries.filter((entry) => entry.capabilityRef === ref && entry.targetId === handoff.target_id);
      if (candidates.length !== 1) return denied(candidates.length ? 'CAPABILITY_AMBIGUOUS' : 'CAPABILITY_UNRESOLVED');
      const tool = Object.freeze({ ...candidates[0] });
      if (!tool.toolId || !tool.sourceRevision || tool.availability !== 'LIVE' || !tool.adapterLive || !exposeTool(tool)) return denied('CAPABILITY_UNAVAILABLE');
      if (tool.risk !== handoff.risk) return denied('RISK_MISMATCH');
      if (!await host.checkOwnerAuthority(handoff, tool)) return denied('AUTHORITY_DENIED');
      tools.push(tool);
    }
    return { ok: true, handoff, tools, authority: false };
  } catch {
    return denied('HOST_READ_FAILED');
  }
}
