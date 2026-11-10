import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {normalizeRequest,preview,consumeApproval,executeLocal,isSafeReadOnly} from '../policy.mjs';

test('invalid argv, cwd and resource bounds rejected',()=>{
  for(const x of [
    {argv:[],cwd:'/tmp'}, {argv:['echo\nwhoops'],cwd:'/tmp'},
    {argv:['pwd'],cwd:'relative'}, {argv:['pwd'],cwd:'/tmp',timeout_s:121},
    {argv:['pwd'],cwd:'/tmp',max_output:50000}
  ])assert.throws(()=>normalizeRequest(x));
});
test('fail closed without enabled state, roots or after path escape',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-roots-'));
 try{
  const req={argv:['pwd'],cwd:root};
  assert.equal((await preview(req,{enabled:false,roots:[root]})).status,'DISABLED');
  assert.equal((await preview(req,{enabled:true,roots:[]})).status,'DENIED');
  assert.equal((await preview({...req,cwd:'/etc'},{enabled:true,roots:[root]})).status,'DENIED');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('strict R0 classifier never accepts shell or git mutations',()=>{
 assert.equal(isSafeReadOnly(['pwd']),true);
 assert.equal(isSafeReadOnly(['git','status','--short']),true);
 assert.equal(isSafeReadOnly(['git','diff','--stat','--no-ext-diff']),true);
 assert.equal(isSafeReadOnly(['git','diff','--stat']),false);
 for(const argv of [
   ['sh','-c','rm -rf /'],['bash','-c','echo test'],
   ['git','pull'],['git','-c','core.fsmonitor=evil','status'],
   ['git','status','--porcelain','-c','alias.evil=!foo'],
   ['ls','-R','/home'],['env'],['python','-c','print(1)']
 ])assert.equal(isSafeReadOnly(argv),false,argv.join(' '));
});
test('preview SHA binds command, CWD, timeout and output limit',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-root-'));
 try{
  const config={enabled:true,roots:[root]};
  const req={argv:['pwd'],cwd:root};
  const a=await preview(req,config);
  const b=await preview({...req,argv:['git','status','--short']},config);
  assert.equal(a.status,'READY_R0');
  assert.equal(b.status,'READY_R0');
  assert.notEqual(a.requestHash,b.requestHash);
  const c=await preview({...req,argv:['/bin/sh','-c','echo hello']},config);
  assert.equal(c.status,'LOCAL_APPROVAL_REQUIRED');
  assert.equal(c.risk,'R2');
  assert.notEqual(a.requestHash,(await preview({...req,timeout_s:10},config)).requestHash);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('approval requires private directory and a single-use exact hash',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-approve-'));
 try{
  await chmodPrivate(root);
  const hash='a'.repeat(64),now=Date.now();
  const file=path.join(root,hash+'.json');
  await writeFile(file,JSON.stringify({version:1,hash,risk:'R2',expiresAt:now+30000}),{mode:0o600});
  assert.equal(await consumeApproval(root,'b'.repeat(64),now),false);
  assert.equal(await consumeApproval(root,hash,now),true);
  assert.equal(await consumeApproval(root,hash,now),false);
  const used=await stat(path.join(root,'used'));
  assert.equal((used.mode&0o077),0);
 }finally{await rm(root,{recursive:true,force:true});}
});
async function chmodPrivate(root){const {chmod}=await import('node:fs/promises'); await chmod(root,0o700);}
test('expired approval never authorizes',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-approve-'));
 try{
  await chmodPrivate(root);
  const hash='c'.repeat(64),now=Date.now();
  await writeFile(path.join(root,hash+'.json'),JSON.stringify({version:1,hash,risk:'R2',expiresAt:now-1}),{mode:0o600});
  assert.equal(await consumeApproval(root,hash,now),false);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('real local R0 subprocess returns stdout, exit code and bounded evidence',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-exec-'));
 try{
  const checked=await preview({argv:['pwd'],cwd:root},{enabled:true,roots:[root]});
  const result=await executeLocal(checked.request);
  assert.equal(result.status,'EXIT_0');
  assert.equal(result.exitCode,0);
  assert.ok(result.stdout.includes(root));
  assert.equal(result.materialVerified,false);
  assert.equal(result.truncated,false);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('nonzero result preserved without fabricated PASS',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-exec-'));
 try{
  const p=await preview({argv:['/usr/bin/false'],cwd:root},{enabled:true,roots:[root]});
  assert.equal(p.risk,'R2');
  const output=await executeLocal(p.request);
  assert.equal(output.status,'EXIT_NONZERO');
  assert.equal(output.exitCode,1);
 }finally{await rm(root,{recursive:true,force:true});}
});
