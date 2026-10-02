export interface LibreChatReadinessTruth {
  configured: boolean;
  channelEnabled: boolean;
  bindingReady: boolean;
  callableProbePassed: boolean;
  providerAvailable: boolean;
  observedAt: string;
  error?: string;
}

export function materiallyReady(r: LibreChatReadinessTruth): boolean {
  return r.configured && r.channelEnabled && r.bindingReady && r.callableProbePassed && r.providerAvailable;
}
