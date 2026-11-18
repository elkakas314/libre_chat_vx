import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,open,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {listScopedDirectory} from '../directory.mjs';

const settings=root=>({enabled:true,roots:[root]});
async function fixture(run){
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-directory-'));
 try{await run(root);}finally{await rm(root,{recursive:true,force:true});}
}
test('R0 directory listing is bounded and filters sensitive leaves',async()=>{
 await fixture(async root=>{
   await writeFile(path.join(root,'public.md'),'PUBLIC');
   await writeFile(path.join(root,'.env'),'SECRET');
   await writeFile(path.join(root,'token.txt'),'SECRET');
   await mkdir(path.join(root,'secrets'));
   await symlink('/etc/passwd',path.join(root,'external-link'));
   const x=await listScopedDirectory({directory:root,maxEntries:20},settings(root));
   assert.equal(x.status,'READ_OK');
   assert.equal(x.materialVerified,false);
   assert.ok(x.entries.includes('public.md'));
   assert.equal(x.entries.includes('external-link'),false);
   assert.ok(x.entries.every(name=>typeof name==='string'));
   assert.ok(!x.entries.some(y=>['.env','token.txt','secrets'].includes(y.name)));
   assert.equal(x.filteredSensitiveCount>=3,true);
   const small=await listScopedDirectory({directory:root,maxEntries:1},settings(root));
   assert.equal(small.entries.length<=1,true);
   assert.ok(small.truncated||small.entries.length<=1);
 });
});
test('R0 listing fails closed for outside, sensitive aliases and invalid limits',async()=>{
 await fixture(async root=>{
   assert.equal((await listScopedDirectory({directory:'/etc'},settings(root))).status,'DENIED');
   assert.equal((await listScopedDirectory({directory:root},{...settings(root),enabled:false})).status,'DISABLED');
   await assert.rejects(listScopedDirectory({directory:root,maxEntries:1000},settings(root)),/DIRECTORY_LIMIT_INVALID/);
   await mkdir(path.join(root,'secrets'));
   await symlink(path.join(root,'secrets'),path.join(root,'alias'),'dir');
   await assert.rejects(listScopedDirectory({directory:path.join(root,'alias')},settings(root)),/SENSITIVE_PATH_DENIED/);
 });
});
test('directory fd substitution is denied before enumeration',async()=>{
 await fixture(async root=>{
   const outside=await mkdtemp(path.join(tmpdir(),'nostromo-dir-outside-'));
   let opened=0;
   try{
    const x=await listScopedDirectory({directory:root,maxEntries:10},settings(root),{
      openDirectory:async()=>open(outside,'r'),
      openEntries:async()=>{opened++;throw Error('MUST_NOT_ENUMERATE');}
    });
    assert.equal(x.status,'DENIED');
    assert.equal(x.reason,'DIRECTORY_FD_SCOPE_MISMATCH');
    assert.equal(opened,0);
   }finally{await rm(outside,{recursive:true,force:true});}
 });
});
