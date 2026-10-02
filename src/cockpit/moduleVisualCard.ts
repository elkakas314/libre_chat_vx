export type ModuleSystemScope =
  | 'LIBRECHAT'
  | 'VX13'
  | 'MANOJOS3'
  | 'ORACULO_ADVISORY';

export interface ModuleVisualCard {
  moduleRef: string;
  domainKind: 'CORE'|'ADVISOR'|'DOMAINPACK'|'EXTERNAL'|'CLIENT_ADAPTER';
  displayName: string;
  policyAuthorityRef?: string;
  executorRef?: string;
  verifierRef?: string;
  systemScope: ModuleSystemScope;
  sourceLevel: 'MASTER_CURRENT'|'BUZON_CANDIDATE';
  sourceRef: string;
  sourceRevision: string;
  designState: string;
  contractState: string;
  codeState: string;
  installedState: string;
  liveState: string;
  materialState: string;
  observedAt: string;
  capabilitiesAdmitted: string[];
  allowedActions: string[];
}

// UI candidate only; not a frozen wire schema.
// owner/policy/executor/verifier are intentionally split to avoid collapsing authority roles.
