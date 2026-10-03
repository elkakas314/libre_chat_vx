import type {
  GapState,
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

export function eligibleGaps(
  mode: OperatingMode,
  gaps: OperatingGap[],
  ownership: OwnershipRecord[],
): OperatingGap[] {
  return gaps
    .filter((gap) => ACTIONABLE.has(gap.state))
    .filter((gap) => mode === 'LIVE_BOUND' || !gap.requiresLive)
    .filter((gap) => dependenciesSatisfied(gap, gaps))
    .filter((gap) => !scopeOwned(gap.scope, ownership))
    .sort((a, b) => a.priority - b.priority);
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
