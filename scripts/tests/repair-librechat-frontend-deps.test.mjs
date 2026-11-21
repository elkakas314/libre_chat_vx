import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,mkdirSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const tool=fileURLToPath(new URL('../repair-librechat-frontend-deps.mjs',import.meta.url));
test('read-only preview on wrong Git identity refuses without exposing secret',()=>{
 const root=mkdtempSync(path.join(os.tmpdir(),'nostromo-deps-repair-'));
 try{
  mkdirSync(path.join(root,'client'),{recursive:true});
  mkdirSync(path.join(root,'packages','data-provider'),{recursive:true});
  for(const name of ['package.json','package-lock.json','client/package.json',
    'packages/data-provider/package.json'])
    writeFileSync(path.join(root,name),'{"name":"fixture"}');
  writeFileSync(path.join(root,'.env'),'PRIVATE_TOKEN_NEVER_PRINT=secret_123');
  const before=readFileSync(path.join(root,'package-lock.json'),'utf8');
  const res=spawnSync(process.execPath,[tool,'--upstream='+root],{
    encoding:'utf8',timeout:15000});
  assert.equal(res.status,2);
  assert.equal(res.stderr,'');
  assert.equal(res.stdout.includes('secret_123'),false);
  const doc=JSON.parse(res.stdout);
  assert.equal(doc.status,'UPSTREAM_HEAD_MISMATCH');
  assert.equal(doc.mode,'PREVIEW');
  assert.equal(readFileSync(path.join(root,'package-lock.json'),'utf8'),before);
  const applied=spawnSync(process.execPath,[tool,'--apply','--upstream='+root],{
    encoding:'utf8',timeout:15000});
  assert.equal(applied.status,2);
  assert.equal(JSON.parse(applied.stdout).status,'APPLY_ONLY_ALLOWED_ON_CANONICAL_CHECKOUT');
  assert.equal(readFileSync(path.join(root,'package-lock.json'),'utf8'),before);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('help does not inspect host or invoke npm',()=>{
 const res=spawnSync(process.execPath,[tool,'--help'],{encoding:'utf8',timeout:15000});
 assert.equal(res.status,0);
 assert.match(res.stdout,/--apply/);
 assert.equal(res.stderr,'');
});
