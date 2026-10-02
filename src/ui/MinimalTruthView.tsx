import React from 'react';
import type { TargetParityTruth } from '../adapters/targetParity';

export function MinimalTruthView({ targets }: { targets: TargetParityTruth[] }) {
  return (
    <section aria-label="Minimal truth" data-testid="vx-minimal-truth">
      <h2>Verdad mínima</h2>
      <ul>
        {targets.map((target) => (
          <li key={target.source.targetId}>
            <strong>{target.source.targetId}</strong>
            <span> binding:{target.source.bindingState}</span>
            <span> runtime:{target.observation?.connected ? 'CONNECTED' : target.source.runtimeState}</span>
            <span> readiness:{target.observation?.readiness ?? 'UNKNOWN'}</span>
            <span> source/live:{String(target.sourceMatchesLive)}</span>
            <span> material:{String(target.materialReady)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
