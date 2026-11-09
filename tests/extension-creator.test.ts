import test from 'node:test';
import assert from 'node:assert/strict';
import {proposeExtension,assertNoPathCollision,type ExtensionRequest} from '../src/extensions/extensionCreator';

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
