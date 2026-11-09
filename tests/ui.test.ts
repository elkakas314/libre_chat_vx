import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { SourceOnlyCockpit } from '../src/ui/SourceOnlyCockpit';
import { DecisionInboxView } from '../src/ui/DecisionInboxView';
import { ActiveFlowView } from '../src/ui/ActiveFlowView';

test('source-only cockpit never claims live truth', () => {
  const html = renderToStaticMarkup(React.createElement(SourceOnlyCockpit));
  assert.match(html, /SOURCE_ONLY/);
  assert.match(html, /not verified/i);
  assert.doesNotMatch(html, />LIVE</);
});

test('decision inbox renders only pending decisions', () => {
  const html = renderToStaticMarkup(React.createElement(DecisionInboxView, {
    decisions: [
      {
        decisionRef: 'd1',
        authorizationAuthorityRef: 'madre',
        targetId: 'VX13',
        expiresAtMs: 99,
        state: 'PENDING',
      },
      {
        decisionRef: 'd2',
        authorizationAuthorityRef: 'gov',
        targetId: 'MANOJOS3',
        expiresAtMs: 99,
        state: 'RESOLVED',
      },
    ],
  }));
  assert.match(html, /VX13/);
  assert.doesNotMatch(html, /MANOJOS3/);
});

test('active flow hides plan-only edges', () => {
  const html = renderToStaticMarkup(React.createElement(ActiveFlowView, {
    edges: [
      { from: 'LibreChat', to: 'MANOJOS3', executionEvidenceRef: 'e1' },
      { from: 'MANOJOS3', to: 'ORACULO' },
    ],
  }));
  assert.match(html, /LibreChat/);
  assert.doesNotMatch(html, /ORACULO/);
});
