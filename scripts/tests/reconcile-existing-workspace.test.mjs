import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,existsSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

const script=path.resolve('scripts/reconcile-existing-workspace.mjs');
function run(upstream,apply=false){
  return spawnSync(process.execPath,[script,'--upstream='+upstream,...(apply?['--apply']:[])],{
    encoding:'utf8',timeout:20000,env:{...process.env,GIT_TERMINAL_PROMPT:'0'}
  });
}
test('preflight requires the existing installation and makes no changes',()=>{
  const root=mkdtempSync(path.join(tmpdir(),'nostromo-ws-'));
  try{
    const r=run(path.join(root,'upstream'),false);
    assert.notEqual(r.status,0);
    assert.match(r.stderr,/BLOCKED:DIRECTORY_MISSING/);
    assert.equal(readdirSync(root).length,0);
  }finally{rmSync(root,{recursive:true,force:true});}
});
test('apply refuses unknown identity without moving or deleting files',()=>{
  const root=mkdtempSync(path.join(tmpdir(),'nostromo-ws-'));
  const upstream=path.join(root,'upstream');
  try{
    mkdirSync(upstream,{recursive:true});
    mkdirSync(path.join(upstream,'packages','librechat-vx'),{recursive:true});
    writeFileSync(path.join(upstream,'packages','librechat-vx','UNIQUE.txt'),'preserve');
    const r=run(upstream,true);
    assert.notEqual(r.status,0);
    assert.match(r.stderr,/BLOCKED:/);
    assert.equal(existsSync(path.join(upstream,'packages','librechat-vx','UNIQUE.txt')),true);
  }finally{rmSync(root,{recursive:true,force:true});}
});
