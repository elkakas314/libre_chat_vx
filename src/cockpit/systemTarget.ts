export type ConcreteTargetId = 'VX13' | 'MANOJOS3';
export type TargetScope = ConcreteTargetId | 'BOTH' | 'AUTO';

/** @deprecated Use TargetScope. */
export type SystemTarget = TargetScope;

export interface TargetSelection {
  primaryScope: TargetScope;
  oneTurnReadOverride?: ConcreteTargetId;
}

export function isConcreteTarget(scope: TargetScope): scope is ConcreteTargetId {
  return scope === 'VX13' || scope === 'MANOJOS3';
}

export function effectiveReadScope(selection: TargetSelection): TargetScope {
  return selection.oneTurnReadOverride ?? selection.primaryScope;
}

/** Compatibility name: returns a read scope, not necessarily a concrete target. */
export const effectiveReadTarget = effectiveReadScope;

export function resolvedMutationTarget(scope: TargetScope): ConcreteTargetId | null {
  return isConcreteTarget(scope) ? scope : null;
}

export function clearOneTurnOverride(selection: TargetSelection): TargetSelection {
  return { primaryScope: selection.primaryScope };
}

// BOTH/AUTO are view/read scopes. They are never material mutation targets.
// A one-turn read override never mutates primaryScope and never grants authority.
