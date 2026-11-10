/** Extra R0 capabilities for the EXISTING single NOSTROMO MCP.
 * No Python worker, additional port, daemon or MANOJOS dependency.
 */
import os from 'node:os';
import path from 'node:path';
import {open,statfs} from 'node:fs/promises';
import {constants as fs} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolveScope,preview,executeLocal} from './policy.mjs';

const READ_EXTENSIONS=new Set(['.md','.txt','.json','.yaml','.yml','.js','.mjs','.cjs','.ts','.tsx','.css','.html','.sh','.py','.toml']);
const BANNED_PARTS=new Set(['.git','.ssh','.gnupg','.aws','.kube','secrets','credentials','.local']);
const SECRET_NAME=/(?:^\.env(?:\.|$)|^\.npmrc$|^id_(?:rsa|ed25519)|secret|token|password|credential|private[-_.]?key|\.pem$|\.p12$|\.key$)/i;
const SECRET_CONTENT=/(?:-----BEGIN [^-\n]*PRIVATE KEY-----|github_pat_[A-Za-z0-9_]{25,}|gh[pousr]_[A-Za-z0-9]{24,}|sk-(?:proj-)?[A-Za-z0-9_-]{24,})/;
const MAX_READ=16384;

function checkFileName(file) {
  if(typeof file!=='string'||!path.isAbsolute(file)||file.length>1024||file.includes('\0'))
    throw Error('FILE_PATH_INVALID');
  const components=path.normalize(file).split(path.sep);
  if(components.some(p=>BANNED_PARTS.has(p))||SECRET_NAME.test(path.basename(file)))
    throw Error('SENSITIVE_PATH_DENIED');
  if(!READ_EXTENSIONS.has(path.extname(file).toLowerCase()))
    throw Error('FILE_TYPE_DENIED');
}

/** Read a bounded text excerpt, after canonical directory scoping and O_NOFOLLOW. */
export async function readScopedText({file,maxBytes=8192},settings) {
  if(!settings.enabled)return {status:'DISABLED',reason:'NOSTROMO_AUTONOMOUS_DISABLED'};
  checkFileName(file);
  if(!Number.isSafeInteger(maxBytes)||maxBytes<256||maxBytes>MAX_READ)
    throw Error('FILE_READ_LIMIT_INVALID');
  const parent=await resolveScope(path.dirname(file),settings.roots);
  if(!parent)return {status:'DENIED',reason:'FILE_OUTSIDE_ALLOWED_ROOTS'};
  const resolved=path.join(parent,path.basename(file));
  let handle;
  try{
    handle=await open(resolved,fs.O_RDONLY|fs.O_NOFOLLOW);
    const st=await handle.stat();
    if(!st.isFile()||st.size>1048576)return {status:'DENIED',reason:'FILE_SIZE_OR_TYPE_DENIED'};
    const data=Buffer.alloc(maxBytes+1);
    const {bytesRead}=await handle.read(data,0,data.length,0);
    const sample=data.subarray(0,Math.min(bytesRead,maxBytes));
    if(sample.includes(0)||SECRET_CONTENT.test(sample.toString('utf8')))
      return {status:'DENIED',reason:'BINARY_OR_SECRET_CONTENT'};
    return {status:'READ_OK',file:resolved,bytesRead:sample.length,
      truncated:bytesRead>maxBytes||st.size>maxBytes,
      excerptSha256:createHash('sha256').update(sample).digest('hex'),
      text:sample.toString('utf8'),materialVerified:false};
  }catch(e){
    if(e?.code==='ENOENT'||e?.code==='ELOOP'||e?.code==='EACCES'||e?.code==='EPERM')
      return {status:'DENIED',reason:'FILE_NOT_ACCESSIBLE'};
    throw e;
  }finally{await handle?.close();}
}

/** OS metrics: load average is NOT CPU percent; no inferred GPU VRAM. */
export async function readHostMetrics({cwd},settings) {
  if(!settings.enabled)return {status:'DISABLED',reason:'NOSTROMO_AUTONOMOUS_DISABLED'};
  const safeCwd=await resolveScope(cwd,settings.roots);
  if(!safeCwd)return {status:'DENIED',reason:'CWD_OUTSIDE_ALLOWED_ROOTS'};
  const disk=await statfs(safeCwd);
  return {status:'READ_OK',observedAt:new Date().toISOString(),scope:safeCwd,
    cpuThreads:os.cpus().length,loadAverage1m:os.loadavg()[0],
    loadAverage5m:os.loadavg()[1],loadAverage15m:os.loadavg()[2],
    memoryTotalBytes:os.totalmem(),memoryFreeBytes:os.freemem(),
    diskTotalBytes:disk.blocks*disk.bsize,diskAvailableBytes:disk.bavail*disk.bsize,
    gpuVramBytesVerified:null,gpuMockIsHardwareProof:false,
    note:'loadAverage is not CPU utilization; free memory is not MemAvailable; GPU VRAM is not measured.',
    materialVerified:false};
}

/** Read current HEAD/branch/status/diff stat via existing strict R0 command policy. */
export async function readGitSnapshot({cwd},settings) {
  if(!settings.enabled)return {status:'DISABLED',reason:'NOSTROMO_AUTONOMOUS_DISABLED'};
  const commands=[['git','rev-parse','HEAD'],['git','branch','--show-current'],
    ['git','status','--short'],['git','diff','--stat','--no-ext-diff']];
  const outputs={};
  for(const argv of commands){
    const decision=await preview({cwd,argv,timeout_s:10,max_output:4096},settings);
    if(decision.status!=='READY_R0')return {status:decision.status,reason:decision.reason||'NOT_R0'};
    const executed=await executeLocal(decision.request);
    outputs[argv[1]]={status:executed.status,exitCode:executed.exitCode,
      stdout:executed.stdout,stderr:executed.stderr,truncated:executed.truncated,
      executionId:executed.executionId};
    if(executed.status!=='EXIT_0')break;
  }
  return {status:Object.values(outputs).every(x=>x.status==='EXIT_0')?'READ_OK':'PARTIAL',
    cwd,commands:outputs,materialVerified:false};
}
