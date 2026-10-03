export type MobileLibreChatState =
  | 'INTERACTIVE'
  | 'STALE_READONLY'
  | 'OFFLINE_READONLY'
  | 'UNAVAILABLE';

export interface MobileSignals {
  networkReachable?: boolean;
  backendReachable: boolean;
  snapshotAvailable?: boolean;
  snapshotFresh: boolean;
}

export function mobileLibreChatState(s: MobileSignals): MobileLibreChatState {
  const networkReachable = s.networkReachable ?? true;
  const snapshotAvailable = s.snapshotAvailable ?? s.snapshotFresh;

  if (!networkReachable) {
    return snapshotAvailable ? 'OFFLINE_READONLY' : 'UNAVAILABLE';
  }

  if (!s.backendReachable) return 'UNAVAILABLE';
  if (!s.snapshotFresh) return 'STALE_READONLY';
  return 'INTERACTIVE';
}

// Desktop and mobile are surfaces over the same LibreChat backend/history.
// A remote target run may continue even while LibreChat itself is unavailable.
