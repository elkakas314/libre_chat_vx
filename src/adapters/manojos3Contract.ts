export const MANOJOS3_FLOW = [
  'LIBRECHAT',
  'MCP_OR_CONTROL_PLANE',
  'GOVERNOR',
  'POLICY_AUTH',
  'KERNEL',
  'ADAPTER',
  'VERIFIER_RECEIPT',
  'RECEIPT_PROJECTION',
] as const;

export interface Manojos3BindingTruth {
  configured: boolean;
  bindingReady: boolean;
  callableProbePassed: boolean;
  sourceRevision?: string;
  liveRevision?: string;
}

// AUTH_REQUIRED is target-owned and cannot be satisfied by transport/UI alone.
