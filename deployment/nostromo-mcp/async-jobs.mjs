/** Bounded, in-process asynchronous CLI jobs for the EXISTING stdio MCP.
 * Not a daemon, persistent scheduler, queue, or second executor.
 * A result is only a process result; material effects remain unverified.
 */
import {randomUUID} from 'node:crypto';
import {preview,consumeApproval,executeLocal} from './policy.mjs';

const TERMINAL=new Set(['EXIT_0','EXIT_NONZERO','SPAWN_ERROR','TIMEOUT','CANCELLED','FAILED']);

export function createAsyncJobs({
  execute=executeLocal,approve=consumeApproval,clock=()=>Date.now(),
  maxRunning=1,maxRetained=24,retentionMs=15*60_000
}={}){
  if(!Number.isInteger(maxRunning)||maxRunning<1||maxRunning>4||
     !Number.isInteger(maxRetained)||maxRetained<1||maxRetained>128||
     !Number.isInteger(retentionMs)||retentionMs<60_000||retentionMs>86_400_000)
    throw Error('ASYNC_JOB_LIMITS_INVALID');
  const records=new Map();
  const active=()=>[...records.values()].filter(x=>!x.endedAt).length;
  const gc=()=>{
    const now=clock();
    for(const [id,j] of records){
      if(j.endedAt&&now-j.endedAt>retentionMs)records.delete(id);
    }
    if(records.size<=maxRetained)return;
    for(const [id,j] of records){
      if(records.size<=maxRetained)break;
      if(j.endedAt)records.delete(id);
    }
  };
  const view=(j,includeResult=true)=>({
    status:j.status,jobId:j.id,requestHash:j.requestHash,risk:j.risk,
    startedAt:j.startedAt,finishedAt:j.finishedAt??null,
    cancelRequested:j.cancelRequested,
    persisted:false,materialVerified:false,
    ...(includeResult&&j.result?{result:j.result}:{})
  });
  async function start(input,{settings,approvalDir}){
    gc();
    const d=await preview(input,settings);
    if(d.status!=='READY_R0'&&d.status!=='LOCAL_APPROVAL_REQUIRED')
      return {status:d.status,reason:d.reason??'PREVIEW_DENIED',started:false};
    if(active()>=maxRunning)return {status:'BUSY',started:false,
      activeJobs:active(),limit:maxRunning,retrySafe:false};
    if(records.size>=maxRetained){
      gc();
      if(records.size>=maxRetained)return {status:'HISTORY_FULL',started:false};
    }
    if(d.risk==='R2'&&!await approve(approvalDir,d.requestHash))
      return {status:'LOCAL_APPROVAL_REQUIRED',risk:d.risk,
        requestHash:d.requestHash,started:false};
    const controller=new AbortController();
    const id=randomUUID(),j={
      id,requestHash:d.requestHash,risk:d.risk,
      startedAt:new Date(clock()).toISOString(),
      status:'RUNNING',controller,endedAt:null,finishedAt:null,
      cancelRequested:false,result:null
    };
    records.set(id,j);
    // Deliberately do not await the CLI. No parallel tool spawning by default.
    Promise.resolve().then(()=>execute(d.request,{signal:controller.signal}))
      .then(out=>{
        j.result=out;
        j.status=TERMINAL.has(out?.status)?out.status:'FAILED';
        j.endedAt=clock();
        j.finishedAt=new Date(j.endedAt).toISOString();
      },()=>{
        // Never return exception messages or host secrets to the model.
        j.status='FAILED';
        j.result={status:'FAILED',materialVerified:false};
        j.endedAt=clock();
        j.finishedAt=new Date(j.endedAt).toISOString();
      });
    return {...view(j,false),started:true};
  }
  function status(jobId){
    gc();
    if(typeof jobId!=='string'||!/^[0-9a-f-]{36}$/i.test(jobId))
      return {status:'NOT_FOUND'};
    const j=records.get(jobId);
    return j?view(j):{status:'NOT_FOUND'};
  }
  function cancel(jobId){
    gc();
    const j=records.get(jobId);
    if(!j)return {status:'NOT_FOUND',cancelRequested:false};
    if(j.endedAt)return {...view(j),cancelRequested:false};
    if(j.cancelRequested)return {status:'CANCEL_REQUESTED',jobId:j.id,requestHash:j.requestHash,
      cancelRequested:true,materialVerified:false};
    j.cancelRequested=true;
    j.controller.abort();
    return {status:'CANCEL_REQUESTED',jobId:j.id,requestHash:j.requestHash,
      cancelRequested:true,materialVerified:false,
      note:'Effect outcome unknown until job status and independent readback'};
  }
  function cancelAll(){
    for(const j of records.values()){
      if(!j.endedAt&&!j.cancelRequested){
        j.cancelRequested=true;
        j.controller.abort();
      }
    }
  }
  return {start,status,cancel,cancelAll,activeCount:active};
}
