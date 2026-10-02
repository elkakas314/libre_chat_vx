import React from 'react';
import type { StatusRailState } from '../cockpit/statusRail';

export interface StatusRailViewProps {
  state: StatusRailState;
}

export function StatusRailView({ state }: StatusRailViewProps) {
  return (
    <section aria-label="VX status rail" data-testid="vx-status-rail">
      <strong>{state.sourceTruth}</strong>
      <span> connection:{state.connection}</span>
      <span> readiness:{state.readiness}</span>
      <span> freshness:{state.freshness}</span>
      {state.observedProfile ? <span> profile:{state.observedProfile}</span> : null}
    </section>
  );
}
