#!/usr/bin/env node
/** NOSTROMO R0 local preflight. READ ONLY. No Git fetch/pull, install, restart,
 * move, rename, network secret lookup or writes.
 */
import {execFileSync} from 'node:child_process';
import {existsSync,realpathSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
import net from 'node:net';

const baseArg=process.argv.find(x=>x.startsWith('--base='));
const base=resolve(baseArg?baseArg.slice('--base='.length):'/home/elkakas314/librechat');
const extraArg=process.argv.find(x=>x.startsWith('--extra-upstream='));
const extra=resolve(extraArg?extraArg.slice('--extra-upstream='.length):'/home/elkakas314/upstream');
const onlyHelp=process.argv.includes('--help');
if(onlyHelp){
 process.stdout.write('node scripts/nostromo-preflight.mjs [--base=/home/elkakas314/librechat] [--extra-upstream=/home/elkakas314/upstream]\n');
 process.exit(0);
}
function git(dir,args) {
 try{return {ok:true,value:execFileSync('git',['-C',dir,...args],{
  encoding:'utf8',timeout:10000,stdio:['ignore','pipe','ignore'],
  env:{...process.env,GIT_TERMINAL_PROMPT:'0'}
 }).trim()};}
 catch{return {ok:false,value:null};}
}
function snapshot(label,dir){
 const x={label,path:dir,present:false,git:false,worktreeDirty:'UNKNOWN',head:null,branch:null,
   untrackedCount:null,trackedChangeCount:null,changes:[],remoteTracking:'CACHED_ONLY'};
 try {
  const st=statSync(dir);
  if(!st.isDirectory())return {...x,error:'NOT_DIRECTORY'};
  x.present=true;
  x.realPath=realpathSync(dir);
 }catch{return {...x,error:'MISSING'};}
 const g=git(dir,['rev-parse','--is-inside-work-tree']);
 if(!g.ok||g.value!=='true')return {...x,error:'NOT_GIT_WORKTREE'};
 x.git=true;x.head=git(dir,['rev-parse','HEAD']).value;
 x.branch=git(dir,['branch','--show-current']).value;
 const dirty=git(dir,['status','--porcelain','--untracked-files=all']);
 if(!dirty.ok)return {...x,error:'GIT_STATUS_UNAVAILABLE'};
 const rows=dirty.value?dirty.value.split('\n'):[];
 x.trackedChangeCount=rows.filter(row=>!row.startsWith('??')).length;
 x.untrackedCount=rows.filter(row=>row.startsWith('??')).length;
 x.worktreeDirty=rows.length?'DIRTY':'CLEAN';
 x.changes=rows.slice(0,25).map(row=>row.slice(0,2));
 // The remote-tracking ref may be stale: do not claim that it is the
 // remote live HEAD. Do not fetch: any update needs its own backup/CAS.
 x.cachedOriginMain=git(dir,['rev-parse','--verify','refs/remotes/origin/main']).value;
 const local=git(dir,['rev-list','--left-right','--count','HEAD...refs/remotes/origin/main']);
 if(local.ok) {
  const counts=local.value.split(/\s+/).map(Number);
  if(counts.length===2&&counts.every(Number.isSafeInteger))
   x.cachedDivergence={localOnly:counts[0],cachedOriginOnly:counts[1]};
 }
 return x;
}
async function portIsListening(port){
 return await new Promise(done=>{
  const sock=net.createConnection({port,host:'127.0.0.1'});
  let settled=false;
  const finish=status=>{if(settled)return;settled=true;sock.destroy();done(status);};
  sock.setTimeout(750,()=>finish('NO_RESPONSE'));
  sock.once('connect',()=>finish('LISTENING_TCP_ONLY'));
  sock.once('error',()=>finish('NOT_LISTENING_OR_BLOCKED'));
 });
}
const vx=snapshot('NOSTROMO_VX',join(base,'vx'));
const integrated=snapshot('UPSTREAM_ACTIVE_CANDIDATE',join(base,'upstream'));
const sibling=snapshot('UPSTREAM_SIBLING_CANDIDATE',extra);
const overlayPath=join(base,'upstream','.librechat-vx-overlay.json');
const overlayMarkerPresent=existsSync(overlayPath);
const rootMcp=join(base,'vx','deployment','nostromo-mcp');
const result={
 schema:'nostromo.local-preflight.v1',readOnly:true,mutations:0,
 cwd:process.cwd(),base,siblingUpstream:extra,
 repositories:[vx,integrated,sibling],
 overlayMarkerPresent,mcpSourcePresent:existsSync(join(rootMcp,'server.mjs')),
 mcpPackagePresent:existsSync(join(rootMcp,'package.json')),
 port3080:await portIsListening(3080),
 gitHubLiveCompared:false,
 safeToBlindlyUpdate:false,
 safeToMoveOrDelete:false,
 next:'BACKUP_DIRTY_AND_UNTRACKED_BEFORE_ANY_FF_ONLY_AND_OVERLAY_RECONCILE'
};
process.stdout.write(JSON.stringify(result,null,2)+'\n');
