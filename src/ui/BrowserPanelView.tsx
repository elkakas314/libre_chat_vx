import React from 'react';
import type { BrowserView } from '../browser/browserView';

export function BrowserPanelView({ view }: { view?: BrowserView }) {
  return (
    <section aria-label="Browser panel" data-testid="vx-browser-panel">
      <h2>Browser</h2>
      {!view ? <p>NO_BROWSER_CONTEXT</p> : (
        <>
          <p>origin:{view.origin}</p>
          <p>url:{view.url}</p>
          <p>remoteDomTrusted:false</p>
          <p>screenshot:{view.screenshotRef ?? '—'}</p>
        </>
      )}
    </section>
  );
}
