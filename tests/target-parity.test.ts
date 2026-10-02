import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  MANOJOS3_LIBRECHAT_INTEGRATION,
  MANOJOS3_PARITY_DESCRIPTOR,
  VX13_LIBRECHAT_INTEGRATION,
  VX13_PARITY_DESCRIPTOR,
  parityGuaranteesAligned,
  reconcileTargetParity,
} from '../src/adapters/targetParity';
import { TargetParityView } from '../src/ui/TargetParityView';

test('VX13 and MANOJOS3 share external safety guarantees', () => {
  assert.equal(
    parityGuaranteesAligned(MANOJOS3_PARITY_DESCRIPTOR, VX13_PARITY_DESCRIPTOR),
    true,
  );
});

test('policy, execution and verification authorities remain distinct', () => {
  assert.deepEqual(MANOJOS3_PARITY_DESCRIPTOR.authority, {
    policyAuthority: 'MANOJOS3_POLICY',
    executionAuthority: 'MANOJOS3_KERNEL',
    verificationAuthority: 'MANOJOS3_VERIFIER',
  });
  assert.deepEqual(VX13_PARITY_DESCRIPTOR.authority, {
    policyAuthority: 'VX13_MADRE',
    executionAuthority: 'VX13_SPAWNER_HIJA',
    verificationAuthority: 'VX13_MADRE',
  });
});

test('VX13 source design cannot imply live path readiness', () => {
  const truth = reconcileTargetParity(
    VX13_PARITY_DESCRIPTOR,
    VX13_LIBRECHAT_INTEGRATION,
    {
      targetId: 'VX13',
      connection: 'CONNECTED',
      readiness: 'READY',
      sourceRevision: 'same',
      liveRevision: 'same',
      capabilityCount: 10,
      observedAt: '2026-10-03T00:00:00Z',
      evidenceRefs: ['probe'],
    },
  );
  assert.equal(truth.governedReadPathReady, false);
  assert.equal(truth.governedMutationPathReady, false);
  assert.equal(truth.integration.bindingState, 'UNCONFIGURED');
});

test('MANOJOS3 prepared-unconfigured binding remains fail-closed', () => {
  const truth = reconcileTargetParity(
    MANOJOS3_PARITY_DESCRIPTOR,
    MANOJOS3_LIBRECHAT_INTEGRATION,
    {
      targetId: 'MANOJOS3',
      connection: 'CONNECTED',
      readiness: 'READY',
      sourceRevision: 'same',
      liveRevision: 'same',
      capabilityCount: 134,
      observedAt: '2026-10-03T00:00:00Z',
      evidenceRefs: ['live-self'],
    },
  );
  assert.equal(truth.governedReadPathReady, false);
  assert.equal(truth.governedMutationPathReady, false);
  assert.equal(truth.integration.bindingState, 'PREPARED_UNCONFIGURED');
});

test('source/live revision drift blocks both governed paths', () => {
  const integration = {
    adapterImplementation: 'INSTALLED' as const,
    bindingState: 'BOUND_GOVERNED' as const,
  };
  const truth = reconcileTargetParity(
    MANOJOS3_PARITY_DESCRIPTOR,
    integration,
    {
      targetId: 'MANOJOS3',
      connection: 'CONNECTED',
      readiness: 'READY',
      sourceRevision: 'a',
      liveRevision: 'b',
      observedAt: '2026-10-03T00:00:00Z',
      evidenceRefs: ['readback'],
    },
  );
  assert.equal(truth.sourceAlignment, 'DRIFT');
  assert.equal(truth.governedReadPathReady, false);
  assert.equal(truth.governedMutationPathReady, false);
});

test('parity view keeps source, integration and observation separate', () => {
  const html = renderToStaticMarkup(React.createElement(TargetParityView, {
    targets: [
      reconcileTargetParity(VX13_PARITY_DESCRIPTOR, VX13_LIBRECHAT_INTEGRATION),
      reconcileTargetParity(MANOJOS3_PARITY_DESCRIPTOR, MANOJOS3_LIBRECHAT_INTEGRATION),
    ],
  }));
  assert.match(html, /DESIGN_CONSOLIDATION/);
  assert.match(html, /PREPARED_UNCONFIGURED/);
  assert.match(html, /connection:UNKNOWN/);
});
