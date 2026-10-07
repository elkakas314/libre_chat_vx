import React from 'react';
import type { TentacleHudModel } from '../cockpit/tentacleHud';

export function TentacleHud({ model }: { model: TentacleHudModel }) {
  return (
    <section aria-label="Tentáculo HUD" data-testid="vx-tentacle-hud">
      <h2>Tentáculo</h2>
      <p>scope:{model.scope}</p>
      <p>focusedTarget:{model.focusedTarget ?? 'NONE'}</p>
      <p>state:{model.presentation}</p>
      <p>focus:{model.focusLabel}</p>
      <p>evidenceFresh:{String(model.evidenceFresh)}</p>
      {model.companion ? (
        <div aria-label="Tentáculo companion" data-testid="vx-tentacle-companion">
          <p>companion:{model.companion.role}</p>
          <p>companionAuthority:false</p>
        </div>
      ) : null}
      {model.inference ? (
        <div aria-label="Inference status" data-testid="vx-inference-status">
          <p>inference:{model.inference.label}</p>
          <p>health:{model.inference.health}</p>
          <p>quota:{model.inference.quotaState}</p>
          <p>freshness:{model.inference.freshness}</p>
          <p>targetTruth:{model.inference.targetTruth}</p>
          <p>inferenceAuthority:false</p>
        </div>
      ) : null}
      <p>authority:false</p>
    </section>
  );
}
