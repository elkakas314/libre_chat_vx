import React from 'react';
import type { TargetScope } from '../cockpit/systemTarget';

export function TargetScopeNavigator({
  scope,
  onChange,
}: {
  scope: TargetScope;
  onChange?: (scope: TargetScope) => void;
}) {
  const scopes: TargetScope[] = ['AUTO', 'MANOJOS3', 'VX13', 'BOTH'];
  return (
    <nav aria-label="Target view scope" data-testid="vx-target-navigator">
      {scopes.map((candidate) => (
        <button
          key={candidate}
          type="button"
          aria-pressed={scope === candidate}
          onClick={() => onChange?.(candidate)}
        >
          {candidate}
        </button>
      ))}
    </nav>
  );
}

/** Compatibility export. Semantically this selects view/read scope, not authority. */
export const TargetNavigator = TargetScopeNavigator;
