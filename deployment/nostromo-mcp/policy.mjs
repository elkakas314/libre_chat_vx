/** NOSTROMO autonomous terminal policy. Host-local, no MANOJOS dependency. */
import {createHash,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {open,realpath,rename,stat,mkdir} from 'node:fs/promises';
import {constants as fs} from 'node:fs';
import path from 'node:path';

const MAX_ARGS=40,MAX_ARG=2048,MAX_CAPTURE=16_384,MAX_TIME=120;
const IS_SHELL=/^(?:\/bin\/)?(?:sh|bash|dash|zsh)$/;
const safeCmds=new Set(['pwd','whoami','id','uname','df','free','git','ls','ss','ps']);
export function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
export function normalizeRequest(x) {
  if(!x||!Array.isArray(x.argv)||x.argv.length<1||x.argv.length>MAX_ARGS||
     x.argv.some(a=>typeof a!=='string'||!a||a.length>MAX_ARG||
       a.includes('\0')||a.includes('\n')))
    throw Error('ARGV_INVALID');
  if(typeof x.cwd!=='string'||!path.isAbsolute(x.cwd)||x.cwd.includes('\0'))
    throw Error('CWD_INVALID');
  const timeout_s=x.timeout_s??30,max_output=x.max_output??8192;
  if(!Number.isInteger(timeout_s)||timeout_s<1||timeout_s>MAX_TIME||
     !Number.isInteger(max_output)||max_output<256||max_output>MAX_CAPTURE)
    throw Error('EXEC_LIMIT_INVALID');
  return {argv:[...x.argv],cwd:x.cwd,timeout_s,max_output};
}
export async function resolveScope(cwd,roots) {
  if(!Array.isArray(roots)||roots.length===0)return null;
  try {
    const dir=await realpath(cwd);
    for(const item of roots) {
      if(!path.isAbsolute(item))continue;
      const root=await realpath(item);
      if(dir===root||dir.startsWith(root+path.sep))return dir;
    }
  }catch{return null;}
  return null;
}
export function isSafeReadOnly(argv) {
  const cmd=path.basename(argv[0]),args=argv.slice(1);
  if(!safeCmds.has(cmd)||IS_SHELL.test(cmd))return false;
  if(argv[0].includes('/')&&!['/usr/bin/'+cmd,'/bin/'+cmd].includes(argv[0]))return false;
  const exact=(...allowed)=>allowed.some(a=>JSON.stringify(args)===JSON.stringify(a));
  if(cmd==='pwd'||cmd==='whoami'||cmd==='id'||cmd==='free')return exact([],['-h']);
  if(cmd==='uname')return exact([],['-a']);
  if(cmd==='df')return exact(['-h'],['-h','.']);
  if(cmd==='ls')return exact([],['-la'],['-l'],['-a']);
  if(cmd==='git')return exact(['status','--short'],['status','--porcelain'],['rev-parse','HEAD'],['branch','--show-current'],['diff','--stat','--no-ext-diff']);
  if(cmd==='ss')return exact(['-ltn'],['-ltnp']);
  if(cmd==='ps')return exact(['-e','-o','pid,comm'],['-e','-o','pid,comm,rss']);
  return false;
}
export async function preview(x,{roots=[],enabled=false}={}) {
  const request=normalizeRequest(x);
  if(!enabled)return {status:'DISABLED',reason:'NOSTROMO_AUTONOMOUS_DISABLED'};
  const canonicalCwd=await resolveScope(request.cwd,roots);
  if(!canonicalCwd)return {status:'DENIED',reason:'CWD_OUTSIDE_ALLOWED_ROOTS'};
  const canonical={...request,cwd:canonicalCwd};
  const risk=isSafeReadOnly(canonical.argv)?'R0':'R2';
  return {status:risk==='R0'?'READY_R0':'LOCAL_APPROVAL_REQUIRED',risk,
    requestHash:digest(canonical),request:canonical};
}
/** Approval is minted by a human at a separate physical/interactive terminal.
 * Consume via atomic rename BEFORE execution. A model cannot create approvals.
 */
export async function consumeApproval(dir,hash,now=Date.now()) {
  if(!dir||!path.isAbsolute(dir)||!/^[a-f0-9]{64}$/.test(hash))return false;
  try {
    const d=await stat(dir);
    if(!d.isDirectory()||d.uid!==process.getuid()||(d.mode&0o077)!==0)return false;
    const pending=path.join(dir,hash+'.json');
    let f;
    try {
      f=await open(pending,fs.O_RDONLY|fs.O_NOFOLLOW);
      const s=await f.stat();
      if(!s.isFile()||s.uid!==process.getuid()||(s.mode&0o077)!==0||s.size>1024)
        return false;
      const doc=JSON.parse(await f.readFile({encoding:'utf8'}));
      if(doc.version!==1||doc.hash!==hash||doc.risk!=='R2'||
         !Number.isSafeInteger(doc.expiresAt)||doc.expiresAt<=now||doc.expiresAt>now+120000)
        return false;
    } finally {await f?.close();}
    const used=path.join(dir,'used');
    await mkdir(used,{mode:0o700,recursive:true});
    const u=await stat(used);
    if(!u.isDirectory()||u.uid!==process.getuid()||(u.mode&0o077)!==0)return false;
    await rename(pending,path.join(used,hash+'-'+randomUUID()+'.used'));
    return true;
  }catch{return false;}
}
export async function executeLocal(request,{captureLimit,clock=()=>Date.now(),signal,onOutput}={}) {
  const startedAt=new Date(clock()).toISOString(),executionId=randomUUID();
  const limit=Math.min(request.max_output,captureLimit??MAX_CAPTURE);
  const command=request.argv[0];
  const program=command.includes('/')?command:'/usr/bin/'+command;
  const args=request.argv.slice(1);
  const env={PATH:'/usr/bin:/bin',HOME:process.env.HOME??'',LANG:'C.UTF-8',LC_ALL:'C.UTF-8',
    GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_NOSYSTEM:'1',
    GIT_CONFIG_GLOBAL:'/dev/null',GIT_CONFIG_COUNT:'1',
    GIT_CONFIG_KEY_0:'core.fsmonitor',GIT_CONFIG_VALUE_0:'false'};
  let stdout='',stderr='',truncated=false,timedOut=false,cancelled=false;
  const append=(target,chunk)=>{
    const text=chunk.toString('utf8');
    const current=target==='stdout'?stdout:stderr;
    const next=current+text;
    if(next.length>limit)truncated=true;
    if(target==='stdout')stdout=next.slice(0,limit);else stderr=next.slice(0,limit);
    if(onOutput)try{onOutput({stdout,stderr,truncated});}catch{}
  };
  if(signal?.aborted)return {status:'CANCELLED',executionId,startedAt,
    finishedAt:new Date(clock()).toISOString(),exitCode:null,signal:null,
    stdout:'',stderr:'',truncated:false,materialVerified:false,executed:false};
  return await new Promise(resolve=>{
    let done=false,child;
    const kill=()=>{
      if(!child||!Number.isInteger(child.pid)||child.pid<=0)return;
      try{process.kill(-child.pid,'SIGKILL');}
      catch{try{child.kill('SIGKILL');}catch{}}
    };
    const cancel=()=>{cancelled=true;kill();};
    try {
      child=spawn(program,args,{cwd:request.cwd,env,shell:false,stdio:['ignore','pipe','pipe'],detached:true});
    }catch(err){
      return resolve({status:'SPAWN_ERROR',executionId,startedAt,
        finishedAt:new Date(clock()).toISOString(),error:String(err),materialVerified:false});
    }
    if(signal?.aborted)cancel();
    else signal?.addEventListener('abort',cancel,{once:true});
    const timer=setTimeout(()=>{
      timedOut=true;kill();
    },request.timeout_s*1000);
    child.stdout?.on('data',chunk=>append('stdout',chunk));
    child.stderr?.on('data',chunk=>append('stderr',chunk));
    const finish=(exitCode,signalName,error)=>{
      if(done)return;done=true;clearTimeout(timer);
      signal?.removeEventListener('abort',cancel);
      resolve({status:error?'SPAWN_ERROR':cancelled?'CANCELLED':timedOut?'TIMEOUT':exitCode===0?'EXIT_0':'EXIT_NONZERO',
        executionId,startedAt,finishedAt:new Date(clock()).toISOString(),
        exitCode,signal:signalName,stdout,stderr,truncated,materialVerified:false,
        ...(error?{error:String(error)}:{})});
    };
    child.on('error',err=>finish(null,null,err));
    child.on('close',(code,signalName)=>finish(code,signalName,null));
  });
}
