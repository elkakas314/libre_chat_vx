export interface Manojos3HudReadModel {
  connection: 'UNKNOWN' | 'OFFLINE' | 'ONLINE';
  readiness: 'UNKNOWN' | 'BLOCKED' | 'READY';
  activeDomain?: string;
  activeIntent?: string;
  runId?: string;
  work: 'IDLE' | 'QUEUED' | 'RUNNING' | 'WAITING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN_OUTCOME';
  authorization: 'NONE' | 'REQUIRED' | 'SATISFIED' | 'UNKNOWN';
  evidence: 'MISSING' | 'STALE' | 'FRESH' | 'CONFLICT';
  receiptRef?: string;
}

export const TENTACLE_HUD_M3_SOURCES = {
  connectionAndReadiness:['manojos_status'],
  discovery:['manojos_capabilities','manojos_skills'],
  semanticProjection:['MANOJOS3_INTERFLOW_DOMAINS'],
  work:['manojos_run'],
  authorization:['manojos_authorization_requirement','manojos_authorization'],
  evidence:['manojos_receipt','target readback'],
} as const;

export function hudCanOperateWithoutLocalVoice(readModelAvailable: boolean): boolean {
  return readModelAvailable;
}

export function hudCanOperateWithoutFreeReasoner(readModelAvailable: boolean): boolean {
  return readModelAvailable;
}

// HUD state is derived from structured readback, not from model prose.
