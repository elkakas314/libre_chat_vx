import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PINNED_UPSTREAM, TARGETS, patchRoutesIndex, patchServerIndex,
  rollbackSiwcRoutes } from './nostromo-siwc-routes.mjs';

const root=process.env.NOSTROMO_UPSTREAM_ROOT;
if(!root)throw Error('NOSTROMO_UPSTREAM_ROOT_REQUIRED');
assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),PINNED_UPSTREAM);
const routesIndex=readFileSync(resolve(root,TARGETS.routesIndex),'utf8');
const serverIndex=readFileSync(resolve(root,TARGETS.serverIndex),'utf8');
const routeModule=readFileSync(new URL('./nostromo-siwc-route.cjs',import.meta.url),'utf8');
const bootstrapModule=readFileSync(new URL('./nostromo-siwc-bootstrap.cjs',import.meta.url),'utf8');

test('pinned upstream mounts the authenticated SIWC router once and is rollback-verifiable',()=>{
  const patchedRoutes=patchRoutesIndex(routesIndex);
  const patchedServer=patchServerIndex(serverIndex);
  assert.match(patchedRoutes,/nostromo-siwc/);
  assert.match(patchedRoutes,/SIWC_ROUTE_MOUNT_V1/);
  assert.match(patchedServer,/app\.use\('\/api\/nostromo\/siwc', routes\.siwc\)/);
  assert.match(patchedServer,/initializeNostromoSiwc\(app\)/);
  assert.equal(patchRoutesIndex(patchedRoutes),patchedRoutes);
  assert.equal(patchServerIndex(patchedServer),patchedServer);
  const restored=rollbackSiwcRoutes({routesIndex:patchedRoutes,serverIndex:patchedServer},
    {routesIndex,serverIndex},routeModule,bootstrapModule);
  assert.deepEqual(restored,{routesIndex,serverIndex,routeModule:null,bootstrapModule:null});
});

test('upstream route patch fails closed on drift and cannot stage outside disposable CI',()=>{
  assert.throws(()=>patchRoutesIndex(routesIndex+'\n'),/SIWC_ROUTES_INDEX_SOURCE_MISMATCH/);
  assert.throws(()=>patchServerIndex(serverIndex+'\n'),/SIWC_SERVER_INDEX_SOURCE_MISMATCH/);
  const env={...process.env};delete env.NOSTROMO_CI_EPHEMERAL_STAGE;
  assert.throws(()=>execFileSync(process.execPath,[new URL('./nostromo-siwc-routes.mjs',import.meta.url).pathname,
    '--apply',root],{env,encoding:'utf8',stdio:'pipe'}),/SIWC_ROUTES_STAGE_CI_ONLY/);
});
