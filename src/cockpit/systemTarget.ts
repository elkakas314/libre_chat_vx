export type SystemTarget = 'VX13' | 'MANOJOS3' | 'BOTH' | 'AUTO';

export interface TargetSelection {
  primaryTarget: SystemTarget;
  oneTurnReadOverride?: Exclude<SystemTarget, 'BOTH' | 'AUTO'>;
}

export function effectiveReadTarget(selection: TargetSelection) {
  return selection.oneTurnReadOverride ?? selection.primaryTarget;
}

export function clearOneTurnOverride(selection: TargetSelection): TargetSelection {
  return { primaryTarget: selection.primaryTarget };
}

// A one-turn READ override never mutates primaryTarget or grants authority.
