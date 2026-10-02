export interface ClientCompactionPolicy {
  enabled: boolean;
  localOnly: true;
  preservesDecisionRefs: true;
  preservesEvidenceRefs: true;
  grantsAuthority: false;
}

export function mayCompact(policy: ClientCompactionPolicy, hasPendingDecision: boolean): boolean {
  return policy.enabled && !hasPendingDecision;
}
