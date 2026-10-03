import React from 'react';
import type { HybridRuntimeMode, NostromoHybridArchitecture } from '../llm/nostromoHybrid';

export function NostromoHybridView({
  architecture,
  mode,
}: {
  architecture: NostromoHybridArchitecture;
  mode: HybridRuntimeMode;
}) {
  return (
    <section aria-label="Nostromo hybrid conversation core" data-testid="vx-nostromo-hybrid">
      <h2>Nostromo Hybrid</h2>
      <p>mode:{mode}</p>
      <p>voice:{architecture.localVoice.alias}</p>
      <p>voiceSize:{architecture.localVoice.sizeTarget}</p>
      <p>reasoner:{architecture.freeReasoningRouter.owner}</p>
      <p>actions:{architecture.actionPlane.owner}</p>
      <p>paidFallback:false</p>
      <p>authority:false</p>
    </section>
  );
}
