export interface ArtifactRef {
  artifactId: string;
  version: string;
  contentHash: string;
  provenance: string[];
  retentionClass: string;
  requiredScopes: string[];
}

export function canResolveArtifact(
  ref: ArtifactRef,
  grantedScopes: ReadonlySet<string>,
): boolean {
  return ref.requiredScopes.every(scope => grantedScopes.has(scope));
}

// Visible metadata never implies download permission.
