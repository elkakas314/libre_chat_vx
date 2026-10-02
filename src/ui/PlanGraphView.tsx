import React from 'react';
import type { PlanNodeState } from '../cockpit/planGraph';
import { isMaterial } from '../cockpit/planGraph';

export interface PlanNode {
  id: string;
  label: string;
  state: PlanNodeState;
}

export function PlanGraphView({ nodes }: { nodes: PlanNode[] }) {
  return (
    <section aria-label="Plan graph" data-testid="vx-plan-graph">
      <h2>Plan Graph</h2>
      <ol>
        {nodes.map((node) => (
          <li key={node.id}>
            {node.label} · {node.state} · material:{String(isMaterial(node.state))}
          </li>
        ))}
      </ol>
    </section>
  );
}
