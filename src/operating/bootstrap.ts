import type { OperatingSnapshot } from './types';
import { eligibleGaps } from './reconcile';

export interface BootstrapResult {
  canon: 'LIBRECHAT_OPERATING_CANON';
  snapshotId: string;
  mode: OperatingSnapshot['mode'];
  evidenceCutoffHead: string;
  eligible: string[];
  doNotTouch: string[];
  closeout: 'COMPLETE' | 'INCOMPLETE';
  nextAction?: string;
}

export function buildBootstrap(snapshot: OperatingSnapshot): BootstrapResult {
  const eligible = eligibleGaps(snapshot.mode, snapshot.gaps, snapshot.ownership);

  return {
    canon: 'LIBRECHAT_OPERATING_CANON',
    snapshotId: snapshot.snapshotId,
    mode: snapshot.mode,
    evidenceCutoffHead: snapshot.evidenceCutoffHead,
    eligible: eligible.map((gap) => gap.gapId),
    doNotTouch: snapshot.doNotTouch,
    closeout: snapshot.gaps.every((gap) => gap.state === 'PASS' || gap.state === 'GATE_EXTERNAL')
      ? 'COMPLETE'
      : 'INCOMPLETE',
    nextAction: eligible[0]?.gapId,
  };
}

export interface CloseoutCheck {
  complete: boolean;
  openGaps: string[];
  staleProofs: string[];
  unavailableProofs: string[];
}

export function closeoutCheck(snapshot: OperatingSnapshot): CloseoutCheck {
  return {
    complete: snapshot.gaps.every((gap) => gap.state === 'PASS' || gap.state === 'GATE_EXTERNAL'),
    openGaps: snapshot.gaps
      .filter((gap) => gap.state !== 'PASS' && gap.state !== 'GATE_EXTERNAL')
      .map((gap) => gap.gapId),
    staleProofs: snapshot.proofs.filter((proof) => proof.state === 'STALE').map((proof) => proof.proofId),
    unavailableProofs: snapshot.proofs
      .filter((proof) => proof.state === 'UNAVAILABLE')
      .map((proof) => proof.proofId),
  };
}
