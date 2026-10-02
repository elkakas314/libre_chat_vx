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
      <p>authority:false</p>
    </section>
  );
}
