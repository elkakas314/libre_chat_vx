import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const script=path.resolve('scripts/audit-local-three-trees.mjs');
function file(root,rel,content){
  const abs=path.join(root,rel);
  mkdirSync(path.dirname(abs),{recursive:true});
  writeFileSync(abs,content);
}
test('three-tree audit uses fixed HOME roots, reads metadata and never exposes .env',()=>{
  const home=mkdtempSync(path.join(os.tmpdir(),'nostromo-roots-audit-'));
  try{
    const vx=path.join(home,'librechat/vx'),active=path.join(home,'librechat/upstream'),
      other=path.join(home,'upstream');
    for(const root of [vx,active,other]){
      mkdirSync(root,{recursive:true});
      file(root,'package.json',JSON.stringify({name:'fixture',version:'0.0.0'}));
      file(root,'.env','FAKE_PRIVATE_TOKEN_NEVER_PRINT=do_not_print_12345');
    }
    file(vx,'overlay/upstream/VXCockpitBridge.tsx','mock bridge');
    file(active,'client/src/components/VX/VXCockpitBridge.tsx','mock bridge');
    file(vx,'overlay/upstream/VXCockpit.css','mock css');
    file(active,'client/src/components/VX/VXCockpit.css','different css');
    const result=spawnSync(process.execPath,[script],{
      encoding:'utf8',timeout:10000,env:{...process.env,HOME:home}});
    assert.equal(result.status,0,result.stderr);
    assert.equal(result.stderr,'');
    assert.equal(result.stdout.includes('do_not_print_12345'),false);
    const data=JSON.parse(result.stdout);
    assert.equal(data.schema,'nostromo.lenovo-local-three-roots-audit.v1');
    assert.equal(data.readOnly,true);
    assert.equal(data.roots.nostromo.path,vx);
    assert.equal(data.roots.librechat_active.path,active);
    assert.equal(data.roots.librechat_alternate.path,other);
    assert.equal(data.roots.librechat_active.presence['.env'],'FILE');
    assert.equal(data.roots.librechat_alternate.presence['.env'],'FILE');
    assert.equal(data.codeComparison.vxUiMatchesActive['VXCockpitBridge.tsx'],'MATCH');
    assert.equal(data.codeComparison.vxUiMatchesActive['VXCockpit.css'],'DIFFERENT');
    assert.equal(data.roots.nostromo.git.status,'NOT_REPO_OR_UNAVAILABLE');
  }finally{rmSync(home,{recursive:true,force:true});}
});
