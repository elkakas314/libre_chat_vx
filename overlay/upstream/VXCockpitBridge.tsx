import React, { useMemo, useState } from 'react';
import './VXCockpit.css';
import {
  MANOJOS3_LIBRECHAT_INTEGRATION,
  MANOJOS3_PARITY_DESCRIPTOR,
  VX13_LIBRECHAT_INTEGRATION,
  VX13_PARITY_DESCRIPTOR,
  deriveFocusDomain,
  moveTentacleHudScope,
  reconcileTargetParity,
  windowsForDomain,
  NostromoCockpit,
  type TargetScope,
} from '@librechat/vx';

const KEY = 'librechat-vx-cockpit';

export default function VXCockpitBridge() {
  const enabled = typeof window !== 'undefined' && window.localStorage.getItem(KEY) === '1';
  const [scope, setScope] = useState<TargetScope>('AUTO');
  const [focusText] = useState('overview');

  const m3 = useMemo(
    () => reconcileTargetParity(MANOJOS3_PARITY_DESCRIPTOR, MANOJOS3_LIBRECHAT_INTEGRATION),
    [],
  );
  const vx13 = useMemo(
    () => reconcileTargetParity(VX13_PARITY_DESCRIPTOR, VX13_LIBRECHAT_INTEGRATION),
    [],
  );

  const activeTruth = scope === 'MANOJOS3' ? m3 : scope === 'VX13' ? vx13 : undefined;
  const domain = deriveFocusDomain(focusText);
  const windows = windowsForDomain(domain);

  const hud = moveTentacleHudScope({
    scope: 'AUTO',
    presentation: 'UNKNOWN',
    focusLabel: domain,
    windows,
    evidenceFresh: false,
    authority: false,
  }, scope);

  if (!enabled) return null;

  return (
    <NostromoCockpit
      scope={scope}
      onScopeChange={setScope}
      hud={hud}
      targetTruth={[m3, vx13]}
      activeTruth={activeTruth}
      windows={windows}
    />
  );
}
