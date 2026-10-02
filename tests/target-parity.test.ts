import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  MANOJOS3_PARITY_SOURCE,
  VX13_PARITY_SOURCE,
  parityGuaranteesAligned,
  reconcileTargetParity,
} from '../src/adapters/targetParity';
import { TargetParityView } from '../src/ui/TargetParityView';

test('VX13 and MANOJOS3 share the same external safety guarantees', () => {
  assert.equal(
    parityGuaranteesAligned(MANOJOS3_PARITY_SOURCE, VX13_PARITY_SOURCE),
    true,
  );
});

test('authority owners remain distinct', () => {
  assert.equal(MANOJOS3_PARITY_SOURCE.authorityOwner, 'MANOJOS3_POLICY_KERNEL');
  assert.equal(VX13_PARITY_SOURCE.authorityOwner, 'VX13_MADRE');
});

test('VX13 cannot become material-ready from design/source only', () => {
  const truth = reconcileTargetParity(VX13_PARITY_SOURCE, {
    targetId: 'VX13',
    connected: true,
    readiness: 'READY',
    sourceRevision: 'same',
    liveRevision: 'same',
    capabilityCount: 10,
    observedAt: '2026-10-02T00:00:00Z',
    evidenceRefs: ['probe'],
  });
  assert.equal(truth.materialReady, false);
  assert.equal(truth.source.bindingState, 'UNCONFIGURED');
});

test('MANOJOS3 LibreChat binding remains fail-closed while prepared-unconfigured', () => {
  const truth = reconcileTargetParity(MANOJOS3_PARITY_SOURCE, {
    targetId: 'MANOJOS3',
    connected: true,
    readiness: 'READY',
    sourceRevision: 'same',
    liveRevision: 'same',
    capabilityCount: 133,
    observedAt: '2026-10-02T00:00:00Z',
    evidenceRefs: ['live-self'],
  });
  assert.equal(truth.materialReady, false);
  assert.equal(truth.source.bindingState, 'PREPARED_UNCONFIGURED');
});

test('source/live revision drift prevents material readiness', () => {
  const source = { ...MANOJOS3_PARITY_SOURCE, bindingState: 'BOUND_GOVERNED' as const };
  const truth = reconcileTargetParity(source, {
    targetId: 'MANOJOS3',
    connected: true,
    readiness: 'READY',
    sourceRevision: 'a',
    liveRevision: 'b',
    observedAt: '2026-10-02T00:00:00Z',
    evidenceRefs: ['readback'],
  });
  assert.equal(truth.sourceMatchesLive, false);
  assert.equal(truth.materialReady, false);
});

test('parity view displays source/binding/runtime separately', () => {
  const html = renderToStaticMarkup(React.createElement(TargetParityView, {
    targets: [
      reconcileTargetParity(VX13_PARITY_SOURCE),
      reconcileTargetParity(MANOJOS3_PARITY_SOURCE),
    ],
  }));
  assert.match(html, /VX13/);
  assert.match(html, /MANOJOS3/);
  assert.match(html, /DESIGN_CONSOLIDATION/);
  assert.match(html, /PREPARED_UNCONFIGURED/);
});
