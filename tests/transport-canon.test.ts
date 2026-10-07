import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function load(path:string) {
  return JSON.parse(readFileSync(path,'utf8'));
}

test('transport canon has one AI gateway, seven semantic routes and no required Worker', () => {
  const config=load('config/parallel_transport.current.json');

  assert.equal(config.canonical_counts.cloudflare_ai_gateways,1);
  assert.equal(config.canonical_counts.dynamic_routes,7);
  assert.equal(config.canonical_counts.cloudflare_workers_required,0);
  assert.equal(config.canonical_counts.tailscale_serve_private_routes,1);
  assert.equal(config.canonical_counts.tailscale_funnel,0);
  assert.equal(config.inference.semantic_routes.includes('dynamic/nostromo-codigo'),false);
});

test('transport registry keeps MANOJOS3 migration deferred', () => {
  const registry=load('config/transport_registry.current.json');

  assert.equal(registry.deferred.some((entry:any)=>entry.id==='m3-transport-migration'),true);
  assert.equal(registry.resources.some((entry:any)=>entry.owner==='MANOJOS3'),false);
});

test('LLM bootstrap never fills pool with paid candidates just to reach target', () => {
  const bootstrap=load('config/llm_bootstrap.current.json');

  assert.match(
    bootstrap.bootstrap_rule,
    /never fill slots with paid or unverified/i,
  );
});
