import React from 'react';
import type { ModuleVisualCard } from '../cockpit/moduleVisualCard';

export function ModuleIndexView({ modules }: { modules: ModuleVisualCard[] }) {
  return (
    <section aria-label="Module index" data-testid="vx-module-index">
      <h2>Module Index</h2>
      <ul>
        {modules.map((module) => (
          <li key={module.moduleRef}>
            <strong>{module.displayName}</strong>
            <span> {module.systemTarget}</span>
            <span> source:{module.sourceLevel}</span>
            <span> live:{module.liveState}</span>
            <span> material:{module.materialState}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
