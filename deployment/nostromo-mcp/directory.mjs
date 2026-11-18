/** R0 directory listing for the existing NOSTROMO MCP, no extra server.
 * Linux procfs pins the verified directory inode so ancestor swaps cannot
 * redirect the enumeration after the scope check. Fail closed otherwise.
 */
import path from 'node:path';
import {constants as fs} from 'node:fs';
import {open,opendir} from 'node:fs/promises';
import {resolveScope} from './policy.mjs';
import {checkFileName,openedHandleMatchesExactPath} from './inspect.mjs';

const MAX_ENTRIES=50;
const MAX_DIRECTORY_SCAN=5000;
const SENSITIVE_LEAF=/^(?:\.env(?:\.|$)|\.git$|\.ssh$|\.gnupg$|\.aws$|\.kube$|\.local$|\.npmrc$|id_(?:rsa|ed25519)|secrets?$|credentials?$)|(?:secret|token|password|credential|private[-_.]?key|\.(?:pem|p12|key)$)/i;
/** Lists immediate public names only. It omits symlink entries, does not
 * follow links, read file contents, or traverse child directories.
 * The openDirectory/openEntries seam keeps descriptor-race tests deterministic.
 */
export async function listScopedDirectory({directory,maxEntries=50},settings,
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
    let scanned=0,filteredSensitiveCount=0,truncated=false;
    const dir=await openEntries('/proc/self/fd/'+handle.fd);
    try{
      for await(const e of dir){
        scanned++;
        if(scanned>MAX_DIRECTORY_SCAN){truncated=true;break;}
        if(SENSITIVE_LEAF.test(e.name)){filteredSensitiveCount++;continue;}
        if(e.isSymbolicLink())continue;
        if(entries.length>=maxEntries){truncated=true;break;}
        entries.push(e.name);
      }
    }finally{await dir.close().catch(()=>{});}
    entries.sort();
    return {status:'READ_OK',directory:canonical,entries,returned:entries.length,
      maxEntries,filteredSensitiveCount,scannedEntries:scanned,
      scannedUpTo:Math.min(scanned,MAX_DIRECTORY_SCAN),truncated,
      recursive:false,contentsRead:false,observedAt:new Date().toISOString(),
      materialVerified:false};
  }catch(e){
    if(['ENOENT','ELOOP','EACCES','EPERM','ENOTDIR'].includes(e?.code))
      return {status:'DENIED',reason:'DIRECTORY_NOT_ACCESSIBLE'};
    throw e;
  }finally{await handle?.close();}
}
