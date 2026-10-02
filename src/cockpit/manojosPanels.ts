export type ManojosPanel =
  | 'CONSTRUCTION' | 'BROWSER' | 'TOOLBUS' | 'REPO'
  | 'HOST' | 'THREADS' | 'CONNECTORS' | 'MODEL';

export interface ManojosPanelCapability {
  panel: ManojosPanel;
  registryBacked: boolean;
  aclAllowed: boolean;
  adapterLive: boolean;
}

export function showAction(c: ManojosPanelCapability): boolean {
  return c.registryBacked && c.aclAllowed && c.adapterLive;
}
