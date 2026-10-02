import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { deriveFocusDomain, windowsForDomain } from '../src/cockpit/windowRouter';
import { CONTROL_SPECS, controlIntent } from '../src/cockpit/controlDeck';
import { moveTentacleHud } from '../src/cockpit/tentacleHud';
import { MANOJOS3_PARITY_SOURCE, VX13_PARITY_SOURCE, reconcileTargetParity } from '../src/adapters/targetParity';
import { summarizeCapabilities } from '../src/cockpit/capabilityLens';
import { artifactCommitIntent } from '../src/artifacts/interactiveArtifact';
import { NostromoCockpit } from '../src/ui/NostromoCockpit';

test('focus routing opens domain windows automatically', () => {
  assert.equal(deriveFocusDomain('mira la mezcla en REAPER'), 'AUDIO');
  assert.equal(windowsForDomain('AUDIO').includes('AUDIO'), true);
  assert.equal(windowsForDomain('BROWSER').includes('BROWSER'), true);
});

test('HUD can move between MANOJOS3 and VX13 without authority change', () => {
  const hud = {
    target: 'MANOJOS3' as const,
    presentation: 'OBSERVING' as const,
    focusLabel: 'browser',
    windows: windowsForDomain('BROWSER'),
    evidenceFresh: false,
    authority: false as const,
  };
  const moved = moveTentacleHud(hud, 'VX13');
  assert.equal(moved.target, 'VX13');
  assert.equal(moved.authority, false);
});

test('red controls never execute directly and stay blocked without material readiness', () => {
  const red = CONTROL_SPECS.find((spec) => spec.id === 'EXECUTE');
  assert.ok(red);
  const truth = reconcileTargetParity(MANOJOS3_PARITY_SOURCE);
  const intent = controlIntent(red!, truth, 'auth-ref');
  assert.equal(intent.directEffect, false);
  assert.equal(intent.canPrepare, false);
});

test('interactive artifact red control only prepares a governed request', () => {
  const truth = reconcileTargetParity(VX13_PARITY_SOURCE);
  const intent = artifactCommitIntent({
    id: 'gain',
    kind: 'KNOB',
    label: 'Gain',
    class: 'RED',
  }, truth, 'auth-ref');
  assert.equal(intent.uiEffect, 'PREPARE_MATERIAL_REQUEST');
  assert.equal(intent.directEffect, false);
  assert.equal(intent.canPrepare, false);
});

test('MANOJOS3 134-capability vocabulary collapses to bounded lenses', () => {
  const summaries = summarizeCapabilities([
    { id:'browser.session.status', category:'browser', risk:'R0', status:'READ_VERIFIED', availability:'AVAILABLE' },
    { id:'construction.opencode.apply', category:'construction', risk:'R2', status:'PARTIAL', availability:'AVAILABLE' },
    { id:'state.receipts.summary', category:'state', risk:'R0', status:'READ_VERIFIED', availability:'AVAILABLE' },
    { id:'connector.intent.read', category:'connectors', risk:'R0', status:'READ_VERIFIED', availability:'AVAILABLE' },
  ]);
  assert.equal(summaries.length, 4);
  assert.equal(summaries.some((item) => item.lens === 'BUILD'), true);
  assert.equal(summaries.some((item) => item.lens === 'STATE_EVIDENCE'), true);
});

test('Nostromo cockpit renders same shell for target truth', () => {
  const m3 = reconcileTargetParity(MANOJOS3_PARITY_SOURCE);
  const vx13 = reconcileTargetParity(VX13_PARITY_SOURCE);
  const html = renderToStaticMarkup(React.createElement(NostromoCockpit, {
    target:'BOTH',
    hud:{
      target:'BOTH',
      presentation:'OBSERVING',
      focusLabel:'overview',
      windows:windowsForDomain('OVERVIEW'),
      evidenceFresh:false,
      authority:false,
    },
    targetTruth:[m3,vx13],
    activeTruth:m3,
    windows:windowsForDomain('OVERVIEW'),
  }));
  assert.match(html, /Tentáculo/);
  assert.match(html, /MANOJOS3/);
  assert.match(html, /VX13/);
  assert.match(html, /authority:false/);
});
