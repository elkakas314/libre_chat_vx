import React from 'react';
import type { CapabilityCatalogItem } from '../cockpit/capabilityLens';
import { summarizeCapabilities } from '../cockpit/capabilityLens';

export function CapabilityLensView({ capabilities }: { capabilities: CapabilityCatalogItem[] }) {
  const summaries = summarizeCapabilities(capabilities);
  return (
    <section aria-label="Capability lenses" data-testid="vx-capability-lenses">
      <h2>Capability Lenses</h2>
      <ul>
        {summaries.map((summary) => (
          <li key={summary.lens}>
            <strong>{summary.lens}</strong>
            <span> total:{summary.total}</span>
            <span> available:{summary.available}</span>
            <span> readVerified:{summary.readVerified}</span>
            <span> materialRisk:{summary.materialRisk}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
