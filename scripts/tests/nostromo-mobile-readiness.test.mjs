import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('../audit-nostromo-mobile-readiness.mjs',import.meta.url));
const mobileCurrent=JSON.parse(readFileSync(new URL('../../config/nostromo_mobile_legacy.current.json',import.meta.url),'utf8'));
function fixture(fn){const p=mkdtempSync(path.join(tmpdir(),'nostromo-mobile-test-'));
 try{return fn(p);}finally{rmSync(p,{recursive:true,force:true});}}
const inspect=p=>spawnSync(process.execPath,[script,'--upstream='+p],{encoding:'utf8',timeout:15000});
test('Switchboard native base matches pinned LibreChat core but not the VX overlay',()=>{
 const client=mobileCurrent.realNativeClient;
 assert.equal(client.architecture,'KOTLIN_MULTIPLATFORM_COMPOSE_NATIVE_IOS');
 assert.equal(client.license,'Apache-2.0');
 assert.equal(client.localPinnedLibreChatVersion,'v0.8.8');
 assert.equal(client.coreVersionInTestedRange,true);
 assert.equal(client.customVXApiAndHud,'NOT_VERIFIED');
 assert.equal(client.reusableAsNativeBase,true);
 assert.equal(client.installed,false);
});
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

test('symlinked client parent does not read external manifest or report a PWA',()=>fixture(p=>{
 const outside=path.join(p,'external-tree','dist');mkdirSync(outside,{recursive:true});
 for(const name of ['index.html','sw.js'])writeFileSync(path.join(outside,name),'fixture');
 const marker='DO_NOT_READ_EXTERNAL_MANIFEST';
 const mf=path.join(outside,'manifest.webmanifest');
 writeFileSync(mf,JSON.stringify({name:marker,icons:[{src:'/icon.png'}]}));
 symlinkSync(path.join(p,'external-tree'),path.join(p,'client'),'dir');
 const before=readFileSync(mf,'utf8');
 const x=inspect(p);assert.equal(x.status,0,x.stderr);
 const v=JSON.parse(x.stdout);
 assert.equal(v.status,'PWA_BUILD_INCOMPLETE');
 assert.equal(v.pwa.pathScopeSafe,false);
 assert.equal(v.pwa.manifestSummary,null);
 assert.equal(v.pwa.manifest,false);
 assert.equal(v.readOnly,true);assert.equal(v.mutations,0);
 assert.equal(readFileSync(mf,'utf8'),before);
 assert.equal(x.stdout.includes(marker),false);
}));

test('symlinked dist/root and a manifest symlink all fail closed',()=>fixture(p=>{
 const outside=path.join(p,'outside');mkdirSync(outside);
 for(const name of ['index.html','sw.js'])writeFileSync(path.join(outside,name),'fixture');
 const mf=path.join(outside,'manifest.webmanifest');
 writeFileSync(mf,JSON.stringify({name:'EXTERNAL_MARKER',icons:[{}]}));
 const client=path.join(p,'client');mkdirSync(client);
 symlinkSync(outside,path.join(client,'dist'),'dir');
 let result=JSON.parse(inspect(p).stdout);
 assert.equal(result.pwa.pathScopeSafe,false);
 assert.equal(result.pwa.compiled,false);
 rmSync(path.join(client,'dist'));
 mkdirSync(path.join(client,'dist'));
 for(const name of ['index.html','sw.js'])writeFileSync(path.join(client,'dist',name),'fixture');
 symlinkSync(mf,path.join(client,'dist','manifest.webmanifest'));
 result=JSON.parse(inspect(p).stdout);
 assert.equal(result.pwa.pathScopeSafe,true);
 assert.equal(result.pwa.manifest,false);
 assert.equal(result.pwa.manifestSummary,null);
 const rootlink=path.join(p,'alias');symlinkSync(client,rootlink,'dir');
 result=JSON.parse(inspect(rootlink).stdout);
 assert.equal(result.pwa.pathScopeSafe,false);
 assert.equal(result.pwa.compiled,false);
 assert.equal(readFileSync(mf,'utf8').includes('EXTERNAL_MARKER'),true);
}));
