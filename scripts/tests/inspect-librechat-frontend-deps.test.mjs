import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';

const inspector=fileURLToPath(new URL('../inspect-librechat-frontend-deps.mjs',import.meta.url));
test('frontend dependency inspector is R0, identifies missing bins and never reads secrets',()=>{
  const root=mkdtempSync(path.join(os.tmpdir(),'nostromo-frontend-check-'));
  const write=(relative,text)=>{
    const p=path.join(root,relative);
    mkdirSync(path.dirname(p),{recursive:true});
    writeFileSync(p,text);
  };
  try{
    write('package.json',JSON.stringify({name:'LibreChat',packageManager:'npm@11.13.0'}));
    write('packages/data-provider/package.json',JSON.stringify({
      name:'librechat-data-provider',devDependencies:{rimraf:'^6.1.3',tsdown:'^0.22.2'}
    }));
    write('package-lock.json','{"name":"fixture"}');
    write('.env','PRIVATE_SECRET_MUST_NOT_PRINT=hello');
    const res=spawnSync(process.execPath,[inspector,'--upstream='+root],
      {encoding:'utf8',timeout:10000});
    assert.equal(res.status,2);
    assert.equal(res.stderr,'');
    assert.ok(!res.stdout.includes('hello'));
    const doc=JSON.parse(res.stdout);
    assert.equal(doc.readOnly,true);
    assert.equal(doc.mutations,0);
    assert.equal(doc.networkRequests,0);
    assert.equal(doc.identityMatched,false);
    assert.equal(doc.status,'UPSTREAM_IDENTITY_MISMATCH');
    assert.equal(doc.lockfile.present,true);
    assert.ok(doc.missingBins.includes('rimraf'));
    assert.equal(doc.dataProvider.declaredRimraf,'^6.1.3');
  }finally{rmSync(root,{recursive:true,force:true});}
});
