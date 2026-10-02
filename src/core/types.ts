export type Risk = 'R0' | 'R1' | 'R2' | 'R3';
export type TruthStatus =
  | 'VERIFIED'
  | 'STALE'
  | 'NO_VERIFICADO'
  | 'UNKNOWN_OUTCOME'
  | 'RESYNC_REQUIRED';

export interface CurrentFocus {
  systemId: string;
  moduleRef?: string;
  capabilityRef?: string;
  runRef?: string;
  claimRef?: string;
  artifactRef?: string;
  observedRevision?: string;
  pinOrigin: 'AUTO' | 'USER_PIN' | 'USER_OPEN';
}

export interface TargetCapabilityProjection {
  targetId: string;
  capabilityId: string;
  risk: Risk;
  effectClass: 'READ_ONLY' | 'EPHEMERAL' | 'MATERIAL' | 'DESTRUCTIVE';
  availability: string;
  authorityOwner: string;
  sourceRevision: string;
  observedAt: string;
  requiredScopes: string[];
  evidenceRefs: string[];
}

export interface CrossTargetTruthEnvelope {
  targetId: string;
  truthClass: 'SOURCE' | 'LIVE' | 'VERIFIED' | 'EXTERNAL';
  status: TruthStatus;
  observedAt: string;
  observedRevision?: string;
  evidenceRefs: string[];
  receiptRef?: string;
  verificationRef?: string;
  uncertaintyReason?: string;
}

// Types only. They confer no execution authority.
