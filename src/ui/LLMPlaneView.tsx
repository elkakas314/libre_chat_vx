import React from 'react';
import type { LlmTopology } from '../llm/llmPlane';

export function LLMPlaneView({ topologies }: { topologies: readonly LlmTopology[] }) {
  return (
    <section aria-label="LLM plane" data-testid="vx-llm-plane">
      <h2>LLM Plane</h2>
      <ul>
        {topologies.map((topology) => (
          <li key={topology.id}>
            <strong>{topology.label}</strong>
            <span> model:{topology.modelPath}</span>
            <span> actions:{topology.actionPath}</span>
            <span> advisory:{topology.advisoryPath}</span>
            <span> state:{topology.state}</span>
            <span> paidFallback:{String(topology.paidFallbackAllowed)}</span>
            <span> authority:false</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
