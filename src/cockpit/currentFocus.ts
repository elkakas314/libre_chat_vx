export type FocusSystemId =
  | 'LIBRECHAT'
  | 'VX13'
  | 'MANOJOS3'
  | 'CROSS_TARGET'
  | 'ORACULO_ADVISORY';

export interface CurrentFocus {
  systemId: FocusSystemId;
  moduleRef?: string;
  capabilityRef?: string;
  runRef?: string;
  claimRef?: string;
  artifactRef?: string;
  observedRevision?: string;
  pinOrigin: 'AUTO' | 'USER_PIN' | 'USER_OPEN';
}

export type FocusResolution =
  | { status: 'RESOLVED'; focus: CurrentFocus }
  | { status: 'NEEDS_INPUT'; candidates: CurrentFocus[] };

export function resolveFocus(candidates: CurrentFocus[]): FocusResolution {
  if (candidates.length === 1) return { status: 'RESOLVED', focus: candidates[0] };
  return { status: 'NEEDS_INPUT', candidates };
}

export function participantsForFocus(focus: CurrentFocus): string[] {
  return [focus.systemId, focus.moduleRef, focus.capabilityRef, focus.runRef].filter(Boolean) as string[];
}
