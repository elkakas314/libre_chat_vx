#!/usr/bin/env node
/** Reconcile the EXISTING LibreChat VX workspace. No reinstall, no service start.
 * Default is READ-ONLY. --apply requires preflight+backup and performs a
 * staged build before atomically switching the package directory.
 * The original entire workspace is moved (not deleted) to a private backup.
 */
import {execFileSync} from 'node:child_process';
import {
  chmodSync,cpSync,existsSync,lstatSync,mkdtempSync,readFileSync,
  readdirSync,realpathSync,renameSync,rmSync,statSync
} from 'node:fs';
import {homedir} from 'node:os';
import {linkHostTypeDeclarations,clearStagedTypeLinks} from './stage-react-types.mjs';
import {isWorkspaceNoop} from './workspace-noop-gate.mjs';
import path from 'node:path';

const EXPECTED_UPSTREAM='f10b1d91f1eee3a2c82d5247bf620351486b7c1b';
const VX=realpathSync(process.cwd());
const targetArg=process.argv.find(a=>a.startsWith('--upstream='));
const UP=path.resolve(targetArg?targetArg.slice('--upstream='.length):'../upstream');
const APPLY=process.argv.includes('--apply');
const DIAGNOSE=process.argv.includes('--diagnose');
if(APPLY&&DIAGNOSE)throw Error('BLOCKED:APPLY_AND_DIAGNOSE_ARE_EXCLUSIVE');
const allowed=['package.json','tsconfig.json','src','contracts','config'];
const pack=path.join(UP,'packages/librechat-vx');
const sourceUi=path.join(VX,'overlay/upstream');
const installedUi=path.join(UP,'client/src/components/VX');
function stop(reason){throw Error('BLOCKED:'+reason);}
function safeDir(p){
  if(!existsSync(p))stop('DIRECTORY_MISSING:'+p);
  if(lstatSync(p).isSymbolicLink()||!statSync(p).isDirectory())stop('DIR_INVALID:'+p);
}
function sha(dir){return execFileSync('git',['-C',dir,'rev-parse','HEAD'],{
  encoding:'utf8',timeout:10000,stdio:['ignore','pipe','ignore']
}).trim();}
function walkFiles(dir,prefix=''){
  const result=[];
  for(const e of readdirSync(dir,{withFileTypes:true})){
    if(e.isSymbolicLink())stop('SYMLINK_IN_WORKSPACE:'+path.join(prefix,e.name));
    const rel=path.join(prefix,e.name),abs=path.join(dir,e.name);
    if(e.isDirectory())result.push(...walkFiles(abs,rel));
    else if(e.isFile())result.push(rel);
    else stop('SPECIAL_FILE_IN_WORKSPACE:'+rel);
  }
  return result;
}
function sourceFileSet(){
  const x=new Set();
  for(const item of allowed){
    const p=path.join(VX,item);
    if(!existsSync(p))stop('VX_ENTRY_MISSING:'+item);
    if(lstatSync(p).isSymbolicLink())stop('SOURCE_SYMLINK:'+item);
    if(statSync(p).isDirectory())for(const rel of walkFiles(p))x.add(path.join(item,rel));
    else x.add(item);
  }
  return x;
}
function check(){
  safeDir(UP);safeDir(pack);safeDir(VX);
  if(realpathSync(UP)===VX)stop('SAME_REPOSITORY');
  if(sha(UP)!==EXPECTED_UPSTREAM)stop('UPSTREAM_COMMIT_MISMATCH');
  const marker=path.join(UP,'.librechat-vx-overlay.json');
  if(!existsSync(marker)||lstatSync(marker).isSymbolicLink())stop('OVERLAY_MARKER_MISSING');
  const j=JSON.parse(readFileSync(marker,'utf8'));
  if(j.upstreamCommit!==EXPECTED_UPSTREAM||j.packagePath!=='packages/librechat-vx')stop('OVERLAY_IDENTITY_MISMATCH');
  if(!readFileSync(path.join(UP,'client/src/components/Chat/Presentation.tsx'),'utf8').includes('VXCockpitBridge'))
    stop('NATIVE_PRESENTATION_NOT_CONNECTED');
  const client=JSON.parse(readFileSync(path.join(UP,'client/package.json'),'utf8'));
  if(!client.dependencies||!Object.hasOwn(client.dependencies,'@librechat/vx'))
    stop('CLIENT_WORKSPACE_DEPENDENCY_MISSING');
  for(const name of ['VXCockpitBridge.tsx','VXCockpit.css']){
    const from=path.join(sourceUi,name),to=path.join(installedUi,name);
    if(!existsSync(from)||!existsSync(to))stop('UI_FILE_MISSING:'+name);
    if(lstatSync(to).isSymbolicLink())stop('UI_FILE_SYMLINK:'+name);
    if(!readFileSync(from).equals(readFileSync(to)))stop('UI_OUT_OF_SYNC:'+name);
  }
  for(const item of allowed){
    const p=path.join(pack,item);
    if(!existsSync(p)||lstatSync(p).isSymbolicLink())stop('WORKSPACE_ITEM_MISSING_OR_SYMLINK:'+item);
  }
  const newSet=sourceFileSet(),oldSet=new Set();
  for(const item of allowed){
    const p=path.join(pack,item);
    if(statSync(p).isDirectory())for(const rel of walkFiles(p))oldSet.add(path.join(item,rel));
    else oldSet.add(item);
  }
  const uniqueOld=[...oldSet].filter(p=>!newSet.has(p)).sort();
  if(uniqueOld.length)stop('UNIQUE_OLD_SOURCE_FILES:'+JSON.stringify(uniqueOld.slice(0,25)));
  const tsc=path.join(UP,'node_modules/.bin/tsc');
  if(!existsSync(tsc))stop('TSC_NOT_INSTALLED_IN_EXISTING_UPSTREAM');
  return {schema:'nostromo.existing-workspace.v1',readOnly:!APPLY&&!DIAGNOSE,
    upstream:UP,source:VX,upstreamHead:sha(UP),
    existingWorkspace:pack,sourceFiles:newSet.size,existingFiles:oldSet.size,
    changedSources:[...newSet].filter(p=>!oldSet.has(p)||
      !readFileSync(path.join(VX,p)).equals(readFileSync(path.join(pack,p)))).length,
    ui:'MATCHED',configUnchanged:true,servicesUnchanged:true};
}
let stage=null,backup=null,originalMoved=false,installed=false;
try{
  const scan=check();
  // A repeated apply of byte-identical source is not a new installation.
  // Do not stage, build, rename or create another ~/nostromo-workspace-backup.*.
  if(APPLY&&isWorkspaceNoop(scan)){
    console.log(JSON.stringify({...scan,
      status:'ALREADY_RECONCILED_NO_BACKUP',
      build:'PREVIOUS_INSTALL_NOT_REBUILT',
      installed:true,backup:null,backupCreated:false,
      note:'Exact source identity confirmed; installation unchanged'},null,2));
    process.exit(0);
  }
  if(!APPLY&&!DIAGNOSE){
    console.log(JSON.stringify({...scan,status:'PREVIEW_ONLY',next:'REVIEW_THEN_APPLY'},null,2));
    process.exit(0);
  }
  // Stage and build first, while the old workspace remains intact.
  const folder=path.dirname(pack);
  safeDir(folder);
  stage=mkdtempSync(path.join(folder,'.nostromo-stage-'));
  chmodSync(stage,0o700);
  for(const item of allowed)cpSync(path.join(VX,item),path.join(stage,item),{recursive:true,errorOnExist:true});
  const reactTypes=linkHostTypeDeclarations({stage,upstream:UP,vx:VX});
  // Compiler stdout/stderr must be returned to the operator on failure:
  // CI may be green while host dependencies differ. Never label this PASS.
  let compilerOutput='';
  try{
    compilerOutput=execFileSync(path.join(UP,'node_modules/.bin/tsc'),['-p','tsconfig.json'],{
      cwd:stage,stdio:['ignore','pipe','pipe'],encoding:'utf8',timeout:180000,maxBuffer:1024*1024
    });
  }catch(e){
    const message=[e?.stdout,e?.stderr].filter(Boolean).map(String).join('\n');
    const sanitized=message
      .replace(/gh[pousr]_[A-Za-z0-9]{24,}/g,'[REDACTED_GH_TOKEN]')
      .replace(/github_pat_[A-Za-z0-9_]{25,}/g,'[REDACTED_GH_TOKEN]')
      .replace(/sk-(?:proj-)?[A-Za-z0-9_-]{24,}/g,'[REDACTED_API_KEY]');
    process.stderr.write('NOSTROMO_TSC_DIAGNOSTICS_BEGIN\n'+
      sanitized.slice(0,16000)+'\nNOSTROMO_TSC_DIAGNOSTICS_END\n');
    process.stderr.write('TSC_EXIT='+String(e?.status??'UNKNOWN')+
      '; NODE='+process.version+'; UPSTREAM_TSC='+path.join(UP,'node_modules/.bin/tsc')+'\n');
    stop('TSC_BUILD_FAILED');
  }
  clearStagedTypeLinks(stage);
  if(DIAGNOSE){
    console.log(JSON.stringify({...scan,status:'DIAGNOSE_COMPILE_PASS',
      typeDeclarations:reactTypes,
      build:'PASS',installed:false,existingWorkspaceUnchanged:true,
      compilerOutput:compilerOutput.slice(0,2048)},null,2));
  }else{
  if(!existsSync(path.join(stage,'dist/src/index.js')))stop('COMPILED_ENTRY_MISSING');
  // Last snapshot: keep the original whole package instead of rm/clean.
  backup=mkdtempSync(path.join(homedir(),'nostromo-workspace-backup.'));
  chmodSync(backup,0o700);
  chmodSync(stage,statSync(pack).mode&0o777);
  renameSync(pack,path.join(backup,'original-package'));
  originalMoved=true;
  try{renameSync(stage,pack);installed=true;stage=null;}
  catch(e){
    renameSync(path.join(backup,'original-package'),pack);
    originalMoved=false;throw e;
  }
  // Verify actual copied source after the switch; keep both versions on mismatch.
  for(const rel of sourceFileSet()){
    if(!readFileSync(path.join(VX,rel)).equals(readFileSync(path.join(pack,rel)))){
      renameSync(pack,path.join(backup,'rejected-package'));
      renameSync(path.join(backup,'original-package'),pack);
      originalMoved=false;installed=false;
      stop('POST_SWITCH_READBACK_MISMATCH:'+rel);
    }
  }
  console.log(JSON.stringify({...scan,status:'WORKSPACE_RECONCILED',
    build:'PASS',backup,installedWorkspace:pack,
    note:'Frontend, database, agent, OAuth and MCP binding not started or changed'},null,2));
  }
}catch(e){
  if(originalMoved&&!installed&&!existsSync(pack)&&backup){
    try{renameSync(path.join(backup,'original-package'),pack);}
    catch(recoveryError){process.stderr.write('RESTORE_REQUIRED: '+String(recoveryError)+'\n');}
  }
  process.stderr.write('NOSTROMO_WORKSPACE_BLOCKED: '+String(e?.message||e)+'\n');
  process.exitCode=1;
}finally{
  if(stage&&existsSync(stage))rmSync(stage,{recursive:true,force:true});
}
