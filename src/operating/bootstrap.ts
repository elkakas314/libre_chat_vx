import type { OperatingSnapshot } from './types';
import { buildDelta, buildLivingPlan, effectiveGapState } from './reconcile';

export interface BootstrapResult {
  canon: 'LIBRECHAT_OPERATING_CANON';
  target_version: number;
  snapshot_id: string;
  mode: OperatingSnapshot['mode'];
  evidence_cutoff_head: string;
  git: {
    head?: string;
    origin_main?: string;
    clean?: boolean;
    status?: string;
  };
  runtime: Record<string, unknown>;
  proofs: {
    valid: string[];
    stale: string[];
    missing: string[];
    unavailable: string[];
  };
  ownership: {
    owned: string[];
    stale_claims: string[];
    free: string[];
    unobserved: string[];
  };
  delta: {
    pass: string[];
    open: string[];
    stale_proof: string[];
    reconcile_required: string[];
    not_tested: string[];
    owned: string[];
    blocked_dependency: string[];
    external_gates: string[];
    human_gates: string[];
    blocked_live: string[];
  };
  living_plan: {
    eligible: string[];
    blocked_live: string[];
    owned_ready: string[];
    waiting_internal: boolean;
    next_eligible?: string;
  };
  eligible_source_only: string[];
  blocked_live: string[];
  do_not_touch: string[];
  closeout: 'COMPLETE' | 'INCOMPLETE';
  next_action?: string;
}

function proofSummary(snapshot: OperatingSnapshot): BootstrapResult['proofs'] {
  return {
    valid: snapshot.proofs.filter((proof) => proof.state === 'VALID').map((proof) => proof.proofId),
    stale: snapshot.proofs.filter((proof) => proof.state === 'STALE').map((proof) => proof.proofId),
    missing: snapshot.proofs.filter((proof) => proof.state === 'MISSING').map((proof) => proof.proofId),
    unavailable: snapshot.proofs
      .filter((proof) => proof.state === 'UNAVAILABLE')
      .map((proof) => proof.proofId),
  };
}

function ownershipSummary(snapshot: OperatingSnapshot): BootstrapResult['ownership'] {
  return {
    owned: snapshot.ownership
      .filter((record) => record.state === 'OWNED')
      .map((record) => record.scope),
    stale_claims: snapshot.ownership
      .filter((record) => record.state === 'STALE_CLAIM')
      .map((record) => record.scope),
    free: snapshot.ownership
      .filter((record) => record.state === 'FREE')
      .map((record) => record.scope),
    unobserved: snapshot.ownership
      .filter((record) => record.state === 'UNOBSERVED')
      .map((record) => record.scope),
  };
}

export function buildBootstrap(snapshot: OperatingSnapshot): BootstrapResult {
  const delta = buildDelta(snapshot.mode, snapshot.gaps, snapshot.ownership);
  const plan = buildLivingPlan(snapshot.mode, snapshot.gaps, snapshot.ownership);
  const closeout = closeoutCheck(snapshot);

  let nextAction = plan.nextEligible;
  if (!nextAction && plan.waitingInternal) {
    nextAction = 'WAITING_INTERNAL';
  } else if (!nextAction && plan.blockedLive.length > 0) {
    nextAction = 'BIND_LIVE_AND_REVALIDATE';
  }

  return {
    canon: 'LIBRECHAT_OPERATING_CANON',
    target_version: snapshot.targetVersion ?? 1,
    snapshot_id: snapshot.snapshotId,
    mode: snapshot.mode,
    evidence_cutoff_head: snapshot.evidenceCutoffHead,
    git: {
      head: snapshot.git?.head ?? snapshot.evidenceCutoffHead,
      origin_main: snapshot.git?.originMain,
      clean: snapshot.git?.clean,
      status: snapshot.git?.status ?? 'EVIDENCE_CUTOFF_ONLY',
    },
    runtime:
      snapshot.runtime ??
      (snapshot.mode === 'LIVE_BOUND'
        ? { status: 'LIVE_BOUND' }
        : { status: 'NO_VERIFICADO', reason: 'SOURCE_ONLY' }),
    proofs: proofSummary(snapshot),
    ownership: ownershipSummary(snapshot),
    delta: {
      pass: delta.pass,
      open: delta.open,
      stale_proof: delta.staleProof,
      reconcile_required: delta.reconcileRequired,
      not_tested: delta.notTested,
      owned: delta.owned,
      blocked_dependency: delta.blockedDependency,
      external_gates: delta.externalGates,
      human_gates: delta.humanGates,
      blocked_live: delta.blockedLive,
    },
    living_plan: {
      eligible: plan.eligible,
      blocked_live: plan.blockedLive,
      owned_ready: plan.ownedReady,
      waiting_internal: plan.waitingInternal,
      next_eligible: plan.nextEligible,
    },
    eligible_source_only: snapshot.mode === 'SOURCE_ONLY' ? plan.eligible : [],
    blocked_live: plan.blockedLive,
    do_not_touch: snapshot.doNotTouch,
    closeout: closeout.complete ? 'COMPLETE' : 'INCOMPLETE',
    next_action: nextAction,
  };
}

export interface CloseoutCheck {
  complete: boolean;
  internalComplete: boolean;
  openGaps: string[];
  externalGates: string[];
  humanGates: string[];
  staleProofs: string[];
  unavailableProofs: string[];
}

export function closeoutCheck(snapshot: OperatingSnapshot): CloseoutCheck {
  const states = snapshot.gaps.map((gap) => ({
    gapId: gap.gapId,
    state: effectiveGapState(gap, snapshot.gaps, snapshot.ownership),
  }));

  return {
    complete: states.every(({ state }) => state === 'PASS'),
    internalComplete: states.every(
      ({ state }) => state === 'PASS' || state === 'GATE_EXTERNAL' || state === 'GATE_HUMAN',
    ),
    openGaps: states.filter(({ state }) => state !== 'PASS').map(({ gapId }) => gapId),
    externalGates: states
      .filter(({ state }) => state === 'GATE_EXTERNAL')
      .map(({ gapId }) => gapId),
    humanGates: states.filter(({ state }) => state === 'GATE_HUMAN').map(({ gapId }) => gapId),
    staleProofs: snapshot.proofs.filter((proof) => proof.state === 'STALE').map((proof) => proof.proofId),
    unavailableProofs: snapshot.proofs
      .filter((proof) => proof.state === 'UNAVAILABLE')
      .map((proof) => proof.proofId),
  };
}
