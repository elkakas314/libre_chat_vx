#!/usr/bin/env node
/** NOSTROMO: three exact local trees, metadata-only R0 audit. No network,
 * no package install, no secret contents, no filesystem writes or git fetch.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const home=os.homedir();
const roots={
  nostromo:path.join(home,'librechat/vx'),
  librechat_active:path.join(home,'librechat/upstream'),
  librechat_alternate:path.join(home,'upstream')
};
const checks=[
  'package.json','client/package.json','client/src/components/Chat/Presentation.tsx',
  'client/src/components/VX/VXCockpitBridge.tsx',
  'client/src/components/VX/VXCockpit.css',
  'packages/librechat-vx/package.json','packages/librechat-vx/src/index.ts',
  'packages/librechat-vx/dist/src/index.js','node_modules/.bin/tsc',
  '.librechat-vx-overlay.json','.env','librechat.yaml',
  'client/dist','client/node_modules','node_modules'
];
function kind(abs){
  try{const s=fs.lstatSync(abs);
    return s.isSymbolicLink()?'SYMLINK':s.isDirectory()?'DIR':s.isFile()?'FILE':'OTHER';
  }catch(e){return e?.code==='ENOENT'?'MISSING':'INACCESSIBLE';}
}
function run(cmd,args,opts={}){
  try{return execFileSync(cmd,args,{encoding:'utf8',stdio:['ignore','pipe','ignore'],
    timeout:10000,maxBuffer:1048576,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'},...opts}).trim();}
  catch{return null;}
}
function redactedStatus(line){
  if(/(?:\.env|token|secret|credential|password|private[-_.]?key)/i.test(line))
    return line.slice(0,2)+' [SENSITIVE_PATH_REDACTED]';
  return line.slice(0,300);
}
function manifest(abs){
  if(kind(abs)!=='FILE')return null;
  try{const obj=JSON.parse(fs.readFileSync(abs,'utf8'));
    return {name:obj.name??null,version:obj.version??null,
      reactTypes:obj.devDependencies?.['@types/react']??obj.dependencies?.['@types/react']??null};
  }catch{return {parse:'UNAVAILABLE'};}
}
function fingerprint(abs){
  if(kind(abs)!=='FILE')return null;
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}
function git(root){
  const head=run('git',['-C',root,'rev-parse','HEAD']);
  if(!head)return {status:'NOT_REPO_OR_UNAVAILABLE'};
  const status=run('git',['-C',root,'status','--porcelain=v1','--untracked-files=normal']);
  const lines=status?status.split('\n').filter(Boolean):[];
  return {head,dirtyCount:status===null?null:lines.length,
    entries:lines.slice(0,40).map(redactedStatus),
    truncated:lines.length>40};
}
function filesCount(base){
  const count=(dir,depth=0)=>{
    if(depth>8)return 0;
    let entries;
    try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch{return 0;}
    let n=0;
    for(const e of entries){
      if(e.isSymbolicLink())continue;
      if(e.isDirectory()){
        if(['node_modules','.git','dist','.cache','build'].includes(e.name))continue;
        n+=count(path.join(dir,e.name),depth+1);
      }else if(e.isFile())n++;
    }
    return n;
  };
  return kind(base)==='DIR'?count(base):null;
}
const data={schema:'nostromo.lenovo-local-three-roots-audit.v1',
  readOnly:true,observedAt:new Date().toISOString(),source:'LENOVO_LOCAL_NODE',
  excludes:'NO_SECRET_CONTENT_NO_GIT_NETWORK_NO_WRITES_NO_INSTALL',
  roots:{}};
for(const [name,root] of Object.entries(roots)){
  const presence=Object.fromEntries(checks.map(k=>[k,kind(path.join(root,k))]));
  data.roots[name]={path:root,kind:kind(root),realpath:kind(root)==='DIR'?fs.realpathSync(root):null,
    git:git(root),presence,package:manifest(path.join(root,'package.json')),
    clientPackage:manifest(path.join(root,'client/package.json'))};
}
const source=roots.nostromo,active=roots.librechat_active,alternate=roots.librechat_alternate;
data.codeComparison={
  vxSourceFiles:{
    src:filesCount(path.join(source,'src')),
    contracts:filesCount(path.join(source,'contracts')),
    config:filesCount(path.join(source,'config'))
  },
  activePackageFiles:{
    src:filesCount(path.join(active,'packages/librechat-vx/src')),
    contracts:filesCount(path.join(active,'packages/librechat-vx/contracts')),
    config:filesCount(path.join(active,'packages/librechat-vx/config'))
  },
  vxUiMatchesActive:Object.fromEntries(['VXCockpitBridge.tsx','VXCockpit.css'].map(f=>{
    const src=fingerprint(path.join(source,'overlay/upstream',f)),
      dst=fingerprint(path.join(active,'client/src/components/VX',f));
    return [f,src===null?'SOURCE_MISSING':dst===null?'ACTIVE_MISSING':src===dst?'MATCH':'DIFFERENT'];
  })),
  upstreamTwins:Object.fromEntries([
    'client/src/components/Chat/Presentation.tsx',
    'client/package.json','package-lock.json',
    'client/src/components/VX/VXCockpitBridge.tsx',
    'client/src/components/VX/VXCockpit.css',
    'packages/librechat-vx/src/index.ts'
  ].map(f=>{
    const a=fingerprint(path.join(active,f)),b=fingerprint(path.join(alternate,f));
    return [f,a===null&&b===null?'BOTH_MISSING':a===null?'ONLY_ALTERNATE':
      b===null?'ONLY_ACTIVE':a===b?'MATCH':'DIFFERENT'];
  }))
};
const sock=run('ss',['-ltnH']);
data.listeners=sock===null?{status:'UNAVAILABLE'}:{
  status:'OBSERVED',port3080:/(?:^|\s)[^\s]*:3080\s/.test(sock),
  port27017:/(?:^|\s)[^\s]*:27017\s/.test(sock)
};
console.log(JSON.stringify(data,null,2));
