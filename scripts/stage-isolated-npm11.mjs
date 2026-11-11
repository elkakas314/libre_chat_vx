#!/usr/bin/env node
/** One-time, local-only npm 11 CLI toolchain staging for pinned LibreChat.
 * PREVIEW default, --apply builds a new tool directory outside the dirty
 * upstream. Never updates system npm, never deletes or replaces existing tools.
 */
import {existsSync,lstatSync,mkdirSync,mkdtempSync,renameSync,statfsSync,readFileSync,statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {assessNpmEnvironment} from './librechat-frontend-npm-gate.mjs';
const up=path.join(os.homedir(),'librechat','upstream');
const tools=path.join(os.homedir(),'.local','share','nostromo','tools');
const dst=path.join(tools,'npm-11.13.0');
const apply=process.argv.includes('--apply');
const args=['install','--prefix','STAGE','--no-save','--package-lock=false',
  '--ignore-scripts','--no-audit','--no-fund','--prefer-offline','--progress=false','npm@11.13.0'];
function status(code,info={},rc=0){
 console.log(JSON.stringify({schema:'nostromo.isolated-npm11.v1',
  mode:apply?'APPLY':'PREVIEW',status:code,
  destination:dst,upstreamUnchanged:true,systemNpmUnchanged:true,
  ...info},null,2));process.exitCode=rc;
}
if(process.argv.includes('--help')){
 console.log('node scripts/stage-isolated-npm11.mjs [--apply] (preview default)');
 process.exit(0);
}
if(process.argv.some(x=>x.startsWith('--')&&x!=='--apply')){
 status('UNKNOWN_FLAG_REFUSED',{},2);
}else{
 const cli=path.join(dst,'node_modules','npm','bin','npm-cli.js');
 const host=spawnSync('npm',['--version'],{encoding:'utf8',timeout:8000,stdio:['ignore','pipe','ignore']});
 const actual=String(host.stdout||'').trim();
 let pkg=null;
 try{pkg=JSON.parse(readFileSync(path.join(up,'package.json'),'utf8'));}
 catch{}
 const contract=assessNpmEnvironment({
   declaredPackageManager:pkg?.packageManager,actualNpmVersion:'11.13.0',lockfileVersion:3
 });
 const disk=statfsSync(os.homedir());
 const diskFree=disk.bavail*disk.bsize;
 const mem=readFileSync('/proc/meminfo','utf8').match(/^MemAvailable:\s+(\d+)\s+kB/m);
 const memFree=mem?Number(mem[1])*1024:0;
 const pre={hostNpmVersion:actual,packageManager:pkg?.packageManager??null,
   pinnedTargetVersion:'11.13.0',availableDiskBytes:diskFree,availableMemoryBytes:memFree,
   stageOnlyOutsideUpstream:true,declaredCompatible:contract.applyAdmissible,
   command:'npm install --prefix <private-temporary-tool-dir> --no-save --package-lock=false --ignore-scripts --no-audit --no-fund --prefer-offline npm@11.13.0'};
 if(!contract.applyAdmissible){
   status('UPSTREAM_PACKAGE_MANAGER_NOT_EXPECTED',pre,2);
 }else if(existsSync(dst)){
   let version=null;
   try{
     if(!lstatSync(cli).isSymbolicLink()&&statSync(cli).isFile()){
       const r=spawnSync(process.execPath,[cli,'--version'],
         {encoding:'utf8',timeout:8000,stdio:['ignore','pipe','ignore']});
       if(r.status===0)version=r.stdout.trim();
     }
   }catch{}
   status(version==='11.13.0'?'ISOLATED_NPM11_ALREADY_VERIFIED':'ISOLATED_TOOL_DIR_EXISTS_NEEDS_AUDIT',
     {...pre,observedVersion:version},version==='11.13.0'?0:2);
 }else if(!apply){
   status('ISOLATED_NPM11_READY_TO_STAGE',pre);
 }else if(diskFree<2*1024**3||memFree<1024**3){
   status('RESOURCE_GUARD_DENIED',pre,2);
 }else{
   // Only the isolated tools parent may be created; never touch upstream.
   mkdirSync(tools,{recursive:true,mode:0o700});
   if(lstatSync(tools).isSymbolicLink()){
     status('TOOLS_PARENT_SYMLINK_DENIED',pre,2);
   }else{
     const stage=mkdtempSync(path.join(tools,'.npm11-stage-'));
     const env={
       HOME:os.homedir(),PATH:process.env.PATH||'/usr/bin:/bin',
       LANG:'C.UTF-8',LC_ALL:'C.UTF-8',
       NODE_OPTIONS:'--max-old-space-size=1024',
       npm_config_audit:'false',npm_config_fund:'false',
       npm_config_maxsockets:'2',npm_config_userconfig:'/dev/null',
       npm_config_globalconfig:'/dev/null'
     };
     const installArgs=args.map(x=>x==='STAGE'?stage:x);
     const result=spawnSync('npm',installArgs,{cwd:stage,env,
       timeout:12*60_000,stdio:'inherit'});
     const stagedCli=path.join(stage,'node_modules','npm','bin','npm-cli.js');
     let version=null;
     if(result.status===0&&existsSync(stagedCli)){
       const verify=spawnSync(process.execPath,[stagedCli,'--version'],
         {encoding:'utf8',timeout:12000,stdio:['ignore','pipe','ignore']});
       if(verify.status===0)version=verify.stdout.trim();
     }
     if(version!=='11.13.0'){
       status('ISOLATED_NPM11_INSTALL_INCOMPLETE',{
         ...pre,exitCode:result.status,observedVersion:version,
         preservedStage:stage,mutatedOnlyPrivateStage:true},2);
     }else{
       try{
         // Do not overwrite any existing owner toolchain.
         if(existsSync(dst))throw Error('DESTINATION_RACE');
         renameSync(stage,dst);
         status('ISOLATED_NPM11_STAGED_VERIFIED',{
           ...pre,observedVersion:version,toolCli:cli,mutatedOnlyPrivateToolchain:true});
       }catch(e){
         status('ISOLATED_NPM11_PROMOTION_BLOCKED',{
           ...pre,preservedStage:stage,error:String(e?.message||'PROMOTION_ERROR')},2);
       }
     }
   }
 }
}
