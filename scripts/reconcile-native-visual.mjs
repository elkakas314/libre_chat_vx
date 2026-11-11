#!/usr/bin/env node
/** Safe native UI overlay reconciliation for two files, not Presentation.tsx.
 * PREVIEW by default. Preserve original files in private backup on --apply.
 * Refuse to touch new/unique local edits or a different LibreChat checkout.
 */
import {execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {existsSync,readFileSync,lstatSync,realpathSync,mkdtempSync,chmodSync,mkdirSync,copyFileSync,openSync,writeSync,fsyncSync,closeSync,renameSync} from 'node:fs';
import {homedir} from 'node:os';
import path from 'node:path';
import {visualUpdateDisposition} from './visual-overlay-gate.mjs';

const base='b0641a221b21d28b523a16bafc51d821e2dc72c4';
const upstream='f10b1d91f1eee3a2c82d5247bf620351486b7c1b';
const vx=realpathSync(process.cwd());
const canonicalVx=path.join(homedir(),'librechat','vx');
const up=path.join(homedir(),'librechat','upstream');
const files=['VXCockpitBridge.tsx','VXCockpit.css'];
const apply=process.argv.includes('--apply');
if(process.argv.includes('--help')){console.log('node scripts/reconcile-native-visual.mjs [--apply]');process.exit(0);}
const report=(status,extra={},exitCode=0)=>{
 console.log(JSON.stringify({schema:'nostromo.native-visual-sync.v1',
  mode:apply?'APPLY':'PREVIEW',status,upstream:up,source:vx,
  mutated:status==='VISUAL_SYNC_APPLIED',servicesChanged:false,...extra},null,2));
 process.exitCode=exitCode;
};
function sha(x){return createHash('sha256').update(x).digest('hex');}
function git(dir,args){
 return execFileSync('git',['-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null',
  '-C',dir,...args],{
  encoding:args[0]==='show'?null:'utf8',
  maxBuffer:8*1024*1024,timeout:10000,stdio:['ignore','pipe','ignore'],
  env:{PATH:'/usr/bin:/bin',GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0',
   GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'}
 });
}
function regular(p){try{const s=lstatSync(p);return s.isFile()&&!s.isSymbolicLink();}catch{return false;}}
const data=[];
try{
 if(process.argv.some(x=>x.startsWith('--')&&x!=='--apply'))
  throw Error('UNKNOWN_FLAG_REFUSED');
 if(apply&&vx!==canonicalVx)throw Error('APPLY_ONLY_FROM_CANONICAL_VX_CHECKOUT');
 if(!existsSync(up)||lstatSync(up).isSymbolicLink()||realpathSync(up)!==up)
  throw Error('UPSTREAM_PATH_UNSAFE');
 if(git(up,['rev-parse','HEAD']).trim()!==upstream)
  throw Error('UPSTREAM_HEAD_MISMATCH');
 for(const name of files){
  const sourceFile=path.join(vx,'overlay','upstream',name);
  const dest=path.join(up,'client','src','components','VX',name);
  if(!regular(sourceFile)||!regular(dest))throw Error('VISUAL_FILE_MISSING_OR_UNSAFE:'+name);
  const desired=readFileSync(sourceFile),installed=readFileSync(dest);
  const baseline=git(vx,['show',base+':overlay/upstream/'+name]);
  data.push({name,sourceFile,dest,desired,installed,
    status:visualUpdateDisposition({installed,baseline,desired}),
    beforeSha256:sha(installed),afterSha256:sha(desired)});
 }
 const descriptions=data.map(({name,status,beforeSha256,afterSha256})=>({
  name,status,beforeSha256,afterSha256
 }));
 if(data.some(x=>x.status==='UNIQUE_LOCAL_VISUAL_CHANGES_PRESERVE')){
  report('LOCAL_UNIQUE_WORK_PRESERVED',{files:descriptions},2);
 }else if(data.every(x=>x.status==='ALREADY_MATCHED')){
  report('VISUAL_ALREADY_MATCHED',{files:descriptions});
 }else if(!apply){
  report('VISUAL_SAFE_TO_STAGE',{files:descriptions,
   next:'APPLY_ONLY_AFTER_VERIFYING_SOURCE_AND_HOST_STATUS'});
 }else{
  const backup=mkdtempSync(path.join(homedir(),'nostromo-visual-backup.'));
  chmodSync(backup,0o700);
  for(const item of data){
   const output=path.join(backup,item.name);
   copyFileSync(item.dest,output);
  }
  const changes=[];
  for(const item of data){
   if(item.status==='ALREADY_MATCHED')continue;
   // Recheck identity immediately before replacing source; no blind overwrite.
   if(sha(readFileSync(item.dest))!==item.beforeSha256)
    throw Error('VISUAL_FILE_CHANGED_DURING_APPLY:'+item.name);
   const stage=path.join(path.dirname(item.dest),
     '.nostromo-visual-'+randomUUID()+'.tmp');
   const fd=openSync(stage,'wx',0o600);
   try{writeSync(fd,item.desired);fsyncSync(fd);}
   finally{closeSync(fd);}
   if(sha(readFileSync(stage))!==item.afterSha256)
    throw Error('VISUAL_STAGE_READBACK_FAILED:'+item.name);
   renameSync(stage,item.dest);
   if(sha(readFileSync(item.dest))!==item.afterSha256)
    throw Error('VISUAL_POST_SWITCH_READBACK_FAILED:'+item.name);
   changes.push(item.name);
  }
  report('VISUAL_SYNC_APPLIED',{backup,changed:changes,files:descriptions,
   warning:'Native Presentation and package workspace are NOT modified; verify frontend separately.'});
 }
}catch(e){
 report('VISUAL_SYNC_BLOCKED',{reason:String(e?.message||'UNKNOWN'),next:'NO_AUTO_RESET_OR_CLEAN'},2);
}
