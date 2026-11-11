import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync,existsSync,lstatSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {auditLegacyLayout,relocateLegacyLayout} from '../nostromo-layout-relocate.mjs';
import {LEGACY_BACKUP_NAMES} from '../nostromo-layout.mjs';
function fixture(fn){
 const home=mkdtempSync(path.join(tmpdir(),'nostromo-migration-fixture-'));
 try{mkdirSync(path.join(home,'librechat'));return fn(home);}
 finally{rmSync(home,{recursive:true,force:true});}
}
test('legacy layout preview reads paths without writing or moving',()=>fixture(home=>{
 const name=LEGACY_BACKUP_NAMES[0],p=path.join(home,name);
 mkdirSync(p);writeFileSync(path.join(p,'unique.txt'),'important');
 const r=auditLegacyLayout(home);
 assert.equal(r.allow,true);assert.equal(r.moves[0].status,'READY_TO_MOVE');
 assert.equal(existsSync(path.join(home,'librechat','nostromo')),false);
 assert.equal(readFileSync(path.join(p,'unique.txt'),'utf8'),'important');
}));
test('apply moves four existing backups under private root without deleting content',()=>fixture(home=>{
 for(const name of LEGACY_BACKUP_NAMES){
  mkdirSync(path.join(home,name));writeFileSync(path.join(home,name,'keep.txt'),name);
 }
 const r=relocateLegacyLayout({home,apply:true});
 assert.equal(r.status,'RELOCATED_VERIFIED',JSON.stringify(r));
 for(const name of LEGACY_BACKUP_NAMES){
  const dst=path.join(home,'librechat','nostromo','backups',name,'keep.txt');
  assert.equal(readFileSync(dst,'utf8'),name);
  assert.equal(existsSync(path.join(home,name)),false);
 }
 const names=['worktrees','tools','backups','runtime','reports','handoffs','manifests','staging','cache','tmp','legacy'];
 for(const name of names){
  const dir=path.join(home,'librechat','nostromo',name);
  assert.equal(lstatSync(dir).isDirectory(),true,name);
  assert.equal(lstatSync(dir).mode&0o077,0,name);
 }
 assert.equal(relocateLegacyLayout({home,apply:true}).status,'ALREADY_RELOCATED_OR_NOT_PRESENT');
}));
test('symlinked backup is refused and no real backup is moved',()=>fixture(home=>{
 const one=LEGACY_BACKUP_NAMES[0],two=LEGACY_BACKUP_NAMES[1];
 mkdirSync(path.join(home,one));symlinkSync(path.join(home,one),path.join(home,two),'dir');
 const r=relocateLegacyLayout({home,apply:true});
 assert.equal(r.status,'MIGRATION_BLOCKED');
 assert.equal(existsSync(path.join(home,one)),true);
 assert.equal(existsSync(path.join(home,'librechat','nostromo')),false);
}));
