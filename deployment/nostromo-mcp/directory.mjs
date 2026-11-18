/** R0 directory listing for the existing NOSTROMO MCP, no extra server.
 * Linux procfs pins the verified directory inode so ancestor swaps cannot
 * redirect the enumeration after the scope check. Fail closed otherwise.
 */
import path from 'node:path';
import {constants as fs} from 'node:fs';
import {open,opendir} from 'node:fs/promises';
import {resolveScope} from './policy.mjs';
import {checkFileName,openedHandleMatchesExactPath} from './inspect.mjs';

const MAX_ENTRIES=64;
const SENSITIVE_LEAF=/^(?:\.env(?:\.|$)|\.git$|\.ssh$|\.gnupg$|\.aws$|\.kube$|\.local$|\.npmrc$|id_(?:rsa|ed25519)|secrets?$|credentials?$)|(?:secret|token|password|credential|private[-_.]?key|\.(?:pem|p12|key)$)/i;
function kind(e){
  if(e.isSymbolicLink())return 'symlink';
  if(e.isDirectory())return 'directory';
  if(e.isFile())return 'file';
  return 'other';
}
/** No contents, no symlink target, no traversal, bounded names.
 * Injection seam is available to test fd identity under deterministic races.
 */
export async function listScopedDirectory({directory,maxEntries=20},settings,
    {openDirectory=open,openEntries=opendir}={}){
  if(!settings?.enabled)return {status:'DISABLED',reason:'NOSTROMO_AUTONOMOUS_DISABLED'};
  checkFileName(directory);
  if(!Number.isInteger(maxEntries)||maxEntries<1||maxEntries>MAX_ENTRIES)
    throw Error('DIRECTORY_LIMIT_INVALID');
  const canonical=await resolveScope(directory,settings.roots);
  if(!canonical)return {status:'DENIED',reason:'DIRECTORY_OUTSIDE_ALLOWED_ROOTS'};
  checkFileName(canonical);
  let handle=null;
  try{
    handle=await openDirectory(canonical,fs.O_RDONLY|fs.O_DIRECTORY|fs.O_NOFOLLOW);
    const st=await handle.stat();
    if(!st.isDirectory()||!await openedHandleMatchesExactPath(handle,canonical))
      return {status:'DENIED',reason:'DIRECTORY_FD_SCOPE_MISMATCH'};
    const entries=[];
    const scanLimit=Math.min(512,maxEntries*16);
    let scanned=0,filtered=0,truncated=false;
    const dir=await openEntries('/proc/self/fd/'+handle.fd);
    try{
      for await(const e of dir){
        scanned++;
        if(scanned>scanLimit){truncated=true;break;}
        if(SENSITIVE_LEAF.test(e.name)){filtered++;continue;}
        if(entries.length>=maxEntries){truncated=true;break;}
        entries.push({name:e.name,kind:kind(e)});
      }
    }finally{await dir.close().catch(()=>{});}
    return {status:'READ_OK',directory:canonical,entries,returned:entries.length,
      filteredSensitiveCount:filtered,scannedUpTo:Math.min(scanned,scanLimit),
      truncated,observedAt:new Date().toISOString(),materialVerified:false};
  }catch(e){
    if(['ENOENT','ELOOP','EACCES','EPERM','ENOTDIR'].includes(e?.code))
      return {status:'DENIED',reason:'DIRECTORY_NOT_ACCESSIBLE'};
    throw e;
  }finally{await handle?.close();}
}
