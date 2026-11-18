import test from 'node:test';
import assert from 'node:assert/strict';
import {detectAvx,pathState,parseSystemdUnits,collectBackendPreflight} from '../nostromo-backend-preflight.mjs';

test('AVX detection is precise and architecture aware',()=>{
 assert.equal(detectAvx('x64','flags : fpu sse avx avx2\n'),true);
 assert.equal(detectAvx('x64','flags : fpu sse avx2\n'),false);
 assert.equal(detectAvx('arm64','Features : neon\n'),null);
});

test('path presence walker refuses symlinks and paths outside the selected home',()=>{
 const home='/fixture/home';
 const entries=new Map([[home,{isDirectory:()=>true,isSymbolicLink:()=>false}],
  ['/fixture/home/librechat',{isDirectory:()=>true,isSymbolicLink:()=>false}],
  ['/fixture/home/librechat/upstream',{isDirectory:()=>true,isSymbolicLink:()=>false}],
  ['/fixture/home/librechat/upstream/.env',{isDirectory:()=>false,isFile:()=>true,isSymbolicLink:()=>false}],
  ['/fixture/home/librechat/vx',{isDirectory:()=>false,isFile:()=>false,isSymbolicLink:()=>true}]]);
 const lstat=p=>{if(!entries.has(p))throw Object.assign(Error('missing'),{code:'ENOENT'});return entries.get(p);};
 assert.equal(pathState('/fixture/home/librechat/upstream/.env',{home,lstat}),'FILE');
 const symlinkHome='/fixture/linked-home';
 assert.equal(pathState(symlinkHome,{home:symlinkHome,lstat:()=>({isDirectory:()=>false,isSymbolicLink:()=>true})}),'SYMLINK_BLOCKED');
 assert.equal(pathState('/fixture/home/librechat/vx',{home,lstat}),'SYMLINK_BLOCKED');
 assert.equal(pathState('/etc/passwd',{home,lstat}),'OUTSIDE_HOME');
 assert.equal(pathState('/fixture/home/librechat/upstream/librechat.yaml',{home,lstat}),'ABSENT');
});

test('systemd parser returns only matching unit identity and state columns',()=>{
 const units=parseSystemdUnits('librechat-vx.service loaded active running private description\nssh.service loaded active running OpenSSH\n');
 assert.deepEqual(units,[{unit:'librechat-vx.service',load:'loaded',active:'active',sub:'running'}]);
});

test('backend preflight is read-only, redacts secret values, and labels TCP limits',async()=>{
 const home='/fixture/home';
 const dirs=new Set([home,home+'/librechat',home+'/librechat/upstream']);
 const files=new Set([home+'/librechat/vx',home+'/librechat/upstream/package.json',home+'/librechat/upstream/.env']);
 const lstat=p=>{
  if(dirs.has(p))return {isDirectory:()=>true,isFile:()=>false,isSymbolicLink:()=>false};
  if(files.has(p))return {isDirectory:()=>false,isFile:()=>true,isSymbolicLink:()=>false};
  throw Object.assign(Error('missing'),{code:'ENOENT'});
 };
 let secretRead=false;
 const result=await collectBackendPreflight({home,arch:'x64',platform:'linux',nodeVersion:'v24.16.0',
  cpuList:[{model:'Test CPU'}],memory:{total:8000,free:3000},
  readText:p=>{assert.equal(p,'/proc/cpuinfo');return 'flags : sse avx\n';},lstat,
  statfs:()=>({blocks:100,bavail:50,bsize:4096}),
  run:(cmd,args)=>cmd==='npm'?'11.13.0':cmd==='systemctl'?'librechat.service loaded active running ignored description\n':null,
  probe:async port=>port===27017?'REFUSED':'TCP_CONNECTED_PROTOCOL_UNVERIFIED',
  now:()=> '2026-11-11T00:00:00.000Z'});
 assert.equal(secretRead,false);
 assert.equal(result.readOnly,true);assert.equal(result.secretValuesRead,false);
 assert.equal(result.servicesStarted,false);assert.equal(result.cpu.avx,true);
 assert.equal(result.paths.envPresence,'FILE');
 assert.equal(result.listeners.mongo27017,'REFUSED');
 assert.equal(result.listeners.librechat3080,'TCP_CONNECTED_PROTOCOL_UNVERIFIED');
 assert.match(result.listeners.probeMeaning,/does not verify Mongo protocol/);
 assert.equal(result.userServices.matchingUnits[0].unit,'librechat.service');
 assert.equal(JSON.stringify(result).includes('SECRET'),false);
});
