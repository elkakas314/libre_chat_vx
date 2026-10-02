import React, { useEffect, useState } from 'react';
import { SourceOnlyCockpit } from '@librechat/vx';

const KEY = 'librechat-vx-cockpit';

export default function VXCockpitBridge() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(window.localStorage.getItem(KEY) === '1');
  }, []);

  if (!enabled) return null;
  return <SourceOnlyCockpit />;
}
