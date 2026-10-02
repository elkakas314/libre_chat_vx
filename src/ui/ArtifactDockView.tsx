import React from 'react';
import type { DockItem, DockOperation } from '../cockpit/artifactDock';
import { canOperate } from '../cockpit/artifactDock';

export interface ArtifactDockViewProps {
  items: DockItem[];
  onAction?: (item: DockItem, operation: DockOperation) => void;
}

const operations: DockOperation[] = ['OPEN', 'PIN', 'COMPARE', 'TIMELINE', 'EXPORT'];

export function ArtifactDockView({ items, onAction }: ArtifactDockViewProps) {
  return (
    <section aria-label="Artifact dock" data-testid="vx-artifact-dock">
      <h2>Artifacts &amp; Evidence</h2>
      <ul>
        {items.map((item) => (
          <li key={item.ref}>
            <span>{item.kind}: {item.ref}</span>
            {operations.map((operation) => (
              <button
                key={operation}
                type="button"
                disabled={!canOperate(item, operation)}
                onClick={() => onAction?.(item, operation)}
              >
                {operation}
              </button>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
