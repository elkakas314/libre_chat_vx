#!/usr/bin/env node
/** Read-only N-B0 runtime preflight. It never reads .env/YAML values or starts services. */
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {lstatSync,readFileSync,statfsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const HOME=os.homedir();
const VX=path.join(HOME,'librechat','vx');
const UPSTREAM=path.join(HOME,'librechat','upstream');

export function detectAvx(arch,cpuInfo){
 if(arch!=='x64')return null;
 const flags=String(cpuInfo||'').match(/^flags\s*:\s*(.+)$/m)?.[1]||'';
 return /(?:^|\s)avx(?:\s|$)/.test(flags);
}

export function pathState(target,{home=HOME,lstat=lstatSync}={}){
 const absolute=path.resolve(target),base=path.resolve(home);
 if(absolute!==base&&!absolute.startsWith(base+path.sep))return 'OUTSIDE_HOME';
 let baseStat;
 try{baseStat=lstat(base);}catch(e){return e?.code==='ENOENT'?'ABSENT':'UNREADABLE';}
 if(baseStat.isSymbolicLink())return 'SYMLINK_BLOCKED';
 if(!baseStat.isDirectory())return 'BASE_NOT_DIRECTORY';
 let current=base;
 for(const part of path.relative(base,absolute).split(path.sep).filter(Boolean)){
  current=path.join(current,part);
  let st;
  try{st=lstat(current);}catch(e){return e?.code==='ENOENT'?'ABSENT':'UNREADABLE';}
  if(st.isSymbolicLink())return 'SYMLINK_BLOCKED';
  if(current!==absolute&&!st.isDirectory())return 'ANCESTOR_NOT_DIRECTORY';
  if(current===absolute)return st.isDirectory()?'DIRECTORY':st.isFile()?'FILE':'OTHER';
 }
 return 'DIRECTORY';
}

export function parseSystemdUnits(stdout){
 const units=[];
 for(const line of String(stdout||'').split(/\r?\n/)){
  const columns=line.trim().split(/\s+/);
  if(columns.length<4||!/(?:librechat|nostromo|vx)/i.test(columns[0]))continue;
  units.push({unit:columns[0],load:columns[1],active:columns[2],sub:columns[3]});
 }
 return units;
}

function tcpProbe(port,timeoutMs=500){
 return new Promise(resolve=>{
  const socket=net.createConnection({host:'127.0.0.1',port});
  let settled=false;
  const done=status=>{if(settled)return;settled=true;socket.destroy();resolve(status);};
  socket.setTimeout(timeoutMs,()=>done('TIMEOUT'));
  socket.once('connect',()=>done('TCP_CONNECTED_PROTOCOL_UNVERIFIED'));
  socket.once('error',e=>done(e?.code==='ECONNREFUSED'?'REFUSED':'UNAVAILABLE'));
 });
}

function commandRead(command,args,timeout=3000){
 const r=spawnSync(command,args,{encoding:'utf8',timeout,maxBuffer:256*1024,
  stdio:['ignore','pipe','ignore'],env:{PATH:process.env.PATH||'/usr/bin:/bin',LANG:'C'}});
 return r.error||r.status!==0?null:String(r.stdout||'').trim();
}

function safeVersion(raw){return /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(raw||'')?raw:null;}

export async function collectBackendPreflight({
 home=HOME,arch=os.arch(),platform=os.platform(),nodeVersion=process.version,
 cpuList=os.cpus(),memory={total:os.totalmem(),free:os.freemem()},
 readText=p=>readFileSync(p,'utf8'),lstat=lstatSync,statfs=statfsSync,
 run=commandRead,probe=tcpProbe,now=()=>new Date().toISOString()
}={}){
 const vx=path.join(home,'librechat','vx'),up=path.join(home,'librechat','upstream');
 const states={
  vx:pathState(vx,{home,lstat}),upstream:pathState(up,{home,lstat}),
  upstreamPackage:pathState(path.join(up,'package.json'),{home,lstat}),
  envPresence:pathState(path.join(up,'.env'),{home,lstat}),
  yamlPresence:pathState(path.join(up,'librechat.yaml'),{home,lstat}),
  composePresence:pathState(path.join(up,'docker-compose.yml'),{home,lstat}),
  nodeModules:pathState(path.join(up,'node_modules'),{home,lstat}),
 };
 let cpuInfo='';try{cpuInfo=readText('/proc/cpuinfo');}catch{}
 let disk=null;
 if(states.upstream==='DIRECTORY')try{
  const s=statfs(up);disk={totalBytes:s.blocks*s.bsize,availableBytes:s.bavail*s.bsize};
 }catch{}
 const unitText=run('systemctl',['--user','list-units','--all','--type=service','--no-legend','--no-pager']);
 const [mongo,librechat]=await Promise.all([probe(27017),probe(3080)]);
 return {
  schema:'nostromo.backend-preflight.v1',observedAt:now(),readOnly:true,
  secretValuesRead:false,servicesStarted:false,
  runtime:{nodeVersion, npmVersion:safeVersion(run('npm',['--version'])),platform,arch},
  cpu:{model:cpuList[0]?.model||null,avx:detectAvx(arch,cpuInfo),
   mongoAvxRequirementRelevant:arch==='x64'},
  resources:{memoryTotalBytes:memory.total,memoryFreeBytes:memory.free,disk},
  paths:states,
  listeners:{mongo27017:await mongo,librechat3080:await librechat,
   probeMeaning:'TCP only; does not verify Mongo protocol, LibreChat health, identity or authentication'},
  userServices:{status:unitText===null?'UNAVAILABLE':'READ_OK',
   matchingUnits:unitText===null?[]:parseSystemdUnits(unitText)},
  acceptance:'PRECHECK_ONLY_NOT_INSTALLATION_OR_LIVE_VERIFICATION',
 };
}

if(process.argv[1]&&path.resolve(process.argv[1])===new URL(import.meta.url).pathname){
 const result=await collectBackendPreflight();
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
