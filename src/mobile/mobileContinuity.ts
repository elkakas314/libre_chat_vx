export type MobileLibreChatState = 'INTERACTIVE' | 'STALE_READONLY' | 'UNAVAILABLE';

export interface MobileSignals {
  backendReachable: boolean;
  snapshotFresh: boolean;
}

export function mobileLibreChatState(s: MobileSignals): MobileLibreChatState {
  if (!s.backendReachable) return 'UNAVAILABLE';
  if (!s.snapshotFresh) return 'STALE_READONLY';
  return 'INTERACTIVE';
}

// A remote target run may continue even while LibreChat backend is unavailable.
