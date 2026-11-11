#!/usr/bin/env node
/** NOSTROMO N-B1: pure R0 decision from N-B0 evidence; NEVER installs or starts. */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const SCHEMA='nostromo.backend-decision.r0.v1';
const MiB=1024*1024;
const GiB=1024*MiB;
const EXACT_NODE='v24.16.0';
const EXACT_NPM='11.13.0';
const MAX_AGE_MS=24*60*60*1000;

export function decideBackend(snapshot,{now=new Date()}={}){
 const invalid=(reason)=>({schema:SCHEMA,status:'INVALID_OR_STALE_PREFLIGHT',reason,
   readOnly:true,installAllowed:false,backendStarted:false,mongoStarted:false,
   liveVerified:false});
 if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot)||
    snapshot.schema!=='nostromo.backend-preflight.v1'||
    snapshot.readOnly!==true||snapshot.secretValuesRead!==false||
    snapshot.servicesStarted!==false||
    snapshot.acceptance!=='PRECHECK_ONLY_NOT_INSTALLATION_OR_LIVE_VERIFICATION')
  return invalid('N_B0_SCHEMA_OR_SAFETY_FLAGS');
 if(typeof snapshot.observedAt!=='string'||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(snapshot.observedAt))
  return invalid('N_B0_TIMESTAMP_MISSING');
 const age=now.getTime()-Date.parse(snapshot.observedAt);
 if(!Number.isFinite(age)||age<0||age>MAX_AGE_MS)return invalid('N_B0_NOT_FRESH');
 const runtime=snapshot.runtime||{},cpu=snapshot.cpu||{},paths=snapshot.paths||{};
 const resource=snapshot.resources||{},ports=snapshot.listeners||{},services=snapshot.userServices||{};
 const blockers=[];const required=[];const warnings=[];
 if(runtime.platform!=='linux'||runtime.arch!=='x64')blockers.push('HOST_OS_ARCH_NOT_VALIDATED');
 if(runtime.nodeVersion!==EXACT_NODE)blockers.push('PINNED_NODE_NOT_ACTIVE_NO_GLOBAL_UPDATE');
 if(runtime.npmVersion!==EXACT_NPM)blockers.push('PINNED_NPM_NOT_ACTIVE_NO_GLOBAL_UPDATE');
 if(cpu.avx!==true)blockers.push(cpu.avx===false?'MONGODB5_AVX_UNSUPPORTED':'AVX_UNVERIFIED');
 if(paths.upstream!=='DIRECTORY'||paths.upstreamPackage!=='FILE')blockers.push('UPSTREAM_SOURCE_UNAVAILABLE_OR_UNSAFE');
 if(paths.vx!=='DIRECTORY')blockers.push('VX_SOURCE_UNAVAILABLE_OR_UNSAFE');
 if(paths.envPresence!=='FILE')blockers.push('BACKEND_PRIVATE_ENV_ABSENT_OR_UNSAFE');
 if(paths.yamlPresence!=='FILE')warnings.push('LIBRECHAT_YAML_UNVERIFIED_MCP_LATER');
 const available=resource.memoryFreeBytes, disk=resource.disk?.availableBytes;
 if(!Number.isSafeInteger(available)||available<1.5*GiB)blockers.push('FREE_MEMORY_BELOW_STAGE_GUARD');
 if(!Number.isSafeInteger(disk)||disk<2*GiB)blockers.push('DISK_BELOW_STAGE_GUARD');
 if(services.status!=='READ_OK'||!Array.isArray(services.matchingUnits))
  blockers.push('SERVICE_IDENTITY_INVENTORY_UNAVAILABLE');
 const existing=Array.isArray(services.matchingUnits)?services.matchingUnits.filter(x=>
  x&&x.active==='active'&&typeof x.unit==='string'):[];
 if(existing.length)required.push('VERIFY_EXISTING_SERVICE_OWNERSHIP_AND_PROCESS_BEFORE_ANY_START');
 const connected='TCP_CONNECTED_PROTOCOL_UNVERIFIED';
 const mongoConnected=ports.mongo27017===connected;
 const backendConnected=ports.librechat3080===connected;
 required.push(mongoConnected?'VERIFY_EXISTING_MONGO_PROTOCOL_AUTH_DATA_AND_BACKUPS':
  'PLAN_ONE_PERSISTENT_MONGODB_ONLY_AFTER_AVX_AND_DATA_AUDIT');
 required.push(backendConnected?'IDENTIFY_EXISTING_3080_BACKEND_AND_AUTH_BEFORE_REUSE':
  'PLAN_SINGLE_BACKEND_FROM_PINNED_CHECKOUT');
 required.push('VERIFY_AUTH_PERSISTENCE_E2E_AND_ROLLBACK_BEFORE_LIVE');
 // Source/hardware eligibility is deliberately NOT authorization to install.
 return {schema:SCHEMA,status:blockers.length?'STAGING_BLOCKED':'STAGING_CANDIDATE_NOT_INSTALL_READY',
  evidenceAgeMs:age,readOnly:true,installAllowed:false,
  backendStarted:false,mongoStarted:false,liveVerified:false,
  pinned:{node:EXACT_NODE,npm:EXACT_NPM},
  hostPreflight:{arch:runtime.arch,platform:runtime.platform,avx:cpu.avx},
  existingBackendTcp:backendConnected,existingMongoTcp:mongoConnected,
  activeNamedUserServices:existing.map(x=>x.unit),
  blockers,warnings,required,
  scope:'ONE_EXISTING_LIBRECHAT_BACKEND_AND_ONE_PERSISTENT_MONGO_NO_DEFAULT_FULL_COMPOSE',
  excludedByDefault:['REDIS','RAG','VECTOR_DB','EXTERNAL_INGRESS'],
  note:'Port TCP is not Mongo/LibreChat protocol, identity, auth or persistence evidence.'};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let result;
 try{
  if(process.argv.length!==2)throw Error('UNKNOWN_ARGS');
  // A single bounded stdin JSON payload; do not read configurations or secrets.
  const input=readFileSync(0);
  if(input.byteLength>128*1024)throw Error('PREFLIGHT_TOO_LARGE');
  result=decideBackend(JSON.parse(input.toString('utf8')));
 }catch(e){result={schema:SCHEMA,status:'INVALID_OR_STALE_PREFLIGHT',
   reason:String(e.message||e),readOnly:true,installAllowed:false,liveVerified:false};}
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
 if(!['STAGING_CANDIDATE_NOT_INSTALL_READY'].includes(result.status))process.exitCode=2;
}
