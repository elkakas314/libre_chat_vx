/** Bounded asynchronous CLI jobs for the existing stdio MCP.
 * Persistent snapshots live in a private host-local directory. A RUNNING job
 * found after restart is UNKNOWN_OUTCOME and is never retried automatically.
 */
import {randomUUID} from 'node:crypto';
import {constants as fs} from 'node:fs';
import {
  closeSync,fsyncSync,fstatSync,lstatSync,mkdirSync,openSync,
  readFileSync,readdirSync,renameSync,unlinkSync,writeFileSync
} from 'node:fs';
import path from 'node:path';
import {preview,consumeApproval,executeLocal} from './policy.mjs';

const TERMINAL=new Set(['EXIT_0','EXIT_NONZERO','SPAWN_ERROR','TIMEOUT','CANCELLED','FAILED','UNKNOWN_OUTCOME','PERSISTENCE_ERROR']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH=/^[a-f0-9]{64}$/;
const MAX_OUTPUT=16_384,MAX_RECORD_BYTES=40_000;

function validPrivateStat(st){
  const uid=typeof process.getuid==='function'?process.getuid():null;
  return st.isFile()&&(!Number.isInteger(uid)||st.uid===uid)&&(st.mode&0o077)===0;
}
function safeResult(x){
  if(!x||typeof x!=='object')return null;
  const status=TERMINAL.has(x.status)?x.status:'FAILED';
  const exitCode=Number.isInteger(x.exitCode)?x.exitCode:null;
  return {
    status,exitCode,
    stdout:typeof x.stdout==='string'?x.stdout.slice(0,MAX_OUTPUT):'',
    stderr:typeof x.stderr==='string'?x.stderr.slice(0,MAX_OUTPUT):'',
    truncated:Boolean(x.truncated),
    materialVerified:false
  };
}
function createStore(dir,clock){
  if(!dir)return {status:'DISABLED',load:()=>[],save:()=>false,remove:()=>{}};
  let status='READY';
  try{
    if(!path.isAbsolute(dir))throw Error('STATE_DIR_NOT_ABSOLUTE');
    mkdirSync(dir,{recursive:true,mode:0o700});
    const st=lstatSync(dir);
    const uid=typeof process.getuid==='function'?process.getuid():null;
    if(st.isSymbolicLink()||!st.isDirectory()||
       (Number.isInteger(uid)&&st.uid!==uid)||(st.mode&0o077)!==0)
      throw Error('STATE_DIR_NOT_PRIVATE');
  }catch{status='UNAVAILABLE';}
  function fileFor(id){return path.join(dir,id+'.json');}
  function write(record){
    if(status!=='READY')return false;
    let tmp='',fd=null,dirFd=null;
    try{
      const data=JSON.stringify({
        schema:'nostromo.job.v1',jobId:record.id,requestHash:record.requestHash,
        risk:record.risk,status:record.status,startedAt:record.startedAt,
        finishedAt:record.finishedAt??null,cancelRequested:Boolean(record.cancelRequested),
        result:record.result?safeResult(record.result):null
      });
      if(Buffer.byteLength(data)>MAX_RECORD_BYTES)throw Error('STATE_RECORD_TOO_LARGE');
      tmp=path.join(dir,record.id+'.'+randomUUID()+'.tmp');
      fd=openSync(tmp,fs.O_WRONLY|fs.O_CREAT|fs.O_EXCL|fs.O_NOFOLLOW,0o600);
      writeFileSync(fd,data,{encoding:'utf8'});
      fsyncSync(fd);closeSync(fd);fd=null;
      renameSync(tmp,fileFor(record.id));tmp='';
      dirFd=openSync(dir,fs.O_RDONLY);
      fsyncSync(dirFd);closeSync(dirFd);dirFd=null;
      record.persisted=true;
      return true;
    }catch{
      if(fd!==null)try{closeSync(fd);}catch{}
      if(dirFd!==null)try{closeSync(dirFd);}catch{}
      if(tmp)try{unlinkSync(tmp);}catch{}
      record.persisted=false;
      return false;
    }
  }
  function remove(id){
    if(status!=='READY'||!UUID.test(id))return;
    try{
      const f=fileFor(id),st=lstatSync(f);
      if(st.isSymbolicLink()||!validPrivateStat(st))return;
      unlinkSync(f);
    }catch{}
  }
  function load(){
    if(status!=='READY')return [];
    const rows=[];
    let names;
    try{names=readdirSync(dir);}catch{status='DEGRADED';return rows;}
    for(const name of names){
      const m=name.match(/^([0-9a-f-]{36})\.json$/i);
      if(!m||!UUID.test(m[1]))continue;
      let fd=null;
      try{
        const f=fileFor(m[1]),before=lstatSync(f);
        if(before.isSymbolicLink()||!before.isFile()||before.size>MAX_RECORD_BYTES||
           (typeof process.getuid==='function'&&before.uid!==process.getuid())||
           (before.mode&0o077)!==0)throw Error('STATE_FILE_NOT_PRIVATE');
        fd=openSync(f,fs.O_RDONLY|fs.O_NOFOLLOW);
        const st=fstatSync(fd);
        if(!validPrivateStat(st)||st.size>MAX_RECORD_BYTES)throw Error('STATE_FILE_NOT_PRIVATE');
        const raw=readFileSync(fd,{encoding:'utf8'});
        closeSync(fd);fd=null;
        const d=JSON.parse(raw);
        if(d.schema!=='nostromo.job.v1'||d.jobId!==m[1]||
           !HASH.test(d.requestHash)||!['R0','R2'].includes(d.risk)||
           typeof d.startedAt!=='string'||!Number.isFinite(Date.parse(d.startedAt))||
           !TERMINAL.has(d.status)&&d.status!=='RUNNING'||
           (d.finishedAt!==null&&d.finishedAt!==undefined&&!Number.isFinite(Date.parse(d.finishedAt))))
          throw Error('STATE_RECORD_INVALID');
        const row={
          id:d.jobId,requestHash:d.requestHash,risk:d.risk,status:d.status,
          startedAt:d.startedAt,finishedAt:d.finishedAt??null,
          endedAt:d.finishedAt?Date.parse(d.finishedAt):null,
          cancelRequested:Boolean(d.cancelRequested),result:safeResult(d.result),
          liveOutput:{stdout:'',stderr:'',truncated:false},
          controller:null,persisted:true
        };
        if(row.status==='RUNNING'){
          row.status='UNKNOWN_OUTCOME';
          row.finishedAt=new Date(clock()).toISOString();
          row.endedAt=clock();
          row.result={status:'UNKNOWN_OUTCOME',exitCode:null,stdout:'',stderr:'',truncated:false,materialVerified:false};
          if(!write(row))status='DEGRADED';
        }
        rows.push(row);
      }catch{
        if(fd!==null)try{closeSync(fd);}catch{}
        status='DEGRADED';
      }
    }
    return rows;
  }
  return {get status(){return status;},load,save:write,remove};
}

export function createAsyncJobs({
  execute=executeLocal,approve=consumeApproval,clock=()=>Date.now(),
  maxRunning=1,maxRetained=96,retentionMs=7*24*60*60_000,stateDir=''
}={}){
  if(!Number.isInteger(maxRunning)||maxRunning<1||maxRunning>4||
     !Number.isInteger(maxRetained)||maxRetained<1||maxRetained>256||
     !Number.isInteger(retentionMs)||retentionMs<60_000||retentionMs>30*24*60*60_000)
    throw Error('ASYNC_JOB_LIMITS_INVALID');
  const records=new Map(),store=createStore(stateDir,clock);
  for(const row of store.load())records.set(row.id,row);
  const active=()=>[...records.values()].filter(x=>!x.endedAt).length;
  const gc=()=>{
    const now=clock();
    for(const [id,j] of records){
      if(j.endedAt&&now-j.endedAt>retentionMs){records.delete(id);store.remove(id);}
    }
    if(records.size<=maxRetained)return;
    for(const [id,j] of records){
      if(records.size<=maxRetained)break;
      if(j.endedAt){records.delete(id);store.remove(id);}
    }
  };
  const view=(j,includeResult=true)=>({
    status:j.status,jobId:j.id,requestHash:j.requestHash,risk:j.risk,
    startedAt:j.startedAt,finishedAt:j.finishedAt??null,
    cancelRequested:j.cancelRequested,persisted:Boolean(j.persisted),
    storageStatus:store.status,materialVerified:false,
    ...(j.status==='RUNNING'?{liveOutput:j.liveOutput}:{}),
    ...(includeResult&&j.result?{result:j.result}:{})
  });
  let admitting=false;
  async function start(input,{settings,approvalDir}){
    gc();
    const d=await preview(input,settings);
    if(d.status!=='READY_R0'&&d.status!=='LOCAL_APPROVAL_REQUIRED')
      return {status:d.status,reason:d.reason??'PREVIEW_DENIED',started:false,persisted:false};
    if(stateDir&&store.status!=='READY')
      return {status:'PERSISTENCE_UNAVAILABLE',started:false,persisted:false,storageStatus:store.status};
    if(active()>=maxRunning||admitting)return {status:'BUSY',started:false,
      activeJobs:active(),limit:maxRunning,retrySafe:false};
    admitting=true;
    try{
      if(records.size>=maxRetained){
        gc();
        if(records.size>=maxRetained)return {status:'HISTORY_FULL',started:false};
      }
      if(d.risk==='R2'&&!await approve(approvalDir,d.requestHash))
        return {status:'LOCAL_APPROVAL_REQUIRED',risk:d.risk,
          requestHash:d.requestHash,started:false,persisted:false};
      const controller=new AbortController(),id=randomUUID(),j={
        id,requestHash:d.requestHash,risk:d.risk,
        startedAt:new Date(clock()).toISOString(),
        status:'RUNNING',controller,endedAt:null,finishedAt:null,
        cancelRequested:false,result:null,persisted:false,
        liveOutput:{stdout:'',stderr:'',truncated:false}
      };
      records.set(id,j);
      if(stateDir&&!store.save(j)){
        records.delete(id);
        return {status:'PERSISTENCE_ERROR',started:false,persisted:false,storageStatus:store.status};
      }
      Promise.resolve().then(()=>execute(d.request,{
        signal:controller.signal,onOutput:output=>{j.liveOutput=output;}
      }))
        .then(out=>{
          j.result=safeResult(out);
          j.status=TERMINAL.has(out?.status)?out.status:'FAILED';
          j.endedAt=clock();j.finishedAt=new Date(j.endedAt).toISOString();
          if(stateDir&&!store.save(j)){
            j.status='PERSISTENCE_ERROR';
            j.result={status:'PERSISTENCE_ERROR',exitCode:null,stdout:'',stderr:'',truncated:false,materialVerified:false};
          }
        },()=>{
          j.status='FAILED';j.result={status:'FAILED',exitCode:null,stdout:'',stderr:'',truncated:false,materialVerified:false};
          j.endedAt=clock();j.finishedAt=new Date(j.endedAt).toISOString();
          if(stateDir&&!store.save(j))j.status='PERSISTENCE_ERROR';
        });
      return {...view(j,false),started:true};
    }finally{admitting=false;}
  }
  function status(jobId){
    gc();
    if(typeof jobId!=='string'||!UUID.test(jobId))return {status:'NOT_FOUND',persisted:false};
    const j=records.get(jobId);
    return j?view(j):{status:'NOT_FOUND',persisted:false};
  }
  function cancel(jobId){
    gc();
    const j=records.get(jobId);
    if(!j)return {status:'NOT_FOUND',cancelRequested:false,persisted:false};
    if(j.endedAt)return {...view(j),cancelRequested:false};
    if(j.cancelRequested)return {...view(j),status:'CANCEL_REQUESTED',cancelRequested:true};
    j.cancelRequested=true;
    if(stateDir&&!store.save(j))j.persisted=false;
    j.controller?.abort();
    return {status:'CANCEL_REQUESTED',jobId:j.id,requestHash:j.requestHash,
      cancelRequested:true,persisted:Boolean(j.persisted),storageStatus:store.status,
      materialVerified:false,note:'Effect outcome unknown until job status and independent readback'};
  }
  function cancelAll(){
    for(const j of records.values()){
      if(!j.endedAt&&!j.cancelRequested){
        j.cancelRequested=true;
        if(stateDir&&!store.save(j))j.persisted=false;
        j.controller?.abort();
      }
    }
  }
  return {start,status,cancel,cancelAll,activeCount:active,storageStatus:()=>store.status};
}
