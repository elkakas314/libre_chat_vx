import React, { useMemo, useState } from 'react';
import {
  MANOJOS3_PARITY_SOURCE,
  VX13_PARITY_SOURCE,
  deriveFocusDomain,
  moveTentacleHud,
  reconcileTargetParity,
  windowsForDomain,
  NostromoCockpit,
  type SystemTarget,
} from '@librechat/vx';

const KEY = 'librechat-vx-cockpit';

export default function VXCockpitBridge() {
  const enabled = typeof window !== 'undefined' && window.localStorage.getItem(KEY) === '1';
  const [target, setTarget] = useState<SystemTarget>('AUTO');
  const [focusText] = useState('overview');

  const m3 = useMemo(() => reconcileTargetParity(MANOJOS3_PARITY_SOURCE), []);
  const vx13 = useMemo(() => reconcileTargetParity(VX13_PARITY_SOURCE), []);
  const active = target === 'VX13' ? vx13 : m3;
  const domain = deriveFocusDomain(focusText);
  const windows = windowsForDomain(domain);

  const hud = moveTentacleHud({
    target: 'AUTO',
    presentation: 'OBSERVING',
    focusLabel: domain,
    windows,
    evidenceFresh: false,
    authority: false,
  }, target);

  if (!enabled) return null;

  return (
    <NostromoCockpit
      target={target}
      onTargetChange={setTarget}
      hud={hud}
      targetTruth={[m3, vx13]}
      activeTruth={active}
      windows={windows}
    />
  );
}
