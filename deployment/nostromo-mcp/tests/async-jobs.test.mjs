import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
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
