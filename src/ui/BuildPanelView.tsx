import React from 'react';
import type { BuildPanelItem } from '../build/buildPanel';

export function BuildPanelView({ items }: { items: BuildPanelItem[] }) {
  return (
    <section aria-label="Build panel" data-testid="vx-build-panel">
      <h2>Build</h2>
      <ul>
        {items.map((item) => (
          <li key={item.ref}>
            {item.ref} · {item.level} · external:{item.externalSystem ?? 'NO'}
          </li>
        ))}
      </ul>
    </section>
  );
}
