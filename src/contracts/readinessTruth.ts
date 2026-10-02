export interface LibreChatReadinessTruth {
  configured: boolean;
  channelEnabled: boolean;
  bindingReady: boolean;
  callableProbePassed: boolean;
  providerAvailable: boolean;
  observedAt: string;
  error?: string;
}

export function providerBindingReady(r: LibreChatReadinessTruth): boolean {
  return r.configured &&
    r.channelEnabled &&
    r.bindingReady &&
    r.callableProbePassed &&
    r.providerAvailable;
}

/** @deprecated This checks provider/binding readiness, not material completion. */
export const materiallyReady = providerBindingReady;
