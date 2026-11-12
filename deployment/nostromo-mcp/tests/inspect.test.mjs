import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm,open,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {readScopedText,readHostMetrics,readGitSnapshot,openedHandleMatchesExactPath} from '../inspect.mjs';

function settings(root){return {enabled:true,roots:[root]};}
async function fixture(fn){
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-inspect-'));
 try{return await fn(root);}finally{await rm(root,{recursive:true,force:true});}
}
test('scoped text read returns bounded excerpt and SHA; blocks secrets and escape',async()=>{
 await fixture(async root=>{
  const file=path.join(root,'README.md');
  await writeFile(file,'NOSTROMO allowed text\n');
  const view=await readScopedText({file},settings(root));
  assert.equal(view.status,'READ_OK');
  assert.equal(view.text,'NOSTROMO allowed text\n');
  assert.equal(view.excerptSha256.length,64);
  assert.equal(view.materialVerified,false);
  await writeFile(path.join(root,'.env'),'SUPERSECRET=1\n');
  await assert.rejects(readScopedText({file:path.join(root,'.env')},settings(root)),/SENSITIVE_PATH_DENIED/);
  const tok=path.join(root,'test.txt');
  await writeFile(tok,'github_pat_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');
  assert.equal((await readScopedText({file:tok},settings(root))).reason,'BINARY_OR_SECRET_CONTENT');
  await assert.rejects(readScopedText({file, maxBytes:17000},settings(root)),/FILE_READ_LIMIT_INVALID/);
  assert.equal((await readScopedText({file:path.join(tmpdir(),'outside.md')},settings(root))).status,'DENIED');
  // With no extension, an outside path is still denied by boundary first.
  // This protects the real stdio handshake contract even on Node 22/24.
  const outsideNoExt=await readScopedText({file:'/etc/hosts'},settings(root));
  assert.equal(outsideNoExt.status,'DENIED');
  assert.equal(outsideNoExt.reason,'FILE_OUTSIDE_ALLOWED_ROOTS');
  const inScopeNoExt=path.join(root,'README');
  await writeFile(inScopeNoExt,'safe but not allowlisted by extension');
  await assert.rejects(readScopedText({file:inScopeNoExt},settings(root)),/FILE_TYPE_DENIED/);
  const link=path.join(root,'redirect.md');
  await symlink('/etc/hosts',link);
  assert.equal((await readScopedText({file:link},settings(root))).status,'DENIED');
 });
});
test('M3 refuses benign filenames below secret-named ancestor directories',async()=>{
 await fixture(async root=>{
  const secretDir=path.join(root,'tokens');
  await mkdir(secretDir);
  const file=path.join(secretDir,'notes.md');
  await writeFile(file,'SENSITIVE_DATA_MUST_NEVER_BE_OPENED');
  await assert.rejects(
    readScopedText({file,maxBytes:256},settings(root)),
    /SENSITIVE_PATH_DENIED/
  );
 });
});

test('M3 validates opened descriptor identity, not only pathname preflight',async()=>{
 await fixture(async root=>{
  const safe=path.join(root,'safe.md');
  await writeFile(safe,'ALLOWED');
  const outside=path.join(tmpdir(),'nostromo-outside-fd-'+process.pid+'.txt');
  await writeFile(outside,'EXTERNAL_SHOULD_NOT_BE_READ');
  const allowed=await open(safe,'r');
  const disallowed=await open(outside,'r');
  try{
   assert.equal(await openedHandleMatchesExactPath(allowed,safe),true);
   assert.equal(await openedHandleMatchesExactPath(disallowed,safe),false);
  }finally{
   await allowed.close();
   await disallowed.close();
   await rm(outside,{force:true});
  }
 });
});

test('system metrics return observed load, memory, disk; no fake VRAM proof',async()=>{
 await fixture(async root=>{
  const info=await readHostMetrics({cwd:root},settings(root));
  assert.equal(info.status,'READ_OK');
  assert.ok(info.cpuThreads>0);
  assert.ok(info.memoryTotalBytes>0);
  assert.ok(info.diskTotalBytes>0);
  assert.equal(info.gpuVramBytesVerified,null);
  assert.equal(info.gpuMockIsHardwareProof,false);
  assert.equal((await readHostMetrics({cwd:'/etc'},settings(root))).status,'DENIED');
  assert.equal((await readHostMetrics({cwd:root},{...settings(root),enabled:false})).status,'DISABLED');
 });
});
test('git inspector performs only bounded R0 read commands and captures dirty status',async()=>{
 await fixture(async root=>{
  function git(...args){return execFileSync('git',['-C',root,...args],{encoding:'utf8'});}
  git('init','-q');
  await writeFile(path.join(root,'tracked.txt'),'v1\n');
  git('add','tracked.txt');
  git('-c','user.name=CI','-c','user.email=ci@example.invalid','commit','-qm','fixture');
  await writeFile(path.join(root,'tracked.txt'),'v2\n');
  const snap=await readGitSnapshot({cwd:root},settings(root));
  assert.equal(snap.status,'READ_OK',JSON.stringify(snap));
  assert.equal(snap.commands['rev-parse'].stdout.trim().length,40);
  assert.match(snap.commands.status.stdout,/tracked.txt/);
  assert.match(snap.commands.diff.stdout,/tracked.txt/);
  assert.equal(snap.materialVerified,false);
  assert.equal((await readGitSnapshot({cwd:'/etc'},settings(root))).status,'DENIED');
 });
});
