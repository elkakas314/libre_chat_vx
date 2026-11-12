#!/usr/bin/env node
/**
 * SOURCE-only mounting harness for the exact pinned LibreChat revision.
 *
 * This is NOT the host installer. The legacy installer remains disabled.
 * It refuses execution except from a clean GitHub Actions disposable checkout
 * consisting of siblings GITHUB_WORKSPACE/vx and GITHUB_WORKSPACE/upstream.
 * No deletes, restores, shell, network calls, or traversal of user backups.
 */
import {execFileSync} from 'node:child_process';
import {
  cpSync,existsSync,lstatSync,mkdirSync,readFileSync,readdirSync,
  realpathSync,writeFileSync
} from 'node:fs';
import {resolve,join,dirname} from 'node:path';

const EXPECTED_UPSTREAM='f10b1d91f1eee3a2c82d5247bf620351486b7c1b';
const EXPECTED_PRESENTATION_BLOB='46a176099fa1e6ae1afae709c559a42a19c719fa';
const SOURCE_ENTRIES=['package.json','tsconfig.json','src','contracts','config'];
const UI_NAMES=['VXCockpitBridge.tsx','VXCockpit.css'];
const IMPORT_ANCHOR="import AppChatSurface from '~/components/Chat/Surface';";
const REACT_IMPORT_ANCHOR="import { lazy, Suspense, useCallback, useEffect, useMemo, useRef } from 'react';";
const REF_ANCHOR='  const previousConversationIdRef = useRef<string | null>(null);';
const MAIN_ANCHOR='            <main className="flex h-full flex-col overflow-y-auto" role="main">\n              {children}';
const PANEL_ANCHOR='const panelElement = artifactsElement ?? subagentElement;';

function refuse(code){throw Error('NOSTROMO_CI_STAGE_REFUSED:'+code);}
function git(root,...args){
  return execFileSync('git',['-C',root,...args],{
    encoding:'utf8',timeout:10000,stdio:['ignore','pipe','pipe'],
    env:{...process.env,GIT_TERMINAL_PROMPT:'0',GIT_OPTIONAL_LOCKS:'0'}
  }).trim();
}
function regular(file){
  if(!existsSync(file)||lstatSync(file).isSymbolicLink()||!lstatSync(file).isFile())
    refuse('SOURCE_NOT_REGULAR:'+file.split('/').slice(-2).join('/'));
}
function directory(file){
  if(!existsSync(file)||lstatSync(file).isSymbolicLink()||!lstatSync(file).isDirectory())
    refuse('DIR_UNSAFE');
}
function noSymlinks(root) {
  directory(root);
  for(const entry of readdirSync(root,{withFileTypes:true})){
    if(entry.isSymbolicLink())refuse('SOURCE_SYMLINK');
    const p=join(root,entry.name);
    if(entry.isDirectory())noSymlinks(p);
    else if(!entry.isFile())refuse('SOURCE_SPECIAL_FILE');
  }
}
function uniqueOccurrence(text,anchor,label){
  if(text.split(anchor).length!==2)refuse(label+'_NOT_UNIQUE');
}

