export type SourceTruth = 'SOURCE_ONLY' | 'LIVE' | 'STALE' | 'UNKNOWN';

export interface StatusRailState {
  connection: string;
  freshness: string;
  readiness: string;
  sourceTruth: SourceTruth;
  observedProfile?: string;
  decisionInboxVisible: true;
}

// StatusRail never derives run/material completion from these fields.
