import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {visualUpdateDisposition} from '../visual-overlay-gate.mjs';

const buf=s=>Buffer.from(s,'utf8');
test('exact original UI source can be upgraded; equal new UI is idempotent',()=>{
 const baseline=buf('old bridge'),desired=buf('new bridge');
 assert.equal(visualUpdateDisposition({installed:baseline,baseline,desired}),'READY_TO_SYNC');
 assert.equal(visualUpdateDisposition({installed:desired,baseline,desired}),'ALREADY_MATCHED');
});
test('unique dirty UI edits are preserved, not overwritten',()=>{
 assert.equal(visualUpdateDisposition({
  installed:buf('work of human editor'),baseline:buf('old bridge'),desired:buf('new bridge')
 }),'UNIQUE_LOCAL_VISUAL_CHANGES_PRESERVE');
 assert.throws(()=>visualUpdateDisposition({installed:'not Buffer',baseline:buf('x'),desired:buf('y')}));
});
test('visual sync refuses unrecognized mutation flags before touching upstream',()=>{
 const p=fileURLToPath(new URL('../reconcile-native-visual.mjs',import.meta.url));
 const r=spawnSync(process.execPath,[p,'--reset'],{
  cwd:fileURLToPath(new URL('../../',import.meta.url)),encoding:'utf8',timeout:12000});
 assert.equal(r.status,2,r.stderr);
 const data=JSON.parse(r.stdout);
 assert.equal(data.status,'VISUAL_SYNC_BLOCKED');
 assert.match(data.reason,/UNKNOWN_FLAG_REFUSED/);
 assert.equal(data.mutated,false);
});
test('native cabin connects the loaded chat to a source-only phone view',()=>{
 const p=fileURLToPath(new URL('../../overlay/upstream/VXCockpitBridge.tsx',import.meta.url));
 const source=readFileSync(p,'utf8');
 assert.match(source,/PhoneModuleView/);
 assert.match(source,/createPhoneModuleSnapshot\(undefined,\s*\[\],\s*activity\.conversationId\)/);
 assert.match(source,/SALIDAS GUARDADAS/);
 assert.doesNotMatch(source,/Qwen2\.5 3B|MCP INSTALADO · CHAT PENDIENTE/);
});
