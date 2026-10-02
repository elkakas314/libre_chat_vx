export type UiDegradationState =
  | 'INTERACTIVE_FRESH'
  | 'READONLY_FRESH'
  | 'READONLY_STALE'
  | 'CHAT_ONLY'
  | 'UNAVAILABLE';

export interface UiSignals {
  connected: boolean;
  authenticated: boolean;
  fresh: boolean;
  rendererHealthy: boolean;
  aclAllowsRead: boolean;
  aclAllowsAction: boolean;
}

export function resolveUiDegradation(s: UiSignals): UiDegradationState {
  if (!s.connected) return 'UNAVAILABLE';
  if (!s.authenticated || !s.aclAllowsRead) return 'CHAT_ONLY';
  if (!s.fresh) return 'READONLY_STALE';
  if (!s.rendererHealthy || !s.aclAllowsAction) return 'READONLY_FRESH';
  return 'INTERACTIVE_FRESH';
}
