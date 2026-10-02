import React from 'react';
import type { TargetParityTruth } from '../adapters/targetParity';

export function MinimalTruthView({ targets }: { targets: TargetParityTruth[] }) {
  return (
    <section aria-label="Minimal truth" data-testid="vx-minimal-truth">
      <h2>Verdad mínima</h2>
      <ul>
        {targets.map((target) => (
          <li key={target.descriptor.targetId}>
            <strong>{target.descriptor.targetId}</strong>
            <span> binding:{target.integration.bindingState}</span>
            <span> connection:{target.observation?.connection ?? 'UNKNOWN'}</span>
            <span> readiness:{target.observation?.readiness ?? 'UNKNOWN'}</span>
            <span> source/live:{target.sourceAlignment}</span>
            <span> readPath:{String(target.governedReadPathReady)}</span>
            <span> mutationPath:{String(target.governedMutationPathReady)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
