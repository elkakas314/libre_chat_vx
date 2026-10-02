export interface ContextReferent {
  ref: string;
  tenantId: string;
  observedAtMs: number;
  ttlMs: number;
  provenance: string[];
}

export function referentFresh(ref: ContextReferent, nowMs: number): boolean {
  return nowMs - ref.observedAtMs <= ref.ttlMs;
}

export function requireDisambiguation(candidates: ContextReferent[]): boolean {
  return candidates.length !== 1;
}

// conversation_id is not an alias for target session/controller IDs.
