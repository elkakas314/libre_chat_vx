import test from 'node:test';
import assert from 'node:assert/strict';
import {proposeExtension,proposeExtensionFromTrustedCatalog,assertNoPathCollision,type ExtensionRequest} from '../src/extensions/extensionCreator';

const fixture=(patch:Partial<ExtensionRequest>={}):ExtensionRequest=>({
  kind:'SKILL',slug:'read-only-audit',title:'Read-only audit',
  goal:'Explain evidence and present unverified claims clearly',
  owner:'LIBRECHAT_VX',target:'LIBRECHAT_VX',
  catalogVerified:true,catalogEvidenceRef:'github:librechat-vx-main',
  existing:[{kind:'SKILL',slug:'nostromo-core',owner:'LIBRECHAT_VX'}],...patch,
});
test('skill proposal is not material or installed',()=>{
  const p=proposeExtension(fixture());
  assert.equal(p.state,'PREPARED');assert.equal(p.authority,false);
  assert.equal(p.installEnabled,false);
  assert.equal(p.files.length,1);assert.equal(p.files[0].path,'skills/read-only-audit/SKILL.md');
  assert.ok(p.files[0].content.includes('no target authority'));
});
test('existing registry entry reuses rather than overwrites',()=>{
  const p=proposeExtension(fixture({slug:'nostromo-core'}));
  assert.equal(p.state,'REUSE_EXISTING');assert.equal(p.files.length,0);
});
test('verified registry required and material requests cannot grant access',()=>{
  assert.equal(proposeExtension(fixture({catalogVerified:false})).state,'REJECTED');
  assert.equal(proposeExtension(fixture({wantsMaterialEffects:true})).state,'REJECTED');
});
test('paths, multiline injection and secrets are not permitted',()=>{
  for(const slug of ['../vx','system/admin','A','vx--bad','evil_a','x'.repeat(80)]){
    const p=proposeExtension(fixture({slug}));
    assert.equal(p.state,'REJECTED');
  }
  assert.equal(proposeExtension(fixture({title:'name\nmalicious'})).state,'REJECTED');
  assert.equal(proposeExtension(fixture({goal:'Use ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAA'})).state,'REJECTED');
});
test('agent blueprint deliberately has no model, secret or tools',()=>{
  const p=proposeExtension(fixture({kind:'AGENT',slug:'read-agent'}));
  const j=JSON.parse(p.files[0].content);
  assert.equal(j.model,null);assert.deepEqual(j.tools,[]);
  assert.equal(j.authority,false);assert.equal(j.createVia,'LIBRECHAT_AGENT_BUILDER');
});
test('action and MCP are drafts with no connected URL or tools',()=>{
  const action=proposeExtension(fixture({kind:'ACTION',slug:'test-action'}));
  const openapi=JSON.parse(action.files[0].content);
  assert.deepEqual(openapi.servers,[]);assert.deepEqual(openapi.paths,{});
  const mcp=proposeExtension(fixture({kind:'MCP',slug:'test-mcp'}));
  const descriptor=JSON.parse(mcp.files[0].content);
  assert.equal(descriptor.url,null);assert.deepEqual(descriptor.tools,[]);
});
test('Agent Plugin conforms to manifest schema, without hooks or auto-install',()=>{
  const p=proposeExtension(fixture({kind:'AGENT_PLUGIN',slug:'foo-plugin',target:'VX13'}));
  const paths=p.files.map(f=>f.path);
  assert.equal(paths.length,3);
  assert.ok(paths.includes('plugins/foo-plugin/plugin.json'));
  assert.equal(paths.some(path=>path.endsWith('mcp.json')||path.includes('hooks')),false);
  const manifest=JSON.parse(p.files.find(f=>f.path.endsWith('plugin.json'))!.content);
  assert.equal(manifest.$schema,'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
  assert.equal(manifest.version,'0.1.0');
});
test('same path in batch must be recognized before candidate publication',()=>{
  const plan=proposeExtension(fixture());
  assert.deepEqual(assertNoPathCollision([plan,plan]),['skills/read-only-audit/SKILL.md']);
});

test('server catalog readback binds tenant, ACL, timestamp and owner before proposing',async()=>{
  const request={kind:'SKILL' as const,slug:'fresh-read-only',title:'Fresh read-only',
    goal:'Explain verified evidence',owner:'LIBRECHAT_VX' as const,target:'LIBRECHAT_VX' as const};
  const identity={principalRef:'principal_alpha',tenantRef:'tenant_alpha',owner:'LIBRECHAT_VX'};
  const baseline={origin:'LIBRECHAT_NATIVE_CATALOG' as const,...identity,
    authenticated:true,aclVerified:true,observedAtMs:1_000_000,
    revision:'r1-verified',evidenceRef:'receipt:catalog-001',
    items:[{kind:'SKILL' as const,slug:'nostromo-core',owner:'LIBRECHAT_VX'}]};
  const reader={readCatalog:async()=>baseline};
  const ok=await proposeExtensionFromTrustedCatalog(request,identity,reader,1_100_000);
  assert.equal(ok.state,'PREPARED');
  assert.equal(ok.installEnabled,false);
  for(const patch of [{aclVerified:false},{authenticated:false},{tenantRef:'wrong'},
    {principalRef:'other'},{observedAtMs:1000},{observedAtMs:1_200_000},
    {evidenceRef:''}]){
    const result=await proposeExtensionFromTrustedCatalog(request,identity,
      {readCatalog:async()=>({...baseline,...patch})},1_100_000);
    assert.equal(result.state,'REJECTED');
  }
  assert.equal((await proposeExtensionFromTrustedCatalog(request,identity,null,1_100_000)).state,'REJECTED');
  assert.equal((await proposeExtensionFromTrustedCatalog({...request,owner:'OTHER'},identity,reader,1_100_000)).state,'REJECTED');
  const collisions=await proposeExtensionFromTrustedCatalog({...request,slug:'nostromo-core'},identity,reader,1_100_000);
  assert.equal(collisions.state,'REUSE_EXISTING');
});
