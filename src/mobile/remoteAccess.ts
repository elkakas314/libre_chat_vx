export type RemoteAccessMode =
  | 'LOCAL'
  | 'TAILSCALE_PRIVATE'
  | 'CLOUDFLARE_ACCESS_PUBLIC'
  | 'UNAVAILABLE';

export interface RemoteAccessSignals {
  localBackendReachable: boolean;
  tailnetAuthorized: boolean;
  tailscaleServeReachable: boolean;
  publicEdgeEnabled: boolean;
  cloudflareAccessAuthenticated: boolean;
  publicEdgeReachable: boolean;
}

export interface RemoteAccessDecision {
  mode: RemoteAccessMode;
  requiresFreshSession: boolean;
  materialReplayAllowed: false;
  reason: string;
}

export function chooseRemoteAccess(signals: RemoteAccessSignals): RemoteAccessDecision {
  if (signals.localBackendReachable) {
    return {
      mode:'LOCAL',
      requiresFreshSession:false,
      materialReplayAllowed:false,
      reason:'LOCAL_BACKEND_REACHABLE',
    };
  }

  if (signals.tailnetAuthorized && signals.tailscaleServeReachable) {
    return {
      mode:'TAILSCALE_PRIVATE',
      requiresFreshSession:true,
      materialReplayAllowed:false,
      reason:'PRIVATE_TAILNET_PATH',
    };
  }

  if (
    signals.publicEdgeEnabled &&
    signals.cloudflareAccessAuthenticated &&
    signals.publicEdgeReachable
  ) {
    return {
      mode:'CLOUDFLARE_ACCESS_PUBLIC',
      requiresFreshSession:true,
      materialReplayAllowed:false,
      reason:'PUBLIC_EDGE_BEHIND_ACCESS',
    };
  }

  return {
    mode:'UNAVAILABLE',
    requiresFreshSession:true,
    materialReplayAllowed:false,
    reason:'NO_AUTHORIZED_ROUTE',
  };
}

export function publicRouteBypassesIdentityGate(signals: RemoteAccessSignals): boolean {
  return signals.publicEdgeReachable && !signals.cloudflareAccessAuthenticated;
}
