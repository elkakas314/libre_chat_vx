import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MANOJOS3_INTERFLOW_DOMAINS,
  MANOJOS3_INTERFLOW_TARGET_STACK,
  MANOJOS3_OPERATION_GATEWAYS,
  automaticRouterDomain,
  capabilitiesAreInternalDrivers,
  projectIntentFlow,
  visibleInterflowDomains,
} from '../src/manojos3/interflowProjection';
import { windowsForDomain } from '../src/cockpit/windowRouter';

test('MANOJOS3 projection contains the 31 canonical semantic domains', () => {
  assert.equal(MANOJOS3_INTERFLOW_DOMAINS.length, 31);
});

test('router-action distribution matches canonical semantic matrix', () => {
  const counts = Object.fromEntries(
    ['IN_ROUTER_14','EXTEND_ROUTER','STANDALONE_NO_ROUTE','DELEGATE_SEMANTIC']
      .map((action) => [
        action,
        MANOJOS3_INTERFLOW_DOMAINS.filter((domain) => domain.routerAction === action).length,
      ]),
  );
  assert.deepEqual(counts, {
    IN_ROUTER_14: 14,
    EXTEND_ROUTER: 12,
    STANDALONE_NO_ROUTE: 4,
    DELEGATE_SEMANTIC: 1,
  });
});

test('capabilities are internal drivers, not the user-facing functional ceiling', () => {
  assert.equal(capabilitiesAreInternalDrivers(), true);
  assert.equal(MANOJOS3_OPERATION_GATEWAYS.length, 6);
  assert.equal(MANOJOS3_INTERFLOW_TARGET_STACK[0], 'Intent Router');
  assert.equal(MANOJOS3_INTERFLOW_TARGET_STACK.at(-1), 'Verifier/Receipt');
});

test('standalone domains are not automatic router domains', () => {
  const token = MANOJOS3_INTERFLOW_DOMAINS.find((domain) => domain.domain === 'token');
  const state = MANOJOS3_INTERFLOW_DOMAINS.find((domain) => domain.domain === 'state');
  assert.ok(token);
  assert.ok(state);
  assert.equal(automaticRouterDomain(token!), false);
  assert.equal(automaticRouterDomain(state!), false);
});

test('internal fixture/state domains are hidden from primary UI projection', () => {
  const visible = visibleInterflowDomains();
  assert.equal(visible.some((domain) => domain.domain === 'calendar_fixture'), false);
  assert.equal(visible.some((domain) => domain.domain === 'state'), false);
  assert.equal(visible.some((domain) => domain.domain === 'construction'), true);
});

test('generic flow projector preserves semantic layers without authority', () => {
  const projection = projectIntentFlow({
    schema:'manojos3.intent-flow.v1',
    domain:'browser',
    capability:'browser.intent.plan',
    mode:'dry_run_only',
    intent_families:['browser.open','browser.read'],
    drivers:['browser.cdp.targets','playwright.page.snapshot'],
    downstream_interflows:{repo:'repo.intent.plan'},
    output_fields:['operation_plan','risk'],
    rules:['router never executes material action'],
    acceptance:{dry_run_only:true},
  });
  assert.equal(projection.domain, 'browser');
  assert.deepEqual(projection.intentFamilies, ['browser.open','browser.read']);
  assert.deepEqual(projection.drivers, ['browser.cdp.targets','playwright.page.snapshot']);
  assert.equal(projection.authority, false);
});

test('Nostromo overview includes Interflow map before micro-capability detail', () => {
  const windows = windowsForDomain('OVERVIEW');
  assert.equal(windows.includes('INTERFLOW_MAP'), true);
  assert.equal(windows.includes('CAPABILITY_LENSES'), true);
});
