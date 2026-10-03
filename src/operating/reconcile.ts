import type {
  GapState,
  LivingPlan,
  OperatingDelta,
  OperatingGap,
  OperatingMode,
  OperatingProof,
  OwnershipRecord,
} from './types';

const ACTIONABLE = new Set<GapState>([
  'OPEN',
  'STALE_PROOF',
  'RECONCILE_REQUIRED',
  'NOT_TESTED',
]);

export function dependenciesSatisfied(
  gap: OperatingGap,
  gaps: OperatingGap[],
): boolean {
  const byId = new Map(gaps.map((candidate) => [candidate.gapId, candidate]));
  return gap.dependencies.every((id) => byId.get(id)?.state === 'PASS');
}

export function scopeOwned(
  scope: string,
  ownership: OwnershipRecord[],
): boolean {
  return ownership.some((record) => record.scope === scope && record.state === 'OWNED');
}

export function effectiveGapState(
  gap: OperatingGap,
  gaps: OperatingGap[],
  ownership: OwnershipRecord[],
): GapState {
  if (gap.state === 'PASS' || gap.state === 'GATE_EXTERNAL' || gap.state === 'GATE_HUMAN') {
    return gap.state;
  }

  if (!dependenciesSatisfied(gap, gaps)) {
    return 'BLOCKED_DEPENDENCY';
  }

  if (scopeOwned(gap.scope, ownership)) {
    return 'OWNED';
  }

  if (
    gap.state === 'BLOCKED_DEPENDENCY' ||
    gap.state === 'OWNED' ||
    gap.state === 'WAITING_INTERNAL'
  ) {
    return 'OPEN';
  }

  return gap.state;
}

export function eligibleGaps(
  mode: OperatingMode,
  gaps: OperatingGap[],
  ownership: OwnershipRecord[],
): OperatingGap[] {
  return gaps
    .filter((gap) => ACTIONABLE.has(effectiveGapState(gap, gaps, ownership)))
    .filter((gap) => mode === 'LIVE_BOUND' || !gap.requiresLive)
    .sort((a, b) => a.priority - b.priority);
}

export function buildDelta(
  mode: OperatingMode,
  gaps: OperatingGap[],
  ownership: OwnershipRecord[],
): OperatingDelta {
  const delta: OperatingDelta = {
    pass: [],
    open: [],
    staleProof: [],
    reconcileRequired: [],
    notTested: [],
    owned: [],
    blockedDependency: [],
    externalGates: [],
    humanGates: [],
    blockedLive: [],
  };

  for (const gap of gaps) {
    const state = effectiveGapState(gap, gaps, ownership);

    if (mode === 'SOURCE_ONLY' && gap.requiresLive && ACTIONABLE.has(state)) {
      delta.blockedLive.push(gap.gapId);
    }

    switch (state) {
      case 'PASS':
        delta.pass.push(gap.gapId);
        break;
      case 'OPEN':
        delta.open.push(gap.gapId);
        break;
      case 'STALE_PROOF':
        delta.staleProof.push(gap.gapId);
        break;
      case 'RECONCILE_REQUIRED':
        delta.reconcileRequired.push(gap.gapId);
        break;
      case 'NOT_TESTED':
        delta.notTested.push(gap.gapId);
        break;
      case 'OWNED':
        delta.owned.push(gap.gapId);
        break;
      case 'BLOCKED_DEPENDENCY':
      case 'WAITING_INTERNAL':
        delta.blockedDependency.push(gap.gapId);
        break;
      case 'GATE_EXTERNAL':
        delta.externalGates.push(gap.gapId);
        break;
      case 'GATE_HUMAN':
        delta.humanGates.push(gap.gapId);
        break;
    }
  }

  return delta;
}

export function buildLivingPlan(
  mode: OperatingMode,
  gaps: OperatingGap[],
  ownership: OwnershipRecord[],
): LivingPlan {
  const eligible = eligibleGaps(mode, gaps, ownership);

  const dependencyReady = gaps
    .filter((gap) => dependenciesSatisfied(gap, gaps))
    .filter((gap) => mode === 'LIVE_BOUND' || !gap.requiresLive)
    .filter((gap) => {
      const state = gap.state;
      return ACTIONABLE.has(state) || state === 'OWNED' || state === 'WAITING_INTERNAL';
    });

  const ownedReady = dependencyReady
    .filter((gap) => scopeOwned(gap.scope, ownership))
    .map((gap) => gap.gapId);

  const blockedLive = mode === 'SOURCE_ONLY'
    ? gaps
        .filter((gap) => gap.requiresLive)
        .filter((gap) => ACTIONABLE.has(effectiveGapState(gap, gaps, ownership)))
        .map((gap) => gap.gapId)
    : [];

  return {
    eligible: eligible.map((gap) => gap.gapId),
    blockedLive,
    ownedReady,
    waitingInternal:
      eligible.length === 0 &&
      dependencyReady.length > 0 &&
      ownedReady.length === dependencyReady.length,
    nextEligible: eligible[0]?.gapId,
  };
}

export function proofNeedsRevalidation(
  proof: OperatingProof,
  currentDependencyFingerprint: string,
): boolean {
  if (proof.state !== 'VALID') return true;
  return proof.dependencyFingerprint !== currentDependencyFingerprint;
}

export function staleDoesNotMeanBroken(): true {
  return true;
}
