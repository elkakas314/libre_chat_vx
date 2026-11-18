#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { constants, copyFileSync, existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export const PINNED_UPSTREAM='f10b1d91f1eee3a2c82d5247bf620351486b7c1b';
export const TARGETS={
  routesIndex:'api/server/routes/index.js',
  serverIndex:'api/server/index.js',
  routeModule:'api/server/routes/nostromo-siwc.js',
};
export const BASE_SHA256={
  routesIndex:'b003cefcb1c7f00b711e3febc45ce493f9282aa56c33dee3f43d9be1a1f6effa',
  serverIndex:'7ace779867986d2c7313cca7930486d352093a8fd2537ef919f2996dca24da57',
};
const marker='NOSTROMO_SIWC_ROUTE_MOUNT_V1';
const here=dirname(fileURLToPath(import.meta.url));

function sha(value){return createHash('sha256').update(value).digest('hex');}

export function patchRoutesIndex(source){
  if(source.includes(marker))return source;
  if(sha(source)!==BASE_SHA256.routesIndex)throw Error('SIWC_ROUTES_INDEX_SOURCE_MISMATCH');
  const importAnchor="const mcp = require('./mcp');";
  const exportAnchor='  mcp,\n  auth,';
  if(source.split(importAnchor).length!==2||source.split(exportAnchor).length!==2)
    throw Error('SIWC_ROUTES_INDEX_CONTEXT_MISMATCH');
  return source.replace(importAnchor,`${importAnchor}\n// ${marker}\nconst siwc = require('./nostromo-siwc');`)
    .replace(exportAnchor,'  mcp,\n  siwc,\n  auth,');
}

export function patchServerIndex(source){
  if(source.includes(marker))return source;
  if(sha(source)!==BASE_SHA256.serverIndex)throw Error('SIWC_SERVER_INDEX_SOURCE_MISMATCH');
  const anchor="  app.use('/api/mcp', routes.mcp);";
  if(source.split(anchor).length!==2)throw Error('SIWC_SERVER_INDEX_CONTEXT_MISMATCH');
  return source.replace(anchor,`${anchor}\n  // ${marker}\n  app.use('/api/nostromo/siwc', routes.siwc);`);
}

export function rollbackSiwcRoutes(current,preimages,routeModule){
  if(!preimages||sha(preimages.routesIndex)!==BASE_SHA256.routesIndex||
    sha(preimages.serverIndex)!==BASE_SHA256.serverIndex||
    current.routesIndex!==patchRoutesIndex(preimages.routesIndex)||
    current.serverIndex!==patchServerIndex(preimages.serverIndex)||
    routeModule!==readFileSync(resolve(here,'nostromo-siwc-route.cjs'),'utf8'))
    throw Error('SIWC_ROUTES_ROLLBACK_READBACK_MISMATCH');
  return {...preimages,routeModule:null};
}

function stage(upstreamRoot){
  if(process.env.NOSTROMO_CI_EPHEMERAL_STAGE!=='1')throw Error('SIWC_ROUTES_STAGE_CI_ONLY');
  const root=resolve(upstreamRoot);
  const head=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  if(head!==PINNED_UPSTREAM)throw Error('SIWC_ROUTES_UPSTREAM_MISMATCH');
  const files=Object.fromEntries(Object.entries(TARGETS).map(([key,rel])=>[key,resolve(root,rel)]));
  if(existsSync(files.routeModule))throw Error('SIWC_ROUTES_TARGET_ALREADY_EXISTS');
  const before={routesIndex:readFileSync(files.routesIndex,'utf8'),serverIndex:readFileSync(files.serverIndex,'utf8')};
  const after={routesIndex:patchRoutesIndex(before.routesIndex),serverIndex:patchServerIndex(before.serverIndex)};
  const routeModule=readFileSync(resolve(here,'nostromo-siwc-route.cjs'),'utf8');
  const backupSuffix='.nostromo-siwc-routes-preimage';
  const staged=[];
  try{
    for(const key of ['routesIndex','serverIndex']){
      const file=files[key];
      const backup=`${file}${backupSuffix}`;
      copyFileSync(file,backup,constants.COPYFILE_EXCL);
      const temporary=`${file}.nostromo-siwc-routes.tmp`;
      writeFileSync(temporary,after[key],{mode:0o644,flag:'wx'});
      renameSync(temporary,file);
      staged.push(key);
    }
    writeFileSync(files.routeModule,routeModule,{mode:0o644,flag:'wx'});
    for(const key of ['routesIndex','serverIndex'])
      if(sha(readFileSync(`${files[key]}${backupSuffix}`,'utf8'))!==BASE_SHA256[key]||
        readFileSync(files[key],'utf8')!==after[key])throw Error('SIWC_ROUTES_READBACK_FAILED');
    if(readFileSync(files.routeModule,'utf8')!==routeModule)throw Error('SIWC_ROUTE_MODULE_READBACK_FAILED');
  }catch(error){
    for(const key of staged.reverse()){
      const backup=`${files[key]}${backupSuffix}`;
      if(existsSync(backup))renameSync(backup,files[key]);
    }
    if(existsSync(files.routeModule))unlinkSync(files.routeModule);
    throw error;
  }
  process.stdout.write('SIWC_AUTHENTICATED_ROUTES_CI_STAGE_PASS\n');
}

if(process.argv[1]&&resolve(process.argv[1])===resolve(fileURLToPath(import.meta.url))){
  try{
    if(process.argv[2]!=='--apply'||!process.argv[3])
      throw Error('USAGE: nostromo-siwc-routes.mjs --apply <upstream-root>');
    stage(process.argv[3]);
  }catch(error){
    process.stderr.write(`${error instanceof Error?error.message:'SIWC_ROUTES_STAGE_FAILED'}\n`);
    process.exitCode=2;
  }
}
