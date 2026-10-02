import React from 'react';
import type { TargetRunProjection } from '../cockpit/targetRun';
import { executedRunStages, runClaimsMaterialCompletion } from '../cockpit/targetRun';

export function TargetRunView({ run }: { run: TargetRunProjection }) {
  const executed = executedRunStages(run);
  return (
    <section aria-label="Target run" data-testid="vx-target-run">
      <h2>{run.targetId} Run</h2>
      <p>run:{run.runRef ?? 'NO_RUN'}</p>
      <p>workState:{run.state}</p>
      <p>materialVerified:{String(runClaimsMaterialCompletion(run))}</p>
      <ol>
        {executed.map((stage) => (
          <li key={stage.stage}>
            {stage.stage} · {stage.state} · evidence:{stage.evidenceRef}
          </li>
        ))}
      </ol>
    </section>
  );
}
