export interface EgressDecision {
  allowed: boolean;
  reason: string;
}

export function allowFocusDrivenEgress(): EgressDecision {
  return { allowed:false, reason:'FOCUS_OR_VISUALIZATION_IS_NOT_EGRESS_AUTHORITY' };
}

export function shouldPrefetchRedactedSensitiveContent(): false { return false; }

export function externalContentCanGrantAuthority(): false { return false; }
