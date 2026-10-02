export type CoreError =
  | 'POLICY_DENIED' | 'AUTH_REQUIRED' | 'INVALID_CONTRACT'
  | 'CAPABILITY_UNAVAILABLE' | 'MODEL_UNAVAILABLE' | 'PROVIDER_UNAVAILABLE'
  | 'STALE' | 'RESYNC_REQUIRED' | 'RATE_LIMITED' | 'RESOURCE_EXHAUSTED'
  | 'READ_TIMEOUT' | 'MATERIAL_TIMEOUT' | 'CONFLICT'
  | 'EXECUTION_FAILED' | 'PARTIAL' | 'UNKNOWN';

export interface ErrorPresentation {
  severity: 'INFO' | 'WARNING' | 'BLOCKING';
  action: 'NONE' | 'REFRESH' | 'REAUTH' | 'RESYNC' | 'READBACK' | 'REVIEW';
  allowAutomaticMaterialRetry: false;
}

export function mapCoreError(error: CoreError): ErrorPresentation {
  if (error === 'AUTH_REQUIRED') return { severity:'BLOCKING', action:'REAUTH', allowAutomaticMaterialRetry:false };
  if (error === 'STALE' || error === 'RESYNC_REQUIRED') return { severity:'WARNING', action:'RESYNC', allowAutomaticMaterialRetry:false };
  if (error === 'MATERIAL_TIMEOUT') return { severity:'BLOCKING', action:'READBACK', allowAutomaticMaterialRetry:false };
  if (error === 'READ_TIMEOUT') return { severity:'WARNING', action:'REFRESH', allowAutomaticMaterialRetry:false };
  return { severity:'WARNING', action:'REVIEW', allowAutomaticMaterialRetry:false };
}
