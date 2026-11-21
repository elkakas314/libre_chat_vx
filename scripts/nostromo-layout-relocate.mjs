#!/usr/bin/env node
/** Explicit, reversible same-filesystem relocation of four known backups and npm 11 tool.
 * Preview default. No deletes, no content reads or symlink traversal.
 * Do not move the independent ~/upstream checkout or the Git worktrees here.
 */
import {lstatSync,renameSync} from 'node:fs';
import {homedir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {nostromoLayout,ensureNostromoDir,LEGACY_BACKUP_NAMES} from './nostromo-layout.mjs';

function statOrNull(p){
 try{return lstatSync(p);}catch(e){if(e?.code==='ENOENT')return null;throw e;}
}
const safe=s=>!!s&&s.isDirectory()&&!s.isSymbolicLink()&&
 (typeof process.getuid!=='function'||s.uid===process.getuid());
function npmToolVersion(root){
 const file=path.join(root,'node_modules','npm','bin','npm-cli.js');
 const st=statOrNull(file);
 if(!st||!st.isFile()||st.isSymbolicLink())return null;
 const r=spawnSync(process.execPath,[file,'--version'],{
  encoding:'utf8',timeout:10000,stdio:['ignore','pipe','pipe']});
 return r.status===0?String(r.stdout).trim():null;
}
export function auditLegacyLayout(home=homedir()){
 const layout=nostromoLayout(home),base=statOrNull(layout.base);
 if(!safe(base))return {status:'BASE_UNSAFE_OR_ABSENT',allow:false,moves:[]};
 for(const p of [layout.root,layout.backups,layout.tools]){
  const st=statOrNull(p);
  if(st&&(!safe(st)||(st.mode&0o077)!==0))
   return {status:'CANONICAL_ROOT_UNSAFE',allow:false,moves:[]};
 }
 const plans=LEGACY_BACKUP_NAMES.map(name=>({
  kind:'backup',name,from:path.join(home,name),to:path.join(layout.backups,name)
 }));
 plans.push({kind:'npm11',name:'npm-11.13.0',
  from:layout.legacyTool,to:layout.pinnedTool});
 const moves=plans.map(item=>{
  const orig=statOrNull(item.from),dest=statOrNull(item.to);
  const sourceValid=!orig||safe(orig),destValid=!dest||safe(dest);
  let status=!sourceValid||!destValid?'UNSAFE_SOURCE_OR_DESTINATION':
   orig&&dest?'BOTH_LOCATIONS_EXIST_REFUSE':
   !orig&&!dest?'ABSENT':
   !orig?'ALREADY_MOVED':'READY_TO_MOVE';
  if(status==='READY_TO_MOVE'&&orig.dev!==base.dev)
    status='CROSS_FILESYSTEM_REFUSE';
  // Do not migrate arbitrary directory named npm: inspect real CLI version.
  if(item.kind==='npm11'&&['READY_TO_MOVE','ALREADY_MOVED'].includes(status)){
   const observedVersion=npmToolVersion(orig?item.from:item.to);
   if(observedVersion!=='11.13.0')status='UNVERIFIED_NPM11_TOOL';
  }
  return {...item,status,
   sourceIdentity:orig?{dev:orig.dev,ino:orig.ino,uid:orig.uid}:null,
   destinationIdentity:dest?{dev:dest.dev,ino:dest.ino,uid:dest.uid}:null};
 });
 const blockers=moves.filter(x=>!['ABSENT','ALREADY_MOVED','READY_TO_MOVE'].includes(x.status));
 return {schema:'nostromo.layout.migration.v1',readOnly:true,
  root:layout.root,status:blockers.length?'MIGRATION_BLOCKED':'MIGRATION_PREVIEW',
  allow:blockers.length===0,moves};
}
export function relocateLegacyLayout({home=homedir(),apply=false}={}){
 const pre=auditLegacyLayout(home);
 if(!apply||!pre.allow)return {...pre,mode:apply?'APPLY':'PREVIEW',
   mutated:false,reason:!pre.allow?'SAFETY_PREFLIGHT_BLOCKED':null};
 const toMove=pre.moves.filter(x=>x.status==='READY_TO_MOVE');
 if(!toMove.length)return {...pre,status:'ALREADY_RELOCATED_OR_NOT_PRESENT',
   mode:'APPLY',mutated:false,verified:true};
 for(const name of ['worktrees','tools','backups','runtime','reports','handoffs','manifests','staging','cache','tmp','legacy'])
  ensureNostromoDir(name,{home});
 const done=[];
 try{
  for(const item of toMove){
   const original=statOrNull(item.from),dest=statOrNull(item.to);
   if(!safe(original)||dest||
      original.ino!==item.sourceIdentity.ino||
      original.dev!==item.sourceIdentity.dev||
      original.uid!==item.sourceIdentity.uid)
     throw Error('IDENTITY_CHANGED_BEFORE_MOVE:'+item.name);
   const dstParent=statOrNull(path.dirname(item.to));
   if(!safe(dstParent)||dstParent.dev!==original.dev||
     (dstParent.mode&0o077)!==0)
     throw Error('DESTINATION_UNSAFE:'+item.name);
   renameSync(item.from,item.to);
   done.push(item);
   const observed=statOrNull(item.to);
   if(!safe(observed)||observed.ino!==original.ino||
      observed.dev!==original.dev||statOrNull(item.from))
     throw Error('POST_MOVE_READBACK_FAILED:'+item.name);
  }
  const final=auditLegacyLayout(home);
  if(!final.allow||toMove.some(m=>final.moves.find(x=>x.name===m.name)?.status!=='ALREADY_MOVED'))
    throw Error('FINAL_AUDIT_FAILED');
  return {...final,status:'RELOCATED_VERIFIED',mode:'APPLY',
   mutated:true,verified:true,movedNames:done.map(x=>x.name),
   originalsPreservedByRename:true,deletedContent:false,
   note:'Historical absolute path references require reconciliation; no Git checkout moved.'};
 }catch(e){
  const rollbackErrors=[];
  for(const item of done.reverse()){
   try{
    const atDst=statOrNull(item.to),atSource=statOrNull(item.from);
    if(!safe(atDst)||atSource||
      atDst.ino!==item.sourceIdentity.ino||
      atDst.dev!==item.sourceIdentity.dev)
      throw Error('ROLLBACK_IDENTITY_MISMATCH');
    renameSync(item.to,item.from);
   }catch(err){rollbackErrors.push({name:item.name,reason:String(err.message||err)});}
  }
  return {schema:'nostromo.layout.migration.v1',
   status:rollbackErrors.length?'RECOVERY_REQUIRED':'MIGRATION_FAILED_ROLLED_BACK',
   mode:'APPLY',mutated:done.length>0,
   verified:false,error:String(e.message||e),rollbackErrors,
   note:'No file deletion attempted; inspect both roots before any retry.'};
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.some(x=>!['--apply','--help'].includes(x))){
  console.log(JSON.stringify({status:'UNKNOWN_FLAG_REFUSED',readOnly:true}));process.exitCode=2;
 }else if(args.includes('--help')){
  console.log('node scripts/nostromo-layout-relocate.mjs [--apply] (preview default)');
 }else{
  const result=relocateLegacyLayout({apply:args.includes('--apply')});
  console.log(JSON.stringify(result,null,2));
  if(['MIGRATION_BLOCKED','BASE_UNSAFE_OR_ABSENT','CANONICAL_ROOT_UNSAFE',
      'RECOVERY_REQUIRED','MIGRATION_FAILED_ROLLED_BACK'].includes(result.status))
    process.exitCode=2;
 }
}
