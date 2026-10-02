export interface ReadDiscoveryResult {
  authenticated: boolean;
  health: string;
  readiness: string;
  sourceRevision?: string;
  liveRevision?: string;
  capabilities: string[];
  skills: string[];
  compatibility: 'COMPATIBLE' | 'DEGRADED' | 'INCOMPATIBLE';
}

export function sourceMatchesLive(r: ReadDiscoveryResult): boolean {
  return !!r.sourceRevision && r.sourceRevision === r.liveRevision;
}

export function shouldBulkLoadSchemas(): false { return false; }
