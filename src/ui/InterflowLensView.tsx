import React from 'react';
import type { Manojos3InterflowDomain } from '../manojos3/interflowProjection';

export function InterflowLensView({
  domains,
}: {
  domains: readonly Manojos3InterflowDomain[];
}) {
  const visible = domains.filter((domain) => domain.visibility !== 'INTERNAL');
  const lenses = [...new Set(visible.map((domain) => domain.lens))].sort();

  return (
    <section aria-label="MANOJOS3 Interflow map" data-testid="vx-m3-interflow-map">
      <h2>MANOJOS3 Interflow</h2>
      {lenses.map((lens) => (
        <section key={lens} aria-label={lens}>
          <h3>{lens}</h3>
          <ul>
            {visible.filter((domain) => domain.lens === lens).map((domain) => (
              <li key={domain.domain}>
                <strong>{domain.domain}</strong>
                <span> route:{domain.routerAction}</span>
                <span> risk:{domain.risk}</span>
                <span> availability:{domain.availability}</span>
                <span> intent:{domain.intentCapability ?? 'NO_PUBLIC_INTENT'}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
