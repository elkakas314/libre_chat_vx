import test from 'node:test';
import assert from 'node:assert/strict';

import {
  chooseRemoteAccess,
  publicRouteBypassesIdentityGate,
} from '../src/mobile/remoteAccess';

test('mobile route prefers local then private tailnet then public Access', () => {
  assert.equal(chooseRemoteAccess({
    localBackendReachable:true,
    tailnetAuthorized:true,
    tailscaleServeReachable:true,
    publicEdgeEnabled:true,
    cloudflareAccessAuthenticated:true,
    publicEdgeReachable:true,
  }).mode,'LOCAL');

  assert.equal(chooseRemoteAccess({
    localBackendReachable:false,
    tailnetAuthorized:true,
    tailscaleServeReachable:true,
    publicEdgeEnabled:true,
    cloudflareAccessAuthenticated:true,
    publicEdgeReachable:true,
  }).mode,'TAILSCALE_PRIVATE');

  assert.equal(chooseRemoteAccess({
    localBackendReachable:false,
    tailnetAuthorized:false,
    tailscaleServeReachable:false,
    publicEdgeEnabled:true,
    cloudflareAccessAuthenticated:true,
    publicEdgeReachable:true,
  }).mode,'CLOUDFLARE_ACCESS_PUBLIC');
});

test('public route never becomes usable without Access identity', () => {
  const signals={
    localBackendReachable:false,
    tailnetAuthorized:false,
    tailscaleServeReachable:false,
    publicEdgeEnabled:true,
    cloudflareAccessAuthenticated:false,
    publicEdgeReachable:true,
  };

  assert.equal(chooseRemoteAccess(signals).mode,'UNAVAILABLE');
  assert.equal(publicRouteBypassesIdentityGate(signals),true);
});

test('no route permits material replay', () => {
  const decision=chooseRemoteAccess({
    localBackendReachable:false,
    tailnetAuthorized:true,
    tailscaleServeReachable:true,
    publicEdgeEnabled:false,
    cloudflareAccessAuthenticated:false,
    publicEdgeReachable:false,
  });

  assert.equal(decision.materialReplayAllowed,false);
});
