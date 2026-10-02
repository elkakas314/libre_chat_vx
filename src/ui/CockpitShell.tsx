import React from 'react';
import type { CockpitState } from '../runtime/cockpitState';
import type { StatusRailState } from '../cockpit/statusRail';
import { StatusRailView } from './StatusRailView';
import { DecisionInboxView } from './DecisionInboxView';
import { ArtifactDockView } from './ArtifactDockView';
import { ModuleIndexView } from './ModuleIndexView';

export interface CockpitShellProps {
  state: CockpitState;
  status: StatusRailState;
  children?: React.ReactNode;
}

export function CockpitShell({ state, status, children }: CockpitShellProps) {
  return (
    <div data-testid="librechat-vx-cockpit" aria-label="LibreChat VX cockpit">
      <StatusRailView state={status} />
      <div>
        <main>{children}</main>
        <aside aria-label="VX cockpit side panel">
          <DecisionInboxView decisions={state.decisions} />
          <ModuleIndexView modules={state.modules} />
          <ArtifactDockView items={state.artifacts} />
        </aside>
      </div>
    </div>
  );
}
