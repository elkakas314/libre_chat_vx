export type TentaclePresentationState =
  | 'IDLE' | 'OBSERVING' | 'WORKING' | 'ATTENTION'
  | 'BLOCKED' | 'DONE' | 'UNKNOWN';

export interface TentaclePresentation {
  state: TentaclePresentationState;
  authority: false;
  materialProof: false;
}
