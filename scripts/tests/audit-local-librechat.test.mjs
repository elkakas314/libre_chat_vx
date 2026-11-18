import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const script=path.resolve('scripts/audit-local-librechat.mjs');
function place(root,rel,data){
 const p=path.join(root,rel);mkdirSync(path.dirname(p),{recursive:true});writeFileSync(p,data);
}
test('audits exactly VX and two upstream roots; secrets are presence only, no actions',()=>{
 const home=mkdtempSync(path.join(os.tmpdir(),'nostromo-three-roots-'));
 try{
  const roots=[path.join(home,'librechat/vx'),path.join(home,'librechat/upstream'),path.join(home,'upstream')];
  for(const root of roots){
    mkdirSync(root,{recursive:true});
    place(root,'.env','DO_NOT_DISCLOSE_987654');
    place(root,'package.json','{"name":"test-local-audit","version":"0.0.0"}');
  }
  place(roots[1],'client/src/components/VX/VXCockpitBridge.tsx','bridge a');
  place(roots[2],'client/src/components/VX/VXCockpitBridge.tsx','bridge b');
  const r=spawnSync(process.execPath,[script],{
    encoding:'utf8',timeout:15000,env:{...process.env,HOME:home,GIT_OPTIONAL_LOCKS:'0'}});
  assert.equal(r.status,0,r.stderr);
  assert.equal(r.stderr,'');
  assert.doesNotMatch(r.stdout,/DO_NOT_DISCLOSE_987654/);
  const data=JSON.parse(r.stdout);
  assert.equal(data.readOnly,true);
  assert.equal(data.noSecretValuesRead,true);
  assert.equal(data.scans.vx.path,roots[0]);
  assert.equal(data.scans.internal.path,roots[1]);
  assert.equal(data.scans.external.path,roots[2]);
  assert.equal(data.scans.internal.presence['.env'],'FILE');
  assert.equal(data.comparisons.internalVsExternal.sameHead,false,
    'Git errors or missing HEADs must not compare as a valid shared commit');
  assert.ok(data.comparisons.internalVsExternal.differentOrAbsent.includes(
    'client/src/components/VX/VXCockpitBridge.tsx'));
  assert.equal(data.scans.internal.git.status.trackedChanges,null);
 }finally{rmSync(home,{recursive:true,force:true});}
});
