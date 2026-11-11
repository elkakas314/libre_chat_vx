import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,lstatSync,rmSync,existsSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {nostromoLayout,ensureNostromoDir,createNostromoBackupDir,LEGACY_BACKUP_NAMES} from '../nostromo-layout.mjs';
function fixture(fn){
 const home=mkdtempSync(path.join(tmpdir(),'nostromo-layout-test-'));
 try{mkdirSync(path.join(home,'librechat'));return fn(home);}
 finally{rmSync(home,{recursive:true,force:true});}
}
test('layout is under librechat, has four historical backup names and does not create on import',()=>{
 fixture(home=>{
  const d=nostromoLayout(home);
  assert.equal(d.root,path.join(home,'librechat','nostromo'));
  assert.equal(LEGACY_BACKUP_NAMES.length,4);
  assert.equal(existsSync(d.root),false);
 });
});
test('backup creation creates only owner-private directories under librechat/nostromo/backups',()=>{
 fixture(home=>{
  const p=createNostromoBackupDir('frontend-deps',{home});
  assert.ok(p.startsWith(path.join(home,'librechat','nostromo','backups')+path.sep));
  assert.equal(lstatSync(path.dirname(p)).mode&0o077,0);
  assert.equal(lstatSync(p).mode&0o077,0);
  assert.equal(existsSync(path.join(home,'nostromo-frontend-deps-backup.bad')),false);
 });
});
test('symlinked parent and unknown backup names fail closed',()=>{
 fixture(home=>{
  const d=nostromoLayout(home);
  symlinkSync(path.join(home,'librechat'),d.root,'dir');
  assert.throws(()=>createNostromoBackupDir('visual',{home}),/NOSTROMO_UNSAFE_DIRECTORY/);
  assert.throws(()=>ensureNostromoDir('other',{home}),/NOSTROMO_INVALID_LEAF/);
 });
});
