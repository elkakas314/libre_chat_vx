import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createAsyncJobs} from '../async-jobs.mjs';
import {executeLocal} from '../policy.mjs';

const wait=async(check,attempts=75)=>{
  for(let i=0;i<attempts;i++){
    const value=check();
    if(value)return value;
    await new Promise(resolve=>setTimeout(resolve,20));
  }
  throw Error('ASYNC_TEST_TIMEOUT');
};
test('R0 async returns immediately, retains result and exact request hash',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-job-'));
 try{
  const jobs=createAsyncJobs();
  const start=await jobs.start({cwd:root,argv:['pwd'],timeout_s:5,max_output:1024},
    {settings:{enabled:true,roots:[root]},approvalDir:''});
  assert.equal(start.started,true);
  assert.equal(start.status,'RUNNING');
  assert.equal(start.persisted,false);
  assert.equal(start.requestHash.length,64);
  const final=await wait(()=>{
    const state=jobs.status(start.jobId);
    return state.finishedAt?state:null;
  });
  assert.equal(final.status,'EXIT_0');
  assert.equal(final.result.exitCode,0);
  assert.match(final.result.stdout,new RegExp(root));
  assert.equal(final.materialVerified,false);
  assert.equal(final.result.materialVerified,false);
  assert.equal(jobs.status('00000000-0000-0000-0000-000000000000').status,'NOT_FOUND');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('R2 requires an independent approval before async run',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-job-'));
 try{
  let approvalCalled=0;
  const jobs=createAsyncJobs({approve:async()=>{approvalCalled++;return false;}});
  const start=await jobs.start({cwd:root,argv:['/usr/bin/false'],timeout_s:5,max_output:1024},
    {settings:{enabled:true,roots:[root]},approvalDir:''});
  assert.equal(start.status,'LOCAL_APPROVAL_REQUIRED');
  assert.equal(start.started,false);
  assert.equal(approvalCalled,1);
  assert.equal(jobs.activeCount(),0);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('only one async job runs and cancel is observable, without retry',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-job-'));
 let settle;
 const execute=(_,opts)=>{opts.onOutput({stdout:'progreso: paso 1',stderr:'',truncated:false});
   return new Promise(resolve=>{settle=resolve;});};
 try{
  const jobs=createAsyncJobs({execute});
  const config={settings:{enabled:true,roots:[root]},approvalDir:''};
  const start=await jobs.start({cwd:root,argv:['pwd']},config);
  assert.equal(start.status,'RUNNING');
  assert.equal(jobs.activeCount(),1);
  const busy=await jobs.start({cwd:root,argv:['pwd']},config);
  assert.equal(busy.status,'BUSY');
  assert.equal(busy.started,false);
  await Promise.resolve();
  assert.match(jobs.status(start.jobId).liveOutput.stdout,/progreso: paso 1/);
  const cancel=jobs.cancel(start.jobId);
  assert.equal(cancel.status,'CANCEL_REQUESTED');
  assert.equal(jobs.cancel(start.jobId).status,'CANCEL_REQUESTED');
  settle({status:'CANCELLED',materialVerified:false});
  const final=await wait(()=>jobs.status(start.jobId).finishedAt?jobs.status(start.jobId):null);
  assert.equal(final.status,'CANCELLED');
  assert.equal(final.cancelRequested,true);
  assert.equal(jobs.activeCount(),0);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('real CLI cancellation terminates a spawned process group',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-cancel-'));
 try{
  const controller=new AbortController();
  const promise=executeLocal({cwd:root,argv:['/usr/bin/sleep','3'],timeout_s:8,max_output:256},
    {signal:controller.signal});
  controller.abort();
  const out=await promise;
  assert.equal(out.status,'CANCELLED');
  assert.equal(out.materialVerified,false);
  assert.ok(out.finishedAt);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('disabled scope and invalid root never create jobs',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-job-'));
 try{
  const jobs=createAsyncJobs();
  const req={cwd:root,argv:['pwd']};
  const a=await jobs.start(req,{settings:{enabled:false,roots:[root]},approvalDir:''});
  const b=await jobs.start(req,{settings:{enabled:true,roots:[]},approvalDir:''});
  assert.equal(a.status,'DISABLED');
  assert.equal(b.status,'DENIED');
  assert.equal(jobs.activeCount(),0);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('timeout returns no false success and does not auto-retry',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-timeout-'));
 try{
  const out=await executeLocal({cwd:root,argv:['/usr/bin/sleep','3'],timeout_s:1,max_output:256});
  assert.equal(out.status,'TIMEOUT');
  assert.equal(out.materialVerified,false);
  assert.ok(out.finishedAt);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('R2 admission reservation prevents simultaneous execution while approval pending',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-admission-'));
 let answer;
 try{
  const jobs=createAsyncJobs({approve:()=>new Promise(resolve=>{answer=resolve;})});
  const config={settings:{enabled:true,roots:[root]},approvalDir:''};
  const first=jobs.start({cwd:root,argv:['/usr/bin/false']},config);
  for(let i=0;i<20&&!answer;i++)await new Promise(r=>setTimeout(r,5));
  assert.equal(typeof answer,'function');
  const second=await jobs.start({cwd:root,argv:['pwd']},config);
  assert.equal(second.status,'BUSY');
  assert.equal(second.started,false);
  answer(false);
  assert.equal((await first).status,'LOCAL_APPROVAL_REQUIRED');
  assert.equal(jobs.activeCount(),0);
 }finally{await rm(root,{recursive:true,force:true});}
});


test('persistent job history survives a new MCP job manager and files stay private',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-job-store-'));
 const stateDir=path.join(root,'state');
 try{
  const jobs=createAsyncJobs({stateDir});
  assert.equal(jobs.storageStatus(),'READY');
  const started=await jobs.start({cwd:root,argv:['pwd'],timeout_s:5,max_output:1024},
    {settings:{enabled:true,roots:[root]},approvalDir:''});
  assert.equal(started.status,'RUNNING');
  assert.equal(started.persisted,true);
  const final=await wait(()=>{const v=jobs.status(started.jobId);return v.finishedAt?v:null;});
  assert.equal(final.status,'EXIT_0');
  assert.equal(final.persisted,true);
  const names=await readdir(stateDir);
  assert.deepEqual(names,[started.jobId+'.json']);
  const file=await stat(path.join(stateDir,names[0]));
  assert.equal(file.mode&0o077,0);
  const recovered=createAsyncJobs({stateDir});
  const readback=recovered.status(started.jobId);
  assert.equal(readback.status,'EXIT_0');
  assert.equal(readback.result.exitCode,0);
  assert.equal(readback.persisted,true);
  assert.equal(readback.materialVerified,false);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('a persisted RUNNING job becomes UNKNOWN_OUTCOME after restart and is never replayed',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-job-unknown-'));
 const stateDir=path.join(root,'state');
 let settle;
 try{
  const jobs=createAsyncJobs({stateDir,execute:()=>new Promise(resolve=>{settle=resolve;})});
  const request={cwd:root,argv:['pwd'],timeout_s:5,max_output:1024,idempotency_key:'e'.repeat(64)};
  const config={settings:{enabled:true,roots:[root]},approvalDir:''};
  const started=await jobs.start(request,config);
  assert.equal(started.status,'RUNNING');
  for(let i=0;i<40&&!settle;i++)await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(typeof settle,'function');
  const recovered=createAsyncJobs({stateDir,execute:()=>{throw Error('must not replay');}});
  const state=recovered.status(started.jobId);
  assert.equal(state.status,'UNKNOWN_OUTCOME');
  assert.equal(state.result.status,'UNKNOWN_OUTCOME');
  assert.equal(state.persisted,true);
  assert.equal(state.materialVerified,false);
  const retry=await recovered.start(request,config);
  assert.equal(retry.status,'UNKNOWN_OUTCOME');
  assert.equal(retry.started,false);
  assert.equal(retry.jobId,started.jobId);
  settle({status:'CANCELLED',materialVerified:false});
  await wait(()=>jobs.status(started.jobId).finishedAt?true:null);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('idempotency cannot authorize an R2 operation',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-idempotency-r2-'));
 const stateDir=path.join(root,'state');
 const config={settings:{enabled:true,roots:[root]},approvalDir:''};
 const req={cwd:root,argv:['/usr/bin/false'],idempotency_key:'f'.repeat(64)};
 let permitted=false,executions=0;
 try{
  const jobs=createAsyncJobs({stateDir,approve:async()=>permitted,
    execute:async()=>{executions++;return {status:'EXIT_0',exitCode:0};}});
  assert.equal((await jobs.start(req,config)).status,'LOCAL_APPROVAL_REQUIRED');
  assert.equal(executions,0);
  permitted=true;
  const start=await jobs.start(req,config);
  assert.equal(start.started,true);
  await wait(()=>jobs.status(start.jobId).finishedAt?true:null);
  permitted=false;
  const retry=await jobs.start(req,config);
  assert.equal(retry.deduplicated,true);
  assert.equal(retry.started,false);
  assert.equal(executions,1);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('idempotency is durable and bound to the exact canonical request',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-idempotency-'));
 const stateDir=path.join(root,'state');
 const config={settings:{enabled:true,roots:[root]},approvalDir:''};
 const req={cwd:root,argv:['pwd'],idempotency_key:'a'.repeat(64)};
 let executions=0;
 try{
  const jobs=createAsyncJobs({stateDir,execute:async()=>{executions++;return {status:'EXIT_0',exitCode:0};}});
  const first=await jobs.start(req,config);
  assert.equal(first.started,true);
  await wait(()=>jobs.status(first.jobId).finishedAt?true:null);
  const retry=await jobs.start(req,config);
  assert.equal(retry.jobId,first.jobId);
  assert.equal(retry.deduplicated,true);
  assert.equal(retry.started,false);
  assert.equal((await jobs.start({...req,argv:['uname']},config)).status,'IDEMPOTENCY_CONFLICT');
  const recovered=createAsyncJobs({stateDir,execute:async()=>{executions++;return {status:'EXIT_0'};}});
  const afterRestart=await recovered.start(req,config);
  assert.equal(afterRestart.jobId,first.jobId);
  assert.equal(afterRestart.status,'EXIT_0');
  assert.equal(executions,1);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('concurrent managers cannot both claim the same key',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-idempotency-race-'));
 const stateDir=path.join(root,'state');
 const config={settings:{enabled:true,roots:[root]},approvalDir:''};
 const req={cwd:root,argv:['pwd'],idempotency_key:'b'.repeat(64)};
 let executions=0,settle;
 try{
  const execute=()=>{executions++;return new Promise(resolve=>{settle=resolve;});};
  const first=createAsyncJobs({stateDir,execute}),second=createAsyncJobs({stateDir,execute});
  const results=await Promise.all([first.start(req,config),second.start(req,config)]);
  assert.equal(results.filter(x=>x.started===true).length,1);
  assert.equal(results.filter(x=>x.started===false).length,1);
  await wait(()=>settle);
  assert.equal(executions,1);
  settle({status:'EXIT_0',exitCode:0});
  await wait(()=>first.activeCount()+second.activeCount()===0);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('an incomplete claim is unknown and cannot be replayed; keys require durable storage',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-idempotency-unknown-'));
 const stateDir=path.join(root,'state'),key='c'.repeat(64);
 const config={settings:{enabled:true,roots:[root]},approvalDir:''};
 const req={cwd:root,argv:['pwd'],idempotency_key:key};
 let executions=0;
 try{
  assert.equal((await createAsyncJobs().start(req,config)).status,'PERSISTENCE_UNAVAILABLE');
  const jobs=createAsyncJobs({stateDir,execute:async()=>{executions++;return {status:'EXIT_0'};}});
  await writeFile(path.join(stateDir,key+'.claim'),'{',{mode:0o600});
  const outcome=await jobs.start(req,config);
  assert.equal(outcome.status,'UNKNOWN_OUTCOME');
  assert.equal(outcome.retrySafe,false);
  assert.equal(executions,0);
  assert.equal((await jobs.start({...req,idempotency_key:'invalid'},config)).status,'IDEMPOTENCY_KEY_INVALID');
 }finally{await rm(root,{recursive:true,force:true});}
});
