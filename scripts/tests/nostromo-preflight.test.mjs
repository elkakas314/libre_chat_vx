import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';

const script=resolve('scripts/nostromo-preflight.mjs');
function run(base,upstream){
 return spawnSync(process.execPath,[script,'--base='+base,'--extra-upstream='+upstream],{
  encoding:'utf8',timeout:20000,env:{...process.env,GIT_TERMINAL_PROMPT:'0'}});
}
function git(cwd,...args){
 return execFileSync('git',['-C',cwd,...args],{encoding:'utf8'}).trim();
}
test('R0 preflight recognizes missing roots without creating them',()=>{
 const base=join(tmpdir(),'nostromo-missing-'+process.pid);
 const r=run(base,join(base,'sibling'));
 assert.equal(r.status,0,r.stderr);
 const x=JSON.parse(r.stdout);
 assert.equal(x.readOnly,true);
 assert.equal(x.mutations,0);
 assert.equal(x.repositories.length,3);
 assert.ok(x.repositories.every(z=>!z.present));
 assert.equal(x.safeToBlindlyUpdate,false);
});
test('R0 preflight reports tracked and untracked work without modifying either',()=>{
 const base=mkdtempSync(join(tmpdir(),'nostromo-preflight-'));
 const vx=join(base,'vx'),upstream=join(base,'upstream'),outside=join(base,'other');
 try {
  mkdirSync(vx);mkdirSync(upstream);mkdirSync(outside);
  git(vx,'init','-q');
  writeFileSync(join(vx,'tracked.txt'),'v1\n');
  git(vx,'add','tracked.txt');
  execFileSync('git',['-C',vx,'-c','user.name=Tester','-c','user.email=test@example.invalid','commit','-qm','fixture']);
  writeFileSync(join(vx,'tracked.txt'),'changed\n');
  writeFileSync(join(vx,'package-lock.json'),'untracked\n');
  const before=git(vx,'status','--porcelain');
  const r=run(base,outside);
  assert.equal(r.status,0,r.stderr);
  const x=JSON.parse(r.stdout);
  assert.equal(x.repositories[0].git,true);
  assert.equal(x.repositories[0].worktreeDirty,'DIRTY');
  assert.equal(x.repositories[0].trackedChangeCount,1);
  assert.equal(x.repositories[0].untrackedCount,1);
  assert.equal(x.repositories[1].git,false);
  assert.equal(x.safeToBlindlyUpdate,false);
  assert.equal(x.safeToMoveOrDelete,false);
  assert.equal(git(vx,'status','--porcelain'),before);
 }finally {rmSync(base,{recursive:true,force:true});}
});
test('R0 preflight help does not touch any directory',()=>{
 const r=spawnSync(process.execPath,[script,'--help'],{encoding:'utf8'});
 assert.equal(r.status,0);
 assert.match(r.stdout,/--base=/);
});
