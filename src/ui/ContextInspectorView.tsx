import React from 'react';
import type { CurrentFocus } from '../cockpit/currentFocus';

export function ContextInspectorView({ focus }: { focus?: CurrentFocus }) {
  return (
    <section aria-label="Context inspector" data-testid="vx-context-inspector">
      <h2>Context Inspector</h2>
      {!focus ? <p>NO_FOCUS</p> : (
        <dl>
          <dt>system</dt><dd>{focus.systemId}</dd>
          <dt>module</dt><dd>{focus.moduleRef ?? '—'}</dd>
          <dt>capability</dt><dd>{focus.capabilityRef ?? '—'}</dd>
          <dt>run</dt><dd>{focus.runRef ?? '—'}</dd>
          <dt>artifact</dt><dd>{focus.artifactRef ?? '—'}</dd>
          <dt>pin</dt><dd>{focus.pinOrigin}</dd>
        </dl>
      )}
    </section>
  );
}
