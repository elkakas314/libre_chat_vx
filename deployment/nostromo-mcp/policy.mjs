import {createHash} from 'node:crypto';
import {readFile, stat, open} from 'node:fs/promises';
import {constants as fsConstants} from 'node:fs';

export const NAME='nostromo-control';
export const MAX_ARGV=32, MAX_ARG_LEN=512, MAX_OUTPUT=8192, MAX_TIMEOUT=60;
export function requireLoopbackUrl(raw) {
  if(typeof raw!=='string'||!raw)throw Error('MCP_TARGET_UNCONFIGURED');
  const u=new URL(raw);
  if(u.protocol!=='http:'||u.hostname!=='127.0.0.1'||u.username||u.password||
     u.hash||u.search||u.pathname!=='/mcp')
    throw Error('MCP_LOOPBACK_ONLY');
  return u;
}
export function canonical(value) {
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value===null)return 'null';
  if(typeof value==='object'){
    return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  }
  return JSON.stringify(value);
}
export function hostExecRequest({argv,cwd,timeout_s=30,max_output=8192}) {
  if(!Array.isArray(argv)||argv.length<1||argv.length>MAX_ARGV||
    argv.some(x=>typeof x!=='string'||!x||x.length>MAX_ARG_LEN||x.includes('\0')||x.includes('\n')))
    throw Error('TERMINAL_ARGV_INVALID');
  if(typeof cwd!=='string'||!cwd.startsWith('/')||cwd.includes('..')||cwd.includes('\0')||
     cwd.includes('//')||cwd.length>240)throw Error('TERMINAL_CWD_INVALID');
  if(!Number.isInteger(timeout_s)||timeout_s<1||timeout_s>MAX_TIMEOUT||
     !Number.isInteger(max_output)||max_output<256||max_output>MAX_OUTPUT)
    throw Error('TERMINAL_LIMIT_INVALID');
  const args={target:cwd,argv,script:null,cwd,env:{},timeout_s,max_output};
  const hash=createHash('sha256').update(canonical({operation:'host_exec',args})).digest('hex');
  return {args,requestHash:hash};
}
export function evaluateExec(input,scope) {
  try {
    const prepared=hostExecRequest(input);
    if(!scope.enabled)return {status:'DISABLED',reason:'MCP_DISABLED'};
    if(!Array.isArray(scope.allowedWorkingDirs)||!scope.allowedWorkingDirs.includes(input.cwd))
      return {status:'DENIED',reason:'CWD_NOT_ALLOWLISTED'};
    return {status:'LOCAL_GRANT_REQUIRED',requestHash:prepared.requestHash,args:prepared.args};
  } catch(e) {
    return {status:'DENIED',reason:e.message};
  }
}
export async function exactLocalGrant(path,expectedHash,now=Date.now()) {
  if(!path||typeof path!=='string'||!path.startsWith('/'))return null;
  let handle;
  try {
    handle=await open(path,fsConstants.O_RDONLY|fsConstants.O_NOFOLLOW);
    const meta=await handle.stat();
    if(!meta.isFile()||(meta.mode&0o077)!==0||meta.uid!==process.getuid()||meta.size>4096)
      return null;
    const data=JSON.parse(await handle.readFile({encoding:'utf8'}));
    if(data.operation!=='host_exec'||data.risk!=='R2'||data.request_hash!==expectedHash||
       typeof data.grant_id!=='string'||!/^[A-Za-z0-9_-]{8,80}$/.test(data.grant_id)||
       !Number.isSafeInteger(data.expires_at_ms)||data.expires_at_ms<=now)
      return null;
    return data.grant_id;
  } catch { return null; }
  finally {await handle?.close().catch(()=>{});}
}
export function boundedResult(value){
  const redacted=JSON.stringify(value??null).replace(/(?:gh[pousr]_|sk-)[A-Za-z0-9_-]{12,}/g,'[REDACTED]')
    .replace(/(bearer\s+)[^\s"]+/ig,'$1[REDACTED]');
  return redacted.length>16000?{truncated:true,data:redacted.slice(0,16000)}:value;
}
