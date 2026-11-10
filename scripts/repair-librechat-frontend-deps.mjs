#!/usr/bin/env node
/** Guarded restoration of dev dependencies in the existing DIRTY LibreChat tree.
 * PREVIEW by default. --apply is an explicit host mutation; never uses npm ci,
 * force, git reset, deletes, a new LibreChat checkout or GitHub Actions.
 */
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,realpathSync,lstatSync,mkdtempSync,mkdirSync,copyFileSync,chmodSync,statfsSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const EXPECTED_UPSTREAM='f10b1d91f1eee3a2c82d5247bf620351486b7c1b';
const EXPECTED_LOCK='e7119c0eecd9c97048c7fb838a9f8cb0cb620bed99b7488886743e9bbe14d5f5';
const CANONICAL=path.join(os.homedir(),'librechat','upstream');
const target=process.argv.find(x=>x.startsWith('--upstream='));
const UP=path.resolve(target?target.slice('--upstream='.length):CANONICAL);
const APPLY=process.argv.includes('--apply');
if(process.argv.includes('--help')){
  console.log('node scripts/repair-librechat-frontend-deps.mjs [--apply] (preview is default)');
  process.exit(0);
}
function fail(status,extra={}){
  console.log(JSON.stringify({schema:'nostromo.frontend.devdeps.repair.v1',
    mode:APPLY?'APPLY':'PREVIEW',status,upstream:UP,...extra},null,2));
  process.exit(2);
}
function run(program,args,{cwd=UP,env=process.env,stdio='pipe',timeout=20000}={}){
  const x=spawnSync(program,args,{cwd,env,stdio,encoding:'utf8',timeout,
    maxBuffer:1048576});
  return {exitCode:x.status,error:x.error?.code??null,
    stdout:String(x.stdout??'').trim(),stderr:String(x.stderr??'').trim()};
}
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
function file(p){
  try {const s=lstatSync(p);return s.isFile()&&!s.isSymbolicLink();}
  catch{return false;}
}
const protectedFiles=[
 'package.json','package-lock.json',
 'client/package.json','packages/data-provider/package.json'
];
if(!existsSync(UP)||realpathSync(UP)!==UP)fail('UPSTREAM_MISSING_OR_ALIAS');
if(APPLY&&UP!==CANONICAL)fail('APPLY_ONLY_ALLOWED_ON_CANONICAL_CHECKOUT');
for(const relative of protectedFiles){
  if(!file(path.join(UP,relative)))fail('PROTECTED_MANIFEST_MISSING_OR_SYMLINK',{relative});
}
for(const relative of ['node_modules','client/node_modules','packages/data-provider/node_modules']){
  const p=path.join(UP,relative);
  if(existsSync(p)&&lstatSync(p).isSymbolicLink())
    fail('NODE_MODULES_SYMLINK_DENIED',{relative});
}
const git=run('git',['-c','core.fsmonitor=false','-C',UP,'rev-parse','HEAD'],
 {env:{...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0'}});
if(git.exitCode!==0||git.stdout!==EXPECTED_UPSTREAM)
  fail('UPSTREAM_HEAD_MISMATCH',{observedHead:git.stdout||null});
const lockSha=sha(path.join(UP,'package-lock.json'));
if(lockSha!==EXPECTED_LOCK)fail('LOCKFILE_SHA_CHANGED',{lockSha,
  expectedLockSha:EXPECTED_LOCK,action:'REINSPECT_BEFORE_ANY_INSTALL'});
const baseline=Object.fromEntries(protectedFiles.map(p=>[p,sha(path.join(UP,p))]));
const tools={rimraf:'packages/data-provider',tsdown:'packages/data-provider',
  tsc:'packages/data-provider',vite:'client'};
const binExists=(name,workspace)=>[
 path.join(UP,'node_modules','.bin',name),
 path.join(UP,workspace,'node_modules','.bin',name)
].some(x=>existsSync(x));
const missing=()=>Object.entries(tools).filter(([n,w])=>!binExists(n,w)).map(([n])=>n);
const before=missing();
const npm=run('npm',['--version']);
const npmMajor=Number(npm.stdout.split('.')[0]);
const allowedArgs=['install','--no-save','--include=dev','--ignore-scripts',
 '--no-audit','--no-fund','--prefer-offline','--progress=false'];
const disk=statfsSync(UP);
const availableDiskBytes=disk.bavail*disk.bsize;
const memMatch=readFileSync('/proc/meminfo','utf8').match(/^MemAvailable:\s+(\d+)\s+kB/m);
const availableMemoryBytes=memMatch?Number(memMatch[1])*1024:null;
const report={
 schema:'nostromo.frontend.devdeps.repair.v1',mode:APPLY?'APPLY':'PREVIEW',
 upstream:UP,identityVerified:true,lockSha256:lockSha,
 missingBefore:before,npmVersion:npm.stdout,
 availableDiskBytes,availableMemoryBytes,
 willPreserve:'package-lock.json and package manifests (SHA guarded)',
 installation:'npm install --no-save --include=dev --ignore-scripts --no-audit --no-fund --prefer-offline',
 risk:'npm install can change node_modules; cannot promise complete rollback of dependencies',
 backupPath:null,mutated:false
};
if(!APPLY){
  console.log(JSON.stringify({...report,status:before.length?'PREVIEW_REPAIR_AVAILABLE':'ALREADY_PRESENT'},null,2));
  process.exit(0);
}
if(!before.length)fail('ALREADY_PRESENT',{missingBefore:[]});
if(npmMajor!==11)fail('NPM_MAJOR_NOT_EXPECTED',{version:npm.stdout});
if(availableDiskBytes<3*1024**3||!availableMemoryBytes||availableMemoryBytes<2*1024**3)
  fail('RESOURCE_GUARD_DENIED',{availableDiskBytes,availableMemoryBytes});
const env={
 HOME:os.homedir(),PATH:process.env.PATH??'/usr/bin:/bin',
 LANG:'C.UTF-8',LC_ALL:'C.UTF-8',TMPDIR:process.env.TMPDIR??'/tmp',
 NODE_OPTIONS:'--max-old-space-size=1536',
 npm_config_maxsockets:'2',npm_config_update_notifier:'false',
 npm_config_audit:'false',npm_config_fund:'false',
 npm_config_registry:'https://registry.npmjs.org/',
 npm_config_userconfig:'/dev/null',npm_config_globalconfig:'/dev/null'};
const dry=run('npm',[...allowedArgs,'--dry-run'],{
 env,stdio:'pipe',timeout:6*60_000});
if(dry.exitCode!==0)fail('DRY_RUN_FAILED',{
 exitCode:dry.exitCode,error:dry.error,stdoutTail:dry.stdout.slice(-4000),
 stderrTail:dry.stderr.slice(-4000)});
for(const relative of protectedFiles)if(sha(path.join(UP,relative))!==baseline[relative])
  fail('PREVIEW_CHANGED_PROTECTED_FILE',{relative});
const backup=mkdtempSync(path.join(os.homedir(),'nostromo-frontend-deps-backup.'));
chmodSync(backup,0o700);
for(const relative of protectedFiles){
  const out=path.join(backup,relative);
  mkdirSync(path.dirname(out),{recursive:true,mode:0o700});
  copyFileSync(path.join(UP,relative),out);
}
writeFileSync(path.join(backup,'receipt.json'),JSON.stringify({
 schema:'nostromo.frontend.deps.backup.v1',upstream:UP,
 observedAt:new Date().toISOString(),head:EXPECTED_UPSTREAM,
 manifestSha256:baseline,files:protectedFiles,
 note:'Backup of manifests only: node_modules is not snapshotted'
},null,2),{mode:0o600});
console.log(JSON.stringify({...report,status:'APPLY_START',
 backupPath:backup,mutated:false},null,2));
const install=run('npm',allowedArgs,{env,stdio:'inherit',timeout:30*60_000});
const changedProtected=protectedFiles.filter(x=>sha(path.join(UP,x))!==baseline[x]);
const after=missing();
const status=changedProtected.length?'PROTECTED_MANIFEST_CHANGED':
 install.exitCode!==0?'NPM_INSTALL_FAILED':
 after.length?'DEPENDENCIES_STILL_INCOMPLETE':'DEVELOPMENT_BINARIES_PRESENT_NOT_BUILD_VERIFIED';
console.log(JSON.stringify({
 ...report,status,exitCode:install.exitCode,error:install.error,
 missingAfter:after,protectedManifestChanges:changedProtected,
 backupPath:backup,mutated:true,frontendBuilt:false,mcpOrServicesChanged:false,
 next:status==='DEVELOPMENT_BINARIES_PRESENT_NOT_BUILD_VERIFIED'?
  'RUN_FRONTEND_CI_WITH_RESOURCE_GUARD':
  'INSPECT_FAILURE_AND_BACKUP_BEFORE_RETRY_NO_FORCE'
},null,2));
if(status!=='DEVELOPMENT_BINARIES_PRESENT_NOT_BUILD_VERIFIED')process.exitCode=1;
