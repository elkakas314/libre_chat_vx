export interface ModuleVisualCard {
  moduleRef: string;
  domainKind: 'CORE'|'ADVISOR'|'DOMAINPACK'|'EXTERNAL'|'CLIENT_ADAPTER';
  displayName: string;
  ownerAuthority?: string;
  ownerState?: string;
  ownerExecutor?: string;
  systemTarget: string;
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
