import React from 'react';
import type { FlowEdge } from '../cockpit/activeFlow';
import { visibleExecutedEdges } from '../cockpit/activeFlow';

export function ActiveFlowView({ edges }: { edges: FlowEdge[] }) {
  const visible = visibleExecutedEdges(edges);
  return (
    <section aria-label="Active flow" data-testid="vx-active-flow">
      <h2>Active Flow</h2>
      <ul>
        {visible.map((edge, index) => (
          <li key={edge.from + '-' + edge.to + '-' + index}>{edge.from} → {edge.to}</li>
        ))}
      </ul>
    </section>
  );
}
