import React from 'react';
import type { SystemTarget } from '../cockpit/systemTarget';

export function TargetNavigator({
  target,
  onChange,
}: {
  target: SystemTarget;
  onChange?: (target: SystemTarget) => void;
}) {
  const targets: SystemTarget[] = ['AUTO', 'MANOJOS3', 'VX13', 'BOTH'];
  return (
    <nav aria-label="System target" data-testid="vx-target-navigator">
      {targets.map((candidate) => (
        <button
          key={candidate}
          type="button"
          aria-pressed={target === candidate}
          onClick={() => onChange?.(candidate)}
        >
          {candidate}
        </button>
      ))}
    </nav>
  );
}
