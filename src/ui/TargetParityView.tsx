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
          <li key={target.descriptor.targetId}>
            <strong>{target.descriptor.targetId}</strong>
            <span> source:{target.descriptor.sourceMaturity}</span>
            <span> adapter:{target.integration.adapterImplementation}</span>
            <span> binding:{target.integration.bindingState}</span>
            <span> connection:{target.observation?.connection ?? 'UNKNOWN'}</span>
            <span> readiness:{target.observation?.readiness ?? 'UNKNOWN'}</span>
            <span> sourceAlignment:{target.sourceAlignment}</span>
            <span> readPath:{String(target.governedReadPathReady)}</span>
            <span> mutationPath:{String(target.governedMutationPathReady)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
