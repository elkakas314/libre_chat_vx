import { readFileSync } from 'node:fs';

const cfg = JSON.parse(readFileSync(new URL('../config/parallel_transport.current.json', import.meta.url), 'utf8'));

function fail(message) {
  console.error('PARALLEL_TRANSPORT_FAIL ' + message);
  process.exitCode = 1;
}

if (cfg.schema !== 'libre-chat-vx.parallel-transport.v1') fail('schema');
if (cfg.authority !== false) fail('authority_must_be_false');
if (cfg.invariants?.modify_manojos3 !== false) fail('manojos3_must_be_immutable');
if (cfg.invariants?.reuse_manojos3_tunnels !== false) fail('reuse_manojos3_tunnels');
if (cfg.invariants?.reuse_manojos3_workers !== false) fail('reuse_manojos3_workers');
if (cfg.invariants?.reuse_manojos3_ports !== false) fail('reuse_manojos3_ports');
if (cfg.private_web?.kind !== 'TAILSCALE_SERVE') fail('private_web_must_use_serve');
if (cfg.private_web?.funnel !== false) fail('funnel_must_be_false');
if (cfg.public_web?.kind !== 'CLOUDFLARE_TUNNEL_ACCESS') fail('public_web_kind');
if (cfg.public_web?.access_required !== true) fail('cloudflare_access_required');
if (cfg.inference?.kind !== 'CLOUDFLARE_AI_GATEWAY') fail('inference_kind');
if (cfg.inference?.traverses_cloudflare_tunnel !== false) fail('ai_gateway_must_not_use_web_tunnel');
if (cfg.target_plane?.manojos3_binding !== false) fail('manojos3_binding_must_be_false');
if (cfg.librechat_service?.port !== 3080) fail('librechat_port');

const reservedPorts = new Set(cfg.reserved_manojos3?.ports ?? []);
const ownedUrls = [
  cfg.private_web?.target,
  cfg.public_web?.origin,
].filter(Boolean);
for (const value of ownedUrls) {
  const port = Number(new URL(value).port || (value.startsWith('https:') ? 443 : 80));
  if (reservedPorts.has(port)) fail('reserved_port_collision:' + port);
}

const forbidden = (cfg.reserved_manojos3?.resource_name_fragments ?? []).map(x => String(x).toLowerCase());
const ownedNames = [
  cfg.private_web?.resource_alias,
  cfg.public_web?.tunnel_name,
  cfg.inference?.gateway_resource_hint,
].filter(Boolean).map(x => String(x).toLowerCase());
for (const name of ownedNames) {
  if (forbidden.some(fragment => name.includes(fragment))) fail('reserved_name_collision:' + name);
}

if (!process.exitCode) {
  console.log(JSON.stringify({
    status: 'PASS',
    schema: cfg.schema,
    librechatPort: cfg.librechat_service.port,
    privateWeb: cfg.private_web.kind,
    publicWeb: cfg.public_web.kind,
    inference: cfg.inference.kind,
    manojos3Binding: cfg.target_plane.manojos3_binding,
    authority: cfg.authority,
  }));
}
