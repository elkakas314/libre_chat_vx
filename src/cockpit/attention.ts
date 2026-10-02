export type AttentionClass =
  | 'INFO'
  | 'OBSERVED_RUNNING'
  | 'DECISION_PENDING'
  | 'CRITICAL'
  | 'ACL_REVOKED'
  | 'SECURITY'
  | 'EXPIRED'
  | 'UNKNOWN_OUTCOME';

const NON_COALESCIBLE = new Set<AttentionClass>([
  'DECISION_PENDING','CRITICAL','ACL_REVOKED','SECURITY','EXPIRED','UNKNOWN_OUTCOME'
]);

export function canCoalesceAttention(kind: AttentionClass): boolean {
  return !NON_COALESCIBLE.has(kind);
}
