/* Synthetic render fixture: no host, credentials, LLM or target effects. */
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SourceOnlyCockpit } from '../../src/ui/SourceOnlyCockpit';
import { NostromoCockpit } from '../../src/ui/NostromoCockpit';
import {
  MANOJOS3_LIBRECHAT_INTEGRATION, MANOJOS3_PARITY_DESCRIPTOR,
  VX13_LIBRECHAT_INTEGRATION, VX13_PARITY_DESCRIPTOR, reconcileTargetParity,
} from '../../src/adapters/targetParity';
import { windowsForDomain } from '../../src/cockpit/windowRouter';
import { moveTentacleHudScope } from '../../src/cockpit/tentacleHud';
import type { TargetScope } from '../../src/cockpit/systemTarget';

const m3 = reconcileTargetParity(MANOJOS3_PARITY_DESCRIPTOR, MANOJOS3_LIBRECHAT_INTEGRATION);
const vx13 = reconcileTargetParity(VX13_PARITY_DESCRIPTOR, VX13_LIBRECHAT_INTEGRATION);
const windows = windowsForDomain('OVERVIEW');

function Fixture() {
  const [scope, setScope] = useState<TargetScope>('AUTO');
  const activeTruth = scope === 'MANOJOS3' ? m3 : scope === 'VX13' ? vx13 : undefined;
  const hud = moveTentacleHudScope({
    scope: 'AUTO', presentation: 'UNKNOWN', focusLabel: 'overview',
    windows, evidenceFresh: false, authority: false,
  }, scope);
  return (
    <div className="vx-visual-fixture">
      <header>
        <h1>LibreChat VX · NOSTROMO</h1>
        <p>Fixture SOURCE; no binding LIVE ni autoridad material.</p>
      </header>
      <div hidden aria-hidden="true"><SourceOnlyCockpit /></div>
      <NostromoCockpit scope={scope} hud={hud} targetTruth={[m3, vx13]}
        activeTruth={activeTruth} windows={windows} onScopeChange={setScope} />
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
