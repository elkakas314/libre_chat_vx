#!/usr/bin/env node
/** Inspect the pinned existing LibreChat npm workspace before a guarded install.
 * R0: no npm install/exec, no git fetch, no services, no secrets.
 */
import {existsSync,readFileSync,realpathSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

const EXPECTED_HEAD='f10b1d91f1eee3a2c82d5247bf620351486b7c1b';
const arg=process.argv.find(x=>x.startsWith('--upstream='));
const up=path.resolve(arg?arg.slice('--upstream='.length):'../upstream');
function git(args){
  try{return execFileSync('git',['-C',up,'-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null',...args],{
    encoding:'utf8',timeout:10000,maxBuffer:1048576,
    stdio:['ignore','pipe','ignore'],
    env:{...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0'}
  }).trim();}catch{return null;}
}
function present(p){try{return statSync(p).isFile();}catch{return false;}}
function packageVersion(p){try{
  const j=JSON.parse(readFileSync(p,'utf8'));
  return {name:j.name||null,version:j.version||null,packageManager:j.packageManager||null,
    declaredRimraf:j.devDependencies?.rimraf||j.dependencies?.rimraf||null,
    declaredTsdown:j.devDependencies?.tsdown||j.dependencies?.tsdown||null};
}catch{return null;}}
function candidates(bin,workspace){
  return [
    path.join(up,'node_modules/.bin',bin),
    path.join(up,workspace,'node_modules/.bin',bin)
  ];
}
const root=existsSync(up)?realpathSync(up):null;
const head=root?git(['rev-parse','HEAD']):null;
const status=head?git(['status','--porcelain=v1','--untracked-files=normal']):null;
const entries=status===null?null:status?status.split('\n').length:0;
const bins=Object.fromEntries([
  ['rimraf','packages/data-provider'],
  ['tsdown','packages/data-provider'],
  ['tsc','packages/data-provider'],
  ['vite','client']
].map(([bin,w])=>{
  const paths=candidates(bin,w);
  return [bin,{found:paths.some(p=>existsSync(p)),locations:paths.filter(p=>existsSync(p))}];
}));
const lock=path.join(up,'package-lock.json');
const lockSha=present(lock)?createHash('sha256').update(readFileSync(lock)).digest('hex'):null;
const data={
  schema:'nostromo.librechat.frontend-dependencies.r0.v1',
  readOnly:true,networkRequests:0,mutations:0,observedAt:new Date().toISOString(),
  upstream:up,exists:!!root,head,expectedHead:EXPECTED_HEAD,
  identityMatched:head===EXPECTED_HEAD,
  dirtyEntryCount:entries,
  manifest:packageVersion(path.join(up,'package.json')),
  dataProvider:packageVersion(path.join(up,'packages/data-provider/package.json')),
  lockfile:{present:lockSha!==null,sha256:lockSha},
  bins,
  missingBins:Object.entries(bins).filter(([,v])=>!v.found).map(([n])=>n),
  status:!root?'UPSTREAM_MISSING':head!==EXPECTED_HEAD?'UPSTREAM_IDENTITY_MISMATCH':
    !lockSha?'LOCKFILE_MISSING':Object.values(bins).some(v=>!v.found)?
    'DEPENDENCIES_INCOMPLETE':'DEPENDENCY_BINS_PRESENT_NOT_BUILD_VERIFIED',
  next:'REVIEW_MISSING_DEPENDENCIES_AND_REPAIR_WITH_LOCKFILE_GUARD_BEFORE_FRONTEND_BUILD'
};
console.log(JSON.stringify(data,null,2));
if(!root||head!==EXPECTED_HEAD||!lockSha)process.exitCode=2;
