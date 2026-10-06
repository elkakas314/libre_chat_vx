export interface AdapterCompatibilityInput {
  expectedUpstreamCommit: string;
  observedUpstreamCommit: string;
  expectedBlobs: Readonly<Record<string, string>>;
  observedBlobs: Readonly<Record<string, string | undefined>>;
  upstreamClean: boolean;
  overlayManifestPresent: boolean;
}

export interface AdapterCompatibilityReport {
  status: 'PASS' | 'FAIL';
  upstreamAligned: boolean;
  blobAlignment: 'ALIGNED' | 'DRIFT';
  upstreamClean: boolean;
  overlayManifestPresent: boolean;
  blockers: string[];
  authority: false;
}

export function assessAdapterCompatibility(
  input: AdapterCompatibilityInput,
): AdapterCompatibilityReport {
  const blockers: string[] = [];
  const upstreamAligned = input.expectedUpstreamCommit === input.observedUpstreamCommit;
  if (!upstreamAligned) blockers.push('UPSTREAM_COMMIT_MISMATCH');
  if (!input.upstreamClean) blockers.push('UPSTREAM_NOT_CLEAN');
  if (!input.overlayManifestPresent) blockers.push('OVERLAY_MANIFEST_MISSING');

  let blobAlignment: AdapterCompatibilityReport['blobAlignment'] = 'ALIGNED';
  for (const [path, expected] of Object.entries(input.expectedBlobs)) {
    if (input.observedBlobs[path] !== expected) {
      blobAlignment = 'DRIFT';
      blockers.push(`UPSTREAM_BLOB_MISMATCH:${path}`);
    }
  }

  return {
    status: blockers.length === 0 ? 'PASS' : 'FAIL',
    upstreamAligned,
    blobAlignment,
    upstreamClean: input.upstreamClean,
    overlayManifestPresent: input.overlayManifestPresent,
    blockers,
    authority: false,
  };
}
