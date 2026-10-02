import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveFocus } from '../src/cockpit/currentFocus';
import {
  effectiveReadTarget,
  clearOneTurnOverride,
  resolvedMutationTarget,
} from '../src/cockpit/systemTarget';
import { resolveUiDegradation } from '../src/cockpit/uiDegradation';
import { canCoalesceAttention } from '../src/cockpit/attention';
import { mayReplayInBackground } from '../src/recovery/backgroundMutationFence';
import { postTimeoutOutcome } from '../src/browser/browserView';
import { exposeTool } from '../src/cockpit/targetToolGate';
import { materiallyReady } from '../src/contracts/readinessTruth';
import { combineTargetReads } from '../src/discovery/crossTargetRead';
import { EventDeduper } from '../src/recovery/snapshotResync';
import { CockpitReducer } from '../src/runtime/eventReducer';
import { emptyCockpitState } from '../src/runtime/cockpitState';
import { rendererMode } from '../src/cockpit/rendererFailureIsolation';
import { canUseResource } from '../src/files/externalResourceRef';
import { mobileLibreChatState } from '../src/mobile/mobileContinuity';
import { safePrivacyMode } from '../src/cockpit/privacyPresentation';
import { validateDraftForApply } from '../src/cockpit/controlDraft';
import { acceptVisualAction } from '../src/security/trustedSurfaceHost';

test('ambiguous focus requires input', () => {
  const result = resolveFocus([
    { systemId: 'MANOJOS3', pinOrigin: 'AUTO' },
    { systemId: 'VX13', pinOrigin: 'AUTO' },
  ]);
  assert.equal(result.status, 'NEEDS_INPUT');
});

test('one-turn read override does not mutate primary scope', () => {
  const selection = { primaryScope: 'AUTO' as const, oneTurnReadOverride: 'MANOJOS3' as const };
  assert.equal(effectiveReadTarget(selection), 'MANOJOS3');
  assert.deepEqual(clearOneTurnOverride(selection), { primaryScope: 'AUTO' });
});

test('AUTO and BOTH are never mutation targets', () => {
  assert.equal(resolvedMutationTarget('AUTO'), null);
  assert.equal(resolvedMutationTarget('BOTH'), null);
  assert.equal(resolvedMutationTarget('VX13'), 'VX13');
});

test('stale UI degrades to readonly', () => {
  assert.equal(resolveUiDegradation({
    connected: true,
    authenticated: true,
    fresh: false,
    rendererHealthy: true,
    aclAllowsRead: true,
    aclAllowsAction: true,
  }), 'READONLY_STALE');
});

test('critical attention never coalesces', () => {
  assert.equal(canCoalesceAttention('CRITICAL'), false);
  assert.equal(canCoalesceAttention('INFO'), true);
});

test('background mutation replay is always fenced', () => {
  assert.equal(mayReplayInBackground(), false);
});

test('browser possible-effect timeout becomes unknown outcome', () => {
  assert.equal(postTimeoutOutcome(true), 'UNKNOWN_OUTCOME');
});

test('R2 tool requires live adapter', () => {
  assert.equal(exposeTool({
    targetId: 'MANOJOS3',
    toolId: 'construction.apply',
    risk: 'R2',
    availability: 'LIVE',
    registryBacked: true,
    aclAllowed: true,
    adapterLive: true,
    sourceRevision: 'abc',
  }), true);

  assert.equal(exposeTool({
    targetId: 'MANOJOS3',
    toolId: 'construction.apply',
    risk: 'R2',
    availability: 'STALE',
    registryBacked: true,
    aclAllowed: true,
    adapterLive: true,
    sourceRevision: 'abc',
  }), false);
});

test('readiness dimensions remain independent', () => {
  assert.equal(materiallyReady({
    configured: true,
    channelEnabled: true,
    bindingReady: true,
    callableProbePassed: true,
    providerAvailable: false,
    observedAt: '1970-01-01T00:00:00.000Z',
  }), false);
});

test('cross-target read preserves partial state', () => {
  const combined = combineTargetReads([
    { targetId: 'MANOJOS3', status: 'OK', provenance: ['m3'] },
    { targetId: 'VX13', status: 'OFFLINE', provenance: ['vx13'] },
  ]);
  assert.equal(combined.partial, true);
  assert.equal(combined.results.length, 2);
});

test('event dedupe rejects duplicate event id', () => {
  const deduper = new EventDeduper();
  const event = { eventId: 'e1', cursor: '1', revision: 'r1' };
  assert.equal(deduper.accept(event), true);
  assert.equal(deduper.accept(event), false);
});

test('cockpit reducer detects revision discontinuity', () => {
  const reducer = new CockpitReducer();
  const first = reducer.apply(emptyCockpitState(), {
    eventId: 'e1',
    cursor: '1',
    revision: 'r1',
    kind: 'ALERT',
    value: 'hello',
  });
  const drift = reducer.apply(first, {
    eventId: 'e2',
    cursor: '2',
    revision: 'r2',
    kind: 'ALERT',
    value: 'next',
  });
  assert.equal(drift.alerts.includes('RESYNC_REQUIRED'), true);
});

test('renderer failure stays local to renderer', () => {
  assert.equal(rendererMode({ failures: 3, schemaValid: true, budgetExceeded: false }), 'CIRCUIT_OPEN');
});

test('external resource operations are scoped', () => {
  const ref = {
    provider: 'drive',
    resourceId: 'x',
    tenantId: 't',
    allowedOperations: ['PREVIEW' as const],
  };
  assert.equal(canUseResource(ref, 'PREVIEW'), true);
  assert.equal(canUseResource(ref, 'EDIT'), false);
});

test('mobile backend off is explicit unavailable', () => {
  assert.equal(mobileLibreChatState({ backendReachable: false, snapshotFresh: false }), 'UNAVAILABLE');
});

test('unknown classification forces minimal privacy', () => {
  assert.equal(safePrivacyMode('NORMAL', false), 'MINIMAL');
});

test('stale draft cannot apply', () => {
  assert.deepEqual(validateDraftForApply(
    { draftId: 'd', targetId: 'MANOJOS3', observedRevision: 'r1', createdAt: '0', preview: {} },
    { targetId: 'MANOJOS3', observedRevision: 'r2', aclAllowsAction: true },
  ), { ok: false, reason: 'STALE_DRAFT' });
});

test('trusted surface requires all four gates', () => {
  assert.equal(acceptVisualAction({
    allowedOrigins: new Set(['https://trusted.example']),
    allowedActions: new Set(['OPEN_EVIDENCE']),
    allowEval: false,
    allowRemoteDynamicModules: false,
    allowWildcardPostMessage: false,
  }, {
    origin: 'https://trusted.example',
    action: 'OPEN_EVIDENCE',
    schemaValid: true,
    provenanceValid: true,
  }), true);
});
