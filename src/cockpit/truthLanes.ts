export type ConnectionState = 'CONNECTED' | 'DEGRADED' | 'OFFLINE';
export type ReadinessState = 'READY' | 'NOT_READY' | 'UNCONFIGURED' | 'UNKNOWN';
export type WorkState = 'IDLE' | 'QUEUED' | 'RUNNING' | 'WAITING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN_OUTCOME';
export type EvidenceState = 'FRESH' | 'STALE' | 'MISSING' | 'CONFLICT';

export interface TruthLanes {
  connection: ConnectionState;
  readiness: ReadinessState;
  work: WorkState;
  evidence: EvidenceState;
}

// Deliberately no derived "overall" status: lanes must remain independently observable.
