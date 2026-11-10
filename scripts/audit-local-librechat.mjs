#!/usr/bin/env node
/**
 * NOSTROMO / R0: audit the two EXISTING LibreChat upstream clones and VX.
 * Read-only. No npm, Docker, Git writes, secrets, processes or ports modified.
 * .env, YAML contents, private keys, tokens and credentials NEVER read.
 */
import os from 'node:os';
import path from 'node:path';
import {lstatSync,existsSync,realpathSync,readFileSync,createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const home=os.homedir();
const roots={
  vx:path.join(home,'librechat','vx'),
  internal:path.join(home,'librechat','upstream'),
  external:path.join(home,'upstream'),
};
const knownFiles=[
  'package.json',
  'package-lock.json',
  'client/package.json',
  'client/src/components/Chat/Presentation.tsx',
  'client/src/components/VX/VXCockpitBridge.tsx',
  'client/src/components/VX/VXCockpit.css',
  'packages/librechat-vx/src/index.ts',
  'packages/librechat-vx/package.json',
  '.librechat-vx-overlay.json',
];
const presenceOnly=[
  '.env','.env.local','librechat.yaml','docker-compose.yml','compose.yaml',
  'node_modules/.bin/tsc','node_modules/@types/react/index.d.ts',
  'node_modules/@types/react-dom/index.d.ts','client/node_modules/@types/react/index.d.ts',
  'packages/librechat-vx/dist/src/index.js'
];
const sensitive=/(?:^|\/)(?:\.env(?:\.|$)|\.ssh(?:\/|$)|\.aws(?:\/|$)|\.gnupg(?:\/|$)|\.npmrc$)|(?:token|password|secret|credential|private.key)/i;
function safeName(name){return sensitive.test(name)?'[REDACTED_SENSITIVE_PATH]':name;}
function boundedGit(dir,args){
  try{
    return execFileSync('git',['-C',dir,...args],{
      encoding:'utf8',timeout:15000,maxBuffer:5*1024*1024,
      stdio:['ignore','pipe','pipe'],env:{...process.env,GIT_TERMINAL_PROMPT:'0',GIT_OPTIONAL_LOCKS:'0'},
    }).trimEnd();
  }catch(e){return 'ERROR:'+String(e?.status??e?.code??'UNKNOWN');}
}
function kind(p){
  try{const s=lstatSync(p);
    if(s.isSymbolicLink())return 'SYMLINK_NOT_FOLLOWED';
    if(s.isDirectory())return 'DIRECTORY';
    if(s.isFile())return 'FILE';
    return 'SPECIAL_FILE';
  }catch(e){if(e?.code==='ENOENT')return 'ABSENT';return 'NOT_ACCESSIBLE';}
}
async function hashAllowedFile(p){
  if(kind(p)!=='FILE')return null;
  const hash=createHash('sha256');
  const stream=createReadStream(p,{highWaterMark:65536});
  for await(const chunk of stream)hash.update(chunk);
  return hash.digest('hex');
}
function gitStatus(dir){
  const raw=boundedGit(dir,['status','--porcelain=v1','--untracked-files=all']);
  if(raw.startsWith('ERROR:'))return {status:'GIT_STATUS_UNAVAILABLE',trackedChanges:null,untracked:null,
    modifiedPathsSample:[],untrackedPathsSample:[],entriesTruncated:false};
  const lines=raw.split('\n').filter(Boolean);
  const redact=(line)=>line.slice(0,3)+safeName(line.slice(3));
  return {
    trackedChanges:lines.filter(x=>!x.startsWith('??')).length,
    untracked:lines.filter(x=>x.startsWith('??')).length,
    modifiedPathsSample:lines.filter(x=>!x.startsWith('??')).slice(0,35).map(redact),
    untrackedPathsSample:lines.filter(x=>x.startsWith('??')).slice(0,35).map(redact),
    entriesTruncated:lines.length>70,
  };
}
async function inspect(name,dir){
  const stat=kind(dir);
  if(stat!=='DIRECTORY')return {name,path:dir,kind:stat};
  // Canonical base is verified to be the exact preselected working directory.
  if(realpathSync(dir)!==dir)return {name,path:dir,kind:'SYMLINKED_OR_RELOCATED',safeToOperate:false};
  const hashes={};
  for(const rel of knownFiles){
    const p=path.join(dir,rel),type=kind(p);
    hashes[rel]={kind:type,...(type==='FILE'?{sha256:await hashAllowedFile(p)}:{})};
  }
  const presence={};
  for(const rel of presenceOnly)presence[rel]=kind(path.join(dir,rel));
  return {name,path:dir,kind:stat,
    git:{head:boundedGit(dir,['rev-parse','HEAD']),
      branch:boundedGit(dir,['branch','--show-current']),
      status:gitStatus(dir)},
    files:hashes,presence,
  };
}
const scans={};
for(const [name,dir] of Object.entries(roots))scans[name]=await inspect(name,dir);
const compare=(a,b)=>{
  const x=scans[a],y=scans[b];
  if(x.kind!=='DIRECTORY'||y.kind!=='DIRECTORY')return {status:'UNAVAILABLE'};
  const rows=knownFiles.map(rel=>{
    const left=x.files[rel],right=y.files[rel];
    return {relativePath:rel,a:left.kind,b:right.kind,
      sameSha256:Boolean(left.sha256&&left.sha256===right.sha256)};
  });
  return {a,b,sameHead:/^[0-9a-f]{40}$/.test(x.git.head) && x.git.head===y.git.head,
    sharedFileComparisons:rows,
    differentOrAbsent:rows.filter(x=>!x.sameSha256).map(x=>x.relativePath)};
};
const report={
 schema:'nostromo.local-librechat-readback.v1',
 observedAt:new Date().toISOString(),
 readOnly:true,noSecretValuesRead:true,noFilesChanged:true,
 note:'Source hashes identify versions only; they do not prove runtime installation or service health.',
 scans,
 comparisons:{
   internalVsExternal:compare('internal','external'),
   vxVsInternal:compare('vx','internal'),
 },
};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
