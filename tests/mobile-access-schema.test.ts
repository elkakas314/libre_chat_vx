import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  chooseRemoteAccess,
  type RemoteAccessDecision,
  type RemoteAccessSignals,
} from '../src/mobile/remoteAccess';

const schema = JSON.parse(readFileSync('contracts/mobile-access.schema.json', 'utf8')) as {
  required: string[];
  properties: {
    mode: { enum: string[] };
    requiresFreshSession: { type: string };
    materialReplayAllowed: { const: false };
    reason: { type: string; minLength: number };
  };
  additionalProperties: boolean;
};

function conforms(candidate: unknown): candidate is RemoteAccessDecision {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false;
  const value = candidate as Record<string, unknown>;
  if (schema.required.some((key) => !(key in value))) return false;
  if (schema.additionalProperties === false &&
    Object.keys(value).some((key) => !(key in schema.properties))) return false;
  return schema.properties.mode.enum.includes(value.mode as string) &&
    typeof value.requiresFreshSession === schema.properties.requiresFreshSession.type &&
    value.materialReplayAllowed === schema.properties.materialReplayAllowed.const &&
    typeof value.reason === schema.properties.reason.type &&
    (value.reason as string).length >= schema.properties.reason.minLength;
}

const blocked: RemoteAccessSignals = {
  localBackendReachable: false,
  tailnetAuthorized: false,
  tailscaleServeReachable: false,
  publicEdgeEnabled: false,
  cloudflareAccessAuthenticated: false,
  publicEdgeReachable: false,
};

test('ADR-12 schema describes only RemoteAccessDecision output, not its signals', () => {
  assert.deepEqual(schema.required,
    ['mode', 'requiresFreshSession', 'materialReplayAllowed', 'reason']);
  assert.deepEqual(schema.properties.mode.enum,
    ['LOCAL', 'TAILSCALE_PRIVATE', 'CLOUDFLARE_ACCESS_PUBLIC', 'UNAVAILABLE']);
  assert.equal(schema.properties.materialReplayAllowed.const, false);
  assert.equal(schema.additionalProperties, false);
  assert.equal('backendReachable' in schema.properties, false);
  assert.equal('authenticated' in schema.properties, false);
});

test('all four actual remote decision routes conform to schema with replay forbidden', () => {
  const cases: Array<{ signals: RemoteAccessSignals; mode: RemoteAccessDecision['mode']; fresh: boolean }> = [
    { signals: { ...blocked, localBackendReachable: true }, mode: 'LOCAL', fresh: false },
    { signals: { ...blocked, tailnetAuthorized: true, tailscaleServeReachable: true }, mode: 'TAILSCALE_PRIVATE', fresh: true },
    { signals: { ...blocked, publicEdgeEnabled: true, cloudflareAccessAuthenticated: true, publicEdgeReachable: true }, mode: 'CLOUDFLARE_ACCESS_PUBLIC', fresh: true },
    { signals: blocked, mode: 'UNAVAILABLE', fresh: true },
  ];
  for (const { signals, mode, fresh } of cases) {
    const actual = chooseRemoteAccess(signals);
    assert.equal(conforms(actual), true, mode);
    assert.equal(actual.mode, mode);
    assert.equal(actual.requiresFreshSession, fresh);
    assert.equal(actual.materialReplayAllowed, false);
    assert.ok(actual.reason.length > 0);
  }
});

test('no public route without Access identity AND an enabled, reachable edge', () => {
  const candidates: RemoteAccessSignals[] = [
    { ...blocked, publicEdgeEnabled: true, publicEdgeReachable: true },
    { ...blocked, cloudflareAccessAuthenticated: true, publicEdgeReachable: true },
    { ...blocked, publicEdgeEnabled: true, cloudflareAccessAuthenticated: true },
  ];
  for (const signals of candidates) {
    const result = chooseRemoteAccess(signals);
    assert.equal(result.mode, 'UNAVAILABLE');
    assert.equal(result.reason, 'NO_AUTHORIZED_ROUTE');
    assert.equal(conforms(result), true);
  }
});

test('private route requires authorization and reachable Serve; local has priority', () => {
  assert.equal(chooseRemoteAccess({
    ...blocked, tailscaleServeReachable: true,
  }).mode, 'UNAVAILABLE');
  assert.equal(chooseRemoteAccess({
    ...blocked, tailnetAuthorized: true,
  }).mode, 'UNAVAILABLE');
  const allEnabled: RemoteAccessSignals = {
    localBackendReachable: true, tailnetAuthorized: true,
    tailscaleServeReachable: true, publicEdgeEnabled: true,
    cloudflareAccessAuthenticated: true, publicEdgeReachable: true,
  };
  assert.equal(chooseRemoteAccess(allEnabled).mode, 'LOCAL');
  assert.equal(chooseRemoteAccess({ ...allEnabled, localBackendReachable: false }).mode, 'TAILSCALE_PRIVATE');
});

test('invalid or legacy input-signal output cannot masquerade as a valid decision', () => {
  const good = chooseRemoteAccess(blocked);
  for (const invalid of [
    null, {}, { ...good, mode: 'PUBLIC' },
    { ...good, materialReplayAllowed: true },
    { ...good, reason: '' },
    { ...good, reason: null },
    { ...good, requiresFreshSession: undefined },
    { ...good, backendReachable: false },
    { ...good, authenticated: true },
    { mode: 'LOCAL', backendReachable: true, authenticated: true },
  ]) assert.equal(conforms(invalid), false);
});
