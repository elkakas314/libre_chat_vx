import React from 'react';
import type { AudioPanelProjection } from '../audio/audioPanel';

export function AudioPanelView({ projection }: { projection?: AudioPanelProjection }) {
  return (
    <section aria-label="SHUB audio" data-testid="vx-audio-panel">
      <h2>SHUB Audio</h2>
      {!projection ? <p>NO_AUDIO_CONTEXT</p> : (
        <dl>
          <dt>project</dt><dd>{projection.projectRef}</dd>
          <dt>track</dt><dd>{projection.trackRef ?? '—'}</dd>
          <dt>plugin</dt><dd>{projection.pluginRef ?? '—'}</dd>
          <dt>parameter</dt><dd>{projection.parameterRef ?? '—'}</dd>
          <dt>value</dt><dd>{String(projection.observedValue ?? '—')}</dd>
          <dt>A/B evidence</dt><dd>{projection.abEvidenceRef ?? '—'}</dd>
        </dl>
      )}
    </section>
  );
}
