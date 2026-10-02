export type ConnectionState = 'UNKNOWN' | 'CONNECTED' | 'DEGRADED' | 'OFFLINE';
export type ReadinessState = 'READY' | 'NOT_READY' | 'UNCONFIGURED' | 'UNKNOWN';
export type WorkState =
  | 'IDLE'
  | 'QUEUED'
  | 'RUNNING'
  | 'WAITING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'UNKNOWN_OUTCOME';
export type EvidenceState = 'NOT_APPLICABLE' | 'FRESH' | 'STALE' | 'MISSING' | 'CONFLICT';

export interface TruthLanes {
  connection: ConnectionState;
  readiness: ReadinessState;
  work: WorkState;
  evidence: EvidenceState;
}

// No derived overall state:
// connection != readiness != work != evidence.
// SUCCEEDED is not MATERIAL_VERIFIED unless the relevant readback, verification and receipt exist.
