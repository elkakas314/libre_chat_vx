export type OperatingMode = 'SOURCE_ONLY' | 'LIVE_BOUND';

export type GapState =
  | 'PASS'
  | 'OPEN'
  | 'STALE_PROOF'
  | 'OWNED'
  | 'WAITING_INTERNAL'
  | 'RECONCILE_REQUIRED'
  | 'GATE_EXTERNAL'
  | 'GATE_HUMAN'
  | 'BLOCKED_DEPENDENCY'
  | 'NOT_TESTED';

export interface OperatingGap {
  gapId: string;
  summary: string;
  state: GapState;
  priority: number;
  scope: string;
  requiresLive: boolean;
  dependencies: string[];
  preferredRoute?: string;
  ownerRef?: string;
  evidenceRefs?: string[];
}

export type ProofState = 'VALID' | 'STALE' | 'MISSING' | 'UNAVAILABLE';
export type ProofClass =
  | 'SOURCE_READBACK'
  | 'TEST'
  | 'DRIVE_READBACK'
  | 'RUNTIME_READBACK'
  | 'MATERIAL';

export interface OperatingProof {
  proofId: string;
  subject: string;
  proofClass: ProofClass;
  state: ProofState;
  dependencyFingerprint: string;
  dependencies: string[];
  evidenceRefs: string[];
}

export type OwnershipState = 'UNOBSERVED' | 'FREE' | 'OWNED' | 'STALE_CLAIM';

export interface OwnershipRecord {
  scope: string;
  state: OwnershipState;
  ownerRef?: string;
  claimRef?: string;
  observedAt?: string;
}

export interface OperatingGitObservation {
  head?: string;
  originMain?: string;
  clean?: boolean;
  status?: string;
}

export interface OperatingDelta {
  pass: string[];
  open: string[];
  staleProof: string[];
  reconcileRequired: string[];
  notTested: string[];
  owned: string[];
  blockedDependency: string[];
  externalGates: string[];
  humanGates: string[];
  blockedLive: string[];
}

export interface LivingPlan {
  eligible: string[];
  blockedLive: string[];
  ownedReady: string[];
  waitingInternal: boolean;
  nextEligible?: string;
}

export interface OperatingSnapshot {
  snapshotId: string;
  mode: OperatingMode;
  evidenceCutoffHead: string;
  targetVersion?: number;
  git?: OperatingGitObservation;
  runtime?: Record<string, unknown>;
  gaps: OperatingGap[];
  proofs: OperatingProof[];
  ownership: OwnershipRecord[];
  doNotTouch: string[];
}
