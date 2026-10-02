import React from 'react';
import type { TargetParityTruth } from '../adapters/targetParity';

export interface TargetParityViewProps {
  targets: TargetParityTruth[];
}

export function TargetParityView({ targets }: TargetParityViewProps) {
  return (
    <section aria-label="Target parity" data-testid="vx-target-parity">
      <h2>Target parity</h2>
      <ul>
        {targets.map((target) => (
          <li key={target.source.targetId}>
            <strong>{target.source.targetId}</strong>
            <span> source:{target.source.sourceMaturity}</span>
            <span> binding:{target.source.bindingState}</span>
            <span> runtime:{target.source.runtimeState}</span>
            <span> authority:{target.source.authorityOwner}</span>
            <span> materialReady:{String(target.materialReady)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