function main(argv=process.argv.slice(2),env=process.env){
  if(argv.length!==1||argv[0]!=='--stage')refuse('UNKNOWN_OR_MISSING_MODE');
  if(env.GITHUB_ACTIONS!=='true'||env.NOSTROMO_CI_EPHEMERAL_STAGE!=='1'||
     !env.GITHUB_WORKSPACE||!env.RUNNER_TEMP)
    refuse('ONLY_IN_EXPLICIT_GITHUB_ACTIONS_RUNNER');
  const workspace=resolve(env.GITHUB_WORKSPACE);
  if(realpathSync(workspace)!==workspace)refuse('WORKSPACE_SYMLINK');
  const vx=join(workspace,'vx'),upstream=join(workspace,'upstream');
  if(realpathSync(process.cwd())!==vx)refuse('WRONG_VX_CWD');
  directory(vx);directory(upstream);
  if(realpathSync(vx)!==vx||realpathSync(upstream)!==upstream)
    refuse('CHECKOUT_SYMLINK');
  if(resolve(env.RUNNER_TEMP).startsWith(vx+'/')||
     resolve(env.RUNNER_TEMP).startsWith(upstream+'/'))
    refuse('RUNNER_TEMP_MUST_BE_SEPARATE');
  if(git(upstream,'rev-parse','HEAD')!==EXPECTED_UPSTREAM)
    refuse('UPSTREAM_COMMIT_MISMATCH');
  if(git(upstream,'status','--porcelain')!=='')
    refuse('UPSTREAM_HAS_UNIQUE_OR_DIRTY_FILES');
  if(git(upstream,'rev-parse','HEAD:client/src/components/Chat/Presentation.tsx')
      !==EXPECTED_PRESENTATION_BLOB)
    refuse('PRESENTATION_BLOB_MISMATCH');

  const packages=join(upstream,'packages');
  const packageRoot=join(packages,'librechat-vx');
  const bridgeParent=join(upstream,'client/src/components');
  const bridgeRoot=join(bridgeParent,'VX');
  const marker=join(upstream,'.librechat-vx-overlay.json');
  const presentationPath=join(upstream,'client/src/components/Chat/Presentation.tsx');
  const clientPackagePath=join(upstream,'client/package.json');
  directory(packages);directory(bridgeParent);
  for(const target of [packageRoot,bridgeRoot,marker])
    if(existsSync(target))refuse('TARGET_ALREADY_EXISTS_PRESERVE');
  regular(presentationPath);regular(clientPackagePath);
  const presentation=readFileSync(presentationPath,'utf8');
  uniqueOccurrence(presentation,IMPORT_ANCHOR,'IMPORT_ANCHOR');
  uniqueOccurrence(presentation,REACT_IMPORT_ANCHOR,'REACT_IMPORT');
  uniqueOccurrence(presentation,REF_ANCHOR,'REF_ANCHOR');
  uniqueOccurrence(presentation,MAIN_ANCHOR,'MAIN_CONTENT');
  uniqueOccurrence(presentation,PANEL_ANCHOR,'PANEL_ANCHOR');

  const pkg=JSON.parse(readFileSync(clientPackagePath,'utf8'));
  if(!pkg||typeof pkg!=='object'||Array.isArray(pkg))
    refuse('UPSTREAM_CLIENT_PACKAGE_INVALID');
  if(pkg.dependencies && Object.hasOwn(pkg.dependencies,'@librechat/vx'))
    refuse('EXISTING_VX_DEPENDENCY_PRESERVE');
  for(const name of SOURCE_ENTRIES){
    const source=join(vx,name);
    if(name==='src'||name==='contracts'||name==='config')noSymlinks(source);
    else regular(source);
  }
  for(const name of UI_NAMES)regular(join(vx,'overlay/upstream',name));

  // All preflights complete, and only previously absent CI-runner targets
  // are created. No cleanup operation is supplied; the runner is disposable.
  mkdirSync(packageRoot);
  for(const item of SOURCE_ENTRIES){
    cpSync(join(vx,item),join(packageRoot,item),{
      recursive:true,errorOnExist:true,force:false
    });
  }
  mkdirSync(bridgeRoot);
  for(const name of UI_NAMES){
    cpSync(join(vx,'overlay/upstream',name),join(bridgeRoot,name),{
      errorOnExist:true,force:false
    });
  }
  pkg.dependencies ??= {};
  pkg.dependencies['@librechat/vx']='*';
  writeFileSync(clientPackagePath,JSON.stringify(pkg,null,2)+'\n',{flag:'w'});
  const newPresentation=presentation
    .replace(REACT_IMPORT_ANCHOR,
      "import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';")
    .replace(IMPORT_ANCHOR,
      IMPORT_ANCHOR+"\nimport VXCockpitBridge from '~/components/VX/VXCockpitBridge';")
    .replace(REF_ANCHOR, REF_ANCHOR + `
  const [vxEnabled,setVxEnabled] = useState(false);
  const [vxPanelOpen,setVxPanelOpen] = useState(false);
  const vxLauncherRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    try { setVxEnabled(window.localStorage.getItem('librechat-vx-cockpit') === '1'); }
    catch { setVxEnabled(false); }
  }, []);
  const closeVxPanel = useCallback(() => {
    setVxPanelOpen(false);
    window.requestAnimationFrame(() => vxLauncherRef.current?.focus());
  }, []);
  useEffect(() => { setVxPanelOpen(false); }, [conversationId]);`)
    .replace(PANEL_ANCHOR,
      'const vxCockpitElement = vxEnabled && vxPanelOpen\n'+
      '    ? <VXCockpitBridge onClose={closeVxPanel} /> : null;\n  '+
      'const panelElement = artifactsElement ?? subagentElement ?? vxCockpitElement;')
    .replace(MAIN_ANCHOR,
      `            <main className="flex h-full flex-col overflow-y-auto" role="main">
              {vxEnabled ? (
                <button
                  ref={vxLauncherRef}
                  type="button"
                  className="vx-context-launcher"
                  aria-label="Abrir contexto NOSTROMO"
                  aria-expanded={vxPanelOpen && artifactsElement == null && subagentElement == null}
                  disabled={artifactsElement != null || subagentElement != null}
                  onClick={() => setVxPanelOpen(true)}
                >Contexto NOSTROMO</button>
              ) : null}
              {children}`);
  writeFileSync(presentationPath,newPresentation,{flag:'w'});
  writeFileSync(marker,JSON.stringify({
    schema:'nostromo.ci-only.overlay-stage.v1',
    upstreamCommit:EXPECTED_UPSTREAM,
    packagePath:'packages/librechat-vx',
    source:'GITHUB_ACTIONS_EPHEMERAL_ONLY',
    installOnHost:false,
    mutationEnabled:false
  },null,2)+'\n',{flag:'wx'});

  if(!existsSync(join(packageRoot,'src'))||
     !existsSync(join(bridgeRoot,'VXCockpitBridge.tsx'))||
     !readFileSync(presentationPath,'utf8').includes('VXCockpitBridge'))
    refuse('STAGED_READBACK_FAILED');
  console.log(JSON.stringify({
    schema:'nostromo.ci-only.overlay-stage.v1',
    status:'SOURCE_STAGED_CI_RUNNER_ONLY',
    upstream:EXPECTED_UPSTREAM,
    sourceEntries:SOURCE_ENTRIES.length,
    visualFiles:UI_NAMES.length,
    nativePriorityPreserved:true,
    hostEffects:false,
    installedOnLenovo:false,
    nativeRuntimeVerified:false
  }));
}

try{main();}catch(error){
  process.stderr.write(String(error?.message||error).slice(0,350)+'\n');
  process.exitCode=2;
}
