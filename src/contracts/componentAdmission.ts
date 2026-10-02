export interface ComponentAdmissionCandidate {
  componentRef: string;
  sourceRef: string;
  sourceRevision: string;
  capabilityManifestRef?: string;
  riskClass: string;
  authority: false;
}

export type ComponentAdmissionState = 'CANDIDATE' | 'ADMITTED' | 'REJECTED' | 'DEFERRED';

// LibreChat may project admission state but never grants it.
