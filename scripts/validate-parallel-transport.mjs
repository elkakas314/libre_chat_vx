import { readFileSync } from 'node:fs';

const cfg = JSON.parse(
  readFileSync(new URL('../config/parallel_transport.current.json', import.meta.url), 'utf8'),
);

function fail(message) {
  console.error('PARALLEL_TRANSPORT_FAIL ' + message);
  process.exitCode = 1;
}

if (cfg.schema !== 'libre-chat-vx.parallel-transport.v2') fail('schema');
if (cfg.authority !== false) fail('authority_must_be_false');

const inv = cfg.invariants ?? {};
for (const [name, expected] of [
  ['modify_manojos3', false],
  ['reuse_manojos3_tunnels', false],
  ['reuse_manojos3_workers', false],
  ['reuse_manojos3_hostnames', false],
  ['reuse_manojos3_ports', false],
  ['public_access_requires_identity_gate', true],
  ['ai_gateway_is_not_tunnel', true],
  ['transport_is_not_authority', true],
  ['no_public_admin_endpoint', true],
  ['no_material_retry_on_reconnect', true],
]) {
  if (inv[name] !== expected) fail('invariant:' + name);
}

if (cfg.private_remote?.kind !== 'TAILSCALE_SERVE') fail('private_remote_must_use_serve');
if (cfg.private_remote?.baseline !== true) fail('private_remote_must_be_baseline');
if (cfg.private_remote?.public_internet !== false) fail('private_remote_must_not_be_public');
if (cfg.private_remote?.funnel !== false) fail('funnel_must_be_false');
if (cfg.public_remote_optional?.kind !== 'CLOUDFLARE_TUNNEL_ACCESS') fail('public_remote_kind');
if (cfg.public_remote_optional?.access_required !== true) fail('cloudflare_access_required');
if (cfg.inference?.kind !== 'CLOUDFLARE_AI_GATEWAY') fail('inference_kind');
if (cfg.inference?.traverses_cloudflare_tunnel !== false) fail('ai_gateway_must_not_use_web_tunnel');
if (cfg.inference?.semantic_routes?.length !== 7) fail('semantic_route_count');
if (cfg.inference?.semantic_routes?.some((route) => route.includes('nostromo-codigo'))) fail('codigo_route_forbidden');
if (cfg.inference?.paid_fallback_allowed !== false) fail('paid_fallback_forbidden');
if (cfg.librechat_service?.port !== 3080) fail('librechat_port');
if (cfg.manojos3_transport_convergence?.status !== 'DEFERRED_DO_NOT_TOUCH_NOW') {
  fail('manojos3_transport_convergence_must_be_deferred');
}

const counts = cfg.canonical_counts ?? {};
if (counts.cloudflare_ai_gateways !== 1) fail('gateway_count');
if (counts.dynamic_routes !== 7) fail('dynamic_route_count');
if (counts.cloudflare_workers_required !== 0) fail('required_worker_count');
if (counts.cloudflare_workers_optional_max_without_architecture_review !== 1) fail('optional_worker_limit');
if (counts.tailscale_serve_private_routes !== 1) fail('tailscale_serve_count');
if (counts.tailscale_services_required !== 0) fail('tailscale_services_baseline');
if (counts.tailscale_funnel !== 0) fail('tailscale_funnel_count');
if (counts.openai_secure_mcp_tunnels_for_librechat !== 0) fail('secure_mcp_tunnel_count');

if ((cfg.workers?.required ?? []).length !== 0) fail('required_workers_must_be_empty');
if ((cfg.workers?.optional ?? []).length > 1) fail('too_many_optional_workers');

const reservedPorts = new Set(cfg.reserved_manojos3?.ports ?? []);
const ownedUrls = [
  cfg.private_remote?.target,
  cfg.public_remote_optional?.origin,
].filter(Boolean);

for (const value of ownedUrls) {
  const parsed = new URL(value);
  const port = Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80));
  if (reservedPorts.has(port)) fail('reserved_port_collision:' + port);
}

const forbidden = (cfg.reserved_manojos3?.resource_name_fragments ?? [])
  .map((x) => String(x).toLowerCase());
const ownedNames = [
  cfg.private_remote?.resource_alias,
  cfg.public_remote_optional?.tunnel_name,
  cfg.inference?.gateway_resource_hint,
].filter(Boolean).map((x) => String(x).toLowerCase());

for (const name of ownedNames) {
  if (forbidden.some((fragment) => name.includes(fragment))) {
    fail('reserved_name_collision:' + name);
  }
}

if (!process.exitCode) {
  console.log(JSON.stringify({
    status:'PASS',
    schema:cfg.schema,
    librechatPort:cfg.librechat_service.port,
    privateRemote:cfg.private_remote.kind,
    publicRemoteOptional:cfg.public_remote_optional.kind,
    inference:cfg.inference.kind,
    semanticRoutes:cfg.inference.semantic_routes.length,
    requiredWorkers:cfg.workers.required.length,
    manojos3TransportConvergence:cfg.manojos3_transport_convergence.status,
    authority:cfg.authority,
  }));
}
