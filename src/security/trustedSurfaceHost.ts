export interface TrustedSurfacePolicy {
  allowedOrigins: ReadonlySet<string>;
  allowedActions: ReadonlySet<string>;
  allowEval: false;
  allowRemoteDynamicModules: false;
  allowWildcardPostMessage: false;
}

export interface VisualActionCandidate {
  origin: string;
  action: string;
  schemaValid: boolean;
  provenanceValid: boolean;
}

export function acceptVisualAction(
  policy: TrustedSurfacePolicy,
  candidate: VisualActionCandidate,
): boolean {
  return policy.allowedOrigins.has(candidate.origin)
    && policy.allowedActions.has(candidate.action)
    && candidate.schemaValid
    && candidate.provenanceValid;
}

// Artifacts/iframes/remote DOM never call material adapters directly.
