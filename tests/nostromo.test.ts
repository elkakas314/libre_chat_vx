import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { deriveFocusDomain, windowsForDomain } from '../src/cockpit/windowRouter';
import { CONTROL_SPECS, controlIntent } from '../src/cockpit/controlDeck';
import { moveTentacleHudScope } from '../src/cockpit/tentacleHud';
import {
  MANOJOS3_LIBRECHAT_INTEGRATION,
  MANOJOS3_PARITY_DESCRIPTOR,
  VX13_LIBRECHAT_INTEGRATION,
  VX13_PARITY_DESCRIPTOR,
  reconcileTargetParity,
} from '../src/adapters/targetParity';
import { summarizeCapabilities } from '../src/cockpit/capabilityLens';
import { artifactCommitIntent } from '../src/artifacts/interactiveArtifact';
import { NostromoCockpit } from '../src/ui/NostromoCockpit';

test('semantic routing sends evidence to evidence, not files', () => {
  assert.equal(deriveFocusDomain('abre la evidencia y el receipt'), 'EVIDENCE');
  assert.equal(windowsForDomain('EVIDENCE').includes('EVIDENCE'), true);
});

test('HUD changes scope without gaining authority', () => {
  const hud = {
    scope: 'MANOJOS3' as const,
    focusedTarget: 'MANOJOS3' as const,
    presentation: 'OBSERVING' as const,
    focusLabel: 'browser',
    windows: windowsForDomain('BROWSER'),
    evidenceFresh: false,
    authority: false as const,
  };
  const moved = moveTentacleHudScope(hud, 'BOTH');
  assert.equal(moved.scope, 'BOTH');
  assert.equal(moved.focusedTarget, undefined);
  assert.equal(moved.authority, false);
});

test('red controls may draft for a concrete target but cannot submit without full governed path', () => {
  const red = CONTROL_SPECS.find((spec) => spec.id === 'EXECUTE');
  assert.ok(red);
  const truth = reconcileTargetParity(
    MANOJOS3_PARITY_DESCRIPTOR,
    MANOJOS3_LIBRECHAT_INTEGRATION,
  );
  const intent = controlIntent(red!, 'MANOJOS3', truth, 'auth-ref', 'construction.apply');
  assert.equal(intent.directEffect, false);
  assert.equal(intent.canPrepare, true);
  assert.equal(intent.canSubmit, false);
  assert.equal(intent.blockers.includes('GOVERNED_MUTATION_PATH_NOT_READY'), true);
});

test('red controls cannot even draft a mutation for BOTH scope', () => {
  const red = CONTROL_SPECS.find((spec) => spec.id === 'DELETE');
  assert.ok(red);
  const intent = controlIntent(red!, 'BOTH');
  assert.equal(intent.canPrepare, false);
  assert.equal(intent.canSubmit, false);
  assert.equal(intent.blockers.includes('CONCRETE_TARGET_REQUIRED'), true);
});

test('interactive artifact never turns AUTHORIZATION_RESPONSE into authority', () => {
  const truth = reconcileTargetParity(VX13_PARITY_DESCRIPTOR, VX13_LIBRECHAT_INTEGRATION);
  const intent = artifactCommitIntent({
    id: 'approve',
    kind: 'AUTHORIZATION_RESPONSE',
    label: 'Responder',
    class: 'RED',
  }, 'VX13', truth, 'auth-ref', 'cap-ref');
  assert.equal(intent.uiEffect, 'PREPARE_MATERIAL_REQUEST');
  assert.equal(intent.directEffect, false);
  assert.equal(intent.canSubmit, false);
});

test('MANOJOS3 capability vocabulary collapses to bounded lenses', () => {
  const summaries = summarizeCapabilities([
    { id:'browser.session.status', category:'browser', risk:'R0', status:'READ_VERIFIED', availability:'AVAILABLE' },
    { id:'construction.opencode.apply', category:'construction', risk:'R2', status:'PARTIAL', availability:'AVAILABLE' },
    { id:'state.receipts.summary', category:'state', risk:'R0', status:'READ_VERIFIED', availability:'AVAILABLE' },
    { id:'connector.intent.read', category:'connectors', risk:'R0', status:'READ_VERIFIED', availability:'AVAILABLE' },
  ]);
  assert.equal(summaries.some((item) => item.lens === 'BUILD'), true);
  assert.equal(summaries.some((item) => item.lens === 'STATE_EVIDENCE'), true);
});

test('Nostromo renders BOTH as a view scope with no active mutation target', () => {
  const m3 = reconcileTargetParity(MANOJOS3_PARITY_DESCRIPTOR, MANOJOS3_LIBRECHAT_INTEGRATION);
  const vx13 = reconcileTargetParity(VX13_PARITY_DESCRIPTOR, VX13_LIBRECHAT_INTEGRATION);
  const html = renderToStaticMarkup(React.createElement(NostromoCockpit, {
    scope:'BOTH',
    hud:{
      scope:'BOTH',
      presentation:'UNKNOWN',
      focusLabel:'overview',
      windows:windowsForDomain('OVERVIEW'),
      evidenceFresh:false,
      authority:false,
    },
    targetTruth:[m3,vx13],
    windows:windowsForDomain('OVERVIEW'),
  }));
  assert.match(html, /scope:BOTH/);
  assert.match(html, /MANOJOS3/);
  assert.match(html, /VX13/);
  assert.match(html, /authority:false/);
});
