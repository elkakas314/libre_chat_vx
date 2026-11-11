import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('../audit-nostromo-mobile-readiness.mjs',import.meta.url));
function fixture(fn){const p=mkdtempSync(path.join(tmpdir(),'nostromo-mobile-test-'));
 try{return fn(p);}finally{rmSync(p,{recursive:true,force:true});}}
const inspect=p=>spawnSync(process.execPath,[script,'--upstream='+p],{encoding:'utf8',timeout:15000});
test('absent PWA build is never claimed installed',()=>fixture(p=>{
 const x=inspect(p);assert.equal(x.status,0,x.stderr);
 const v=JSON.parse(x.stdout);
 assert.equal(v.status,'PWA_BUILD_INCOMPLETE');assert.equal(v.readOnly,true);
 assert.equal(v.mobileE2EVerified,false);
}));
test('built PWA remains separate from live backend/auth/mobile canaries',()=>fixture(p=>{
 const dist=path.join(p,'client','dist');mkdirSync(dist,{recursive:true});
 writeFileSync(path.join(dist,'index.html'),'fixture');
 writeFileSync(path.join(dist,'sw.js'),'fixture');
 writeFileSync(path.join(dist,'manifest.webmanifest'),
  JSON.stringify({name:'NOSTROMO',display:'standalone',icons:[{src:'/icon.png'}]}));
 const x=inspect(p);assert.equal(x.status,0,x.stderr);
 const v=JSON.parse(x.stdout);
 assert.equal(v.status,'PWA_BUILD_PRESENT_NOT_INSTALLED');
 assert.equal(v.backendLiveVerified,false);
 assert.equal(v.mobileAuthenticated,false);
 assert.equal(v.tailscaleServeVerified,false);
}));
