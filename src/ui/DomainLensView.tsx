import React from 'react';
import type { DomainView } from '../cockpit/domainViews';
import { descriptor } from '../cockpit/domainViews';

export function DomainLensView({ views }: { views: DomainView[] }) {
  return (
    <section aria-label="Domain lenses" data-testid="vx-domain-lenses">
      <h2>Domain Lenses</h2>
      <ul>
        {views.map((view) => {
          const value = descriptor(view);
          return <li key={view}>{view} · lazy:{String(value.lazy)} · writer:{String(value.writer)}</li>;
        })}
      </ul>
    </section>
  );
}
