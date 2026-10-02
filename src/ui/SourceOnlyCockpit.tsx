import React from 'react';
import { emptyCockpitState } from '../runtime/cockpitState';
import { CockpitShell } from './CockpitShell';

export function SourceOnlyCockpit() {
  return (
    <CockpitShell
      state={emptyCockpitState()}
      status={{
        connection: 'UNKNOWN',
        readiness: 'UNKNOWN',
        freshness: 'SOURCE_ONLY',
        sourceTruth: 'SOURCE_ONLY',
        decisionInboxVisible: true,
      }}
    >
      <p>LibreChat VX source overlay loaded. Live target bindings are not verified.</p>
    </CockpitShell>
  );
}
