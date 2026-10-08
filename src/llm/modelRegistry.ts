import type {
  ProviderCapability,
  ProviderHealth,
  ProviderQuotaState,
  SemanticProfileId,
  ZeroCostState,
} from './inferenceGateway';

export interface ModelCandidate {
  candidateId: string;
  provider: string;
  model: string;
  profiles: readonly SemanticProfileId[];
  capabilities: readonly ProviderCapability[];
  health: ProviderHealth;
  quotaState: ProviderQuotaState;
  zeroCost: ZeroCostState;
  privacyAllowed: boolean;
  observedAtMs?: number;
  latencyMs?: number;
  contextWindowTokens?: number;
  quotaRemainingRatio?: number;
  evidenceRefs: readonly string[];
}

export interface ModelCandidateAdmission {
  candidateId: string;
  admitted: boolean;
  reasons: readonly string[];
}

export interface ModelPoolPlan {
  profile: SemanticProfileId;
  active: readonly ModelCandidate[];
  reserve: readonly ModelCandidate[];
  rejected: readonly ModelCandidateAdmission[];
  activeTarget: number;
  authority: false;
}

export interface ModelPoolOptions {
  activeTarget?: number;
  nowMs?: number;
  maxFreshnessMs?: number;
}

export function admitModelCandidate(
  candidate: ModelCandidate,
  profile: SemanticProfileId,
  options: ModelPoolOptions = {},
): ModelCandidateAdmission {
  const reasons:string[]=[];
  if (!candidate.profiles.includes(profile)) reasons.push('PROFILE_UNSUPPORTED');
  if (candidate.health !== 'READY') reasons.push('HEALTH_'+candidate.health);
  if (candidate.quotaState !== 'AVAILABLE') reasons.push('QUOTA_'+candidate.quotaState);
  if (candidate.zeroCost !== 'VERIFIED_ZERO_COST') reasons.push('ZERO_COST_'+candidate.zeroCost);
  if (!candidate.privacyAllowed) reasons.push('PRIVACY_POLICY_REJECTED');
  if (!candidate.evidenceRefs.length) reasons.push('EVIDENCE_REQUIRED');

  const now=options.nowMs ?? Date.now();
  const maxFreshness=options.maxFreshnessMs ?? 300_000;
  if (candidate.observedAtMs === undefined || !Number.isFinite(candidate.observedAtMs)) {
    reasons.push('READBACK_TIMESTAMP_REQUIRED');
  } else if (candidate.observedAtMs > now) {
    reasons.push('READBACK_FROM_FUTURE');
  } else if (!Number.isFinite(maxFreshness) || maxFreshness < 0 || now - candidate.observedAtMs > maxFreshness) {
    reasons.push('READBACK_STALE');
  }

  return { candidateId:candidate.candidateId, admitted:reasons.length===0, reasons };
}

function score(candidate:ModelCandidate):number {
  const quota=(candidate.quotaRemainingRatio ?? 0.5)*1000;
  const latencyPenalty=candidate.latencyMs ?? 5000;
  return quota-latencyPenalty/10;
}

export function planModelPool(
  profile: SemanticProfileId,
  candidates: readonly ModelCandidate[],
  options: ModelPoolOptions = {},
): ModelPoolPlan {
  const activeTarget=Math.max(1,options.activeTarget ?? 6);
  const admissions=candidates.map((candidate)=>admitModelCandidate(candidate,profile,options));
  const admitted=candidates
    .filter((candidate)=>admissions.find((a)=>a.candidateId===candidate.candidateId)?.admitted)
    .sort((a,b)=>score(b)-score(a));

  return {
    profile,
    active:admitted.slice(0,activeTarget),
    reserve:admitted.slice(activeTarget),
    rejected:admissions.filter((a)=>!a.admitted),
    activeTarget,
    authority:false,
  };
}
