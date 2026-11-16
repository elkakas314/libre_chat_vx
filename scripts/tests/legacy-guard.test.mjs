import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

for(const script of ['scripts/install-as-workspace.mjs','scripts/uninstall-overlay.mjs']){
 test('legacy script remains blocked and preserves a sentinel: '+script,()=>{
  const root=mkdtempSync(path.join(tmpdir(),'nostromo-legacy-'));
  try{
   const marker=path.join(root,'UNIQUE_USER_FILE.txt');
   writeFileSync(marker,'never delete');
   const r=spawnSync(process.execPath,[path.resolve(script),root],{
      cwd:root,encoding:'utf8',timeout:10000
   });
   assert.equal(r.status,2);
   assert.match(r.stderr,/LEGACY_(INSTALL|UNINSTALL)_BLOCKED/);
   assert.equal(readFileSync(marker,'utf8'),'never delete');
  }finally{rmSync(root,{recursive:true,force:true});}
 });
}
