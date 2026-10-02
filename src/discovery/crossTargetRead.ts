export interface TargetReadResult<T=unknown> {
  targetId: string;
  status: 'OK' | 'TIMEOUT' | 'OFFLINE' | 'STALE' | 'ERROR';
  value?: T;
  provenance: string[];
}

export interface CrossTargetReadResult<T=unknown> {
  partial: boolean;
  results: TargetReadResult<T>[];
}

export function combineTargetReads<T>(results: TargetReadResult<T>[]): CrossTargetReadResult<T> {
  return { partial: results.some(r=>r.status!=='OK'), results };
}
