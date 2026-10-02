import React from 'react';
import type { ExternalResourceRef } from '../files/externalResourceRef';

export function FilesPanelView({ resources }: { resources: ExternalResourceRef[] }) {
  return (
    <section aria-label="Files and cloud" data-testid="vx-files-panel">
      <h2>Files / Cloud</h2>
      <ul>
        {resources.map((resource) => (
          <li key={resource.provider + ':' + resource.resourceId}>
            {resource.provider}:{resource.resourceId}
            {' '}ops:{resource.allowedOperations.join(',')}
          </li>
        ))}
      </ul>
    </section>
  );
}
