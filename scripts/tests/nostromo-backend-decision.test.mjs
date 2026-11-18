import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {decideBackend,SCHEMA} from '../nostromo-backend-decision-r0.mjs';
const GiB=1024**3;
const now=new Date('2026-11-11T12:00:00Z');
const sample=()=>({schema:'nostromo.backend-preflight.v1',readOnly:true,secretValuesRead:false,
 servicesStarted:false,acceptance:'PRECHECK_ONLY_NOT_INSTALLATION_OR_LIVE_VERIFICATION',
 observedAt:'2026-11-11T11:50:00.000Z',runtime:{nodeVersion:'v24.16.0',npmVersion:'11.13.0',
 platform:'linux',arch:'x64'},cpu:{avx:true},paths:{vx:'DIRECTORY',upstream:'DIRECTORY',
 upstreamPackage:'FILE',envPresence:'FILE',yamlPresence:'ABSENT'},
 resources:{memoryFreeBytes:3*GiB,disk:{availableBytes:5*GiB}},
 listeners:{mongo27017:'REFUSED',librechat3080:'REFUSED'},
 userServices:{status:'READ_OK',matchingUnits:[]}});

test('eligible snapshot only permits staging decision, never installation',()=>{
 const result=decideBackend(sample(),{now});
 assert.equal(result.schema,SCHEMA);
 assert.equal(result.status,'STAGING_CANDIDATE_NOT_INSTALL_READY');
 assert.equal(result.installAllowed,false);
 assert.equal(result.liveVerified,false);
 assert.deepEqual(result.blockers,[]);
 assert.ok(result.required.includes('PLAN_ONE_PERSISTENT_MONGODB_ONLY_AFTER_AVX_AND_DATA_AUDIT'));
 assert.ok(result.excludedByDefault.includes('RAG'));
});

test('rejects stale, future, malformed and forged preflight',()=>{
 for(const mutate of [
  x=>{x.observedAt='2026-11-08T00:00:00Z';},
  x=>{x.observedAt='2026-11-12T00:00:00Z';},
  x=>{x.schema='wrong';},
  x=>{x.servicesStarted=true;},
  x=>{x.secretValuesRead=true;},
 ]){
  const x=sample();mutate(x);
  const result=decideBackend(x,{now});
  assert.equal(result.status,'INVALID_OR_STALE_PREFLIGHT');
  assert.equal(result.installAllowed,false);
 }
});

test('host Node22 AVX missing and RAM/disk constraints block staging',()=>{
 const x=sample();x.runtime.nodeVersion='v22.23.2';x.cpu.avx=false;
 x.resources.memoryFreeBytes=100;x.resources.disk.availableBytes=200;
 const result=decideBackend(x,{now});
 assert.equal(result.status,'STAGING_BLOCKED');
 assert.ok(result.blockers.includes('PINNED_NODE_NOT_ACTIVE_NO_GLOBAL_UPDATE'));
 assert.ok(result.blockers.includes('MONGODB5_AVX_UNSUPPORTED'));
 assert.ok(result.blockers.includes('FREE_MEMORY_BELOW_STAGE_GUARD'));
 assert.ok(result.blockers.includes('DISK_BELOW_STAGE_GUARD'));
});

test('existing named service and TCP listeners require identity readback',()=>{
 const x=sample();x.userServices.matchingUnits=[{unit:'librechat.service',active:'active'}];
 x.listeners.mongo27017='TCP_CONNECTED_PROTOCOL_UNVERIFIED';
 x.listeners.librechat3080='TCP_CONNECTED_PROTOCOL_UNVERIFIED';
 const result=decideBackend(x,{now});
 assert.equal(result.installAllowed,false);
 assert.ok(result.required.includes('VERIFY_EXISTING_SERVICE_OWNERSHIP_AND_PROCESS_BEFORE_ANY_START'));
 assert.ok(result.required.includes('VERIFY_EXISTING_MONGO_PROTOCOL_AUTH_DATA_AND_BACKUPS'));
 assert.ok(result.required.includes('IDENTIFY_EXISTING_3080_BACKEND_AND_AUTH_BEFORE_REUSE'));
});

test('CLI receives JSON on stdin only and fails closed for invalid data',()=>{
 const result=spawnSync(process.execPath,[new URL('../nostromo-backend-decision-r0.mjs',import.meta.url).pathname],
 {input:'{"schema":"invalid"}',encoding:'utf8',timeout:5000});
 assert.equal(result.status,2);
 assert.equal(JSON.parse(result.stdout).installAllowed,false);
});
