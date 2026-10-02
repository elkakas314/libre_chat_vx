export type CompatibilityState = 'COMPATIBLE' | 'DEGRADED' | 'INCOMPATIBLE' | 'NO_VERIFICADO';

export interface AdapterCompatibilityReport {
  upstreamCommit: string;
  configVersion?: string;
  authSurface: string[];
  cspHooks: string[];
  artifactHooks: string[];
  voiceHooks: string[];
  mcpHooks: string[];
  storageHooks: string[];
  pwaHooks: string[];
  mobileHooks: string[];
  patches: string[];
  testsObserved: string[];
  state: CompatibilityState;
}

export interface CompatibilityCanaryResult {
  featureFlag: string;
  smokePassed: boolean;
  rollbackToBaseChatAvailable: boolean;
  materialRollbackAttempted: false;
}
