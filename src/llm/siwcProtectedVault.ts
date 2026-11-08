import { constants } from 'node:fs';
import { open, lstat, unlink, rename } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { resolve, join, isAbsolute } from 'node:path';
import type { SiwcAccountCredentials, SiwcCredentialVault } from './siwcSession';

/**
 * Optional host-only Unix vault: no account tokens in browser/Drive/Git.
 * The deployment owner creates an owner-only 0700 directory beforehand.
 * Locked single-writer CAS; abandoned lock requires *manual* diagnosis.
 */
export class SiwcProtectedFileVault implements SiwcCredentialVault {
  private readonly root:string;
  constructor(root:string) {
    if(!isAbsolute(root)||root.includes('\0'))throw Error('SIWC_VAULT_PATH_INVALID');
    this.root=resolve(root);
  }
  private file(clientId:string):string {
    if(!/^oaiapp_[A-Za-z0-9_-]{1,160}$/.test(clientId))
      throw Error('SIWC_VAULT_CLIENT_ID_INVALID');
    return join(this.root,clientId+'.json');
  }
  private async directory():Promise<void>{
    const s=await lstat(this.root);
    const uid=process.getuid?.();
    if(!s.isDirectory()||s.isSymbolicLink()||(s.mode&0o077)!==0||
      (uid!==undefined&&s.uid!==uid))
      throw Error('SIWC_VAULT_DIRECTORY_UNSAFE');
  }
  private async readUnsafe(clientId:string):
      Promise<{version:string;record:SiwcAccountCredentials}|null>{
    const path=this.file(clientId);
    let file;
    try{file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);}
    catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;
      throw Error('SIWC_VAULT_READ_FAILED');}
    try{
      const stat=await file.stat();
      const uid=process.getuid?.();
      if(!stat.isFile()||(stat.mode&0o077)!==0||
        (uid!==undefined&&stat.uid!==uid)||stat.size>131072)
        throw Error('SIWC_VAULT_FILE_UNSAFE');
      const bytes=await file.readFile();
      const record=JSON.parse(bytes.toString('utf8')) as SiwcAccountCredentials;
      if(!record||record.clientId!==clientId||typeof record.subject!=='string'||
        typeof record.accessToken!=='string'&&record.accessToken!==null)
        throw Error('SIWC_VAULT_RECORD_INVALID');
      return {version:createHash('sha256').update(bytes).digest('hex'),record};
    }finally{await file.close();}
  }
  async read(clientId:string){
    await this.directory();
    return this.readUnsafe(clientId);
  }
  async update(clientId:string,expectedVersion:string|null,record:SiwcAccountCredentials){
    if(record.clientId!==clientId||!record.subject||!record.hostId)
      throw Error('SIWC_VAULT_ACCOUNT_MISMATCH');
    await this.directory();
    const lock=this.file(clientId)+'.lock';
    let lockFd;
    try{lockFd=await open(lock,constants.O_CREAT|constants.O_EXCL|
      constants.O_NOFOLLOW|constants.O_WRONLY,0o600);}
    catch{throw Error('SIWC_VAULT_BUSY');}
    try{
      const current=await this.readUnsafe(clientId);
      if((current?.version??null)!==expectedVersion)
        throw Error('SIWC_VAULT_VERSION_CONFLICT');
      const bytes=Buffer.from(JSON.stringify(record),'utf8');
      if(bytes.length>131072)throw Error('SIWC_VAULT_SIZE_LIMIT');
      const tmp=this.file(clientId)+'.'+randomUUID()+'.tmp';
      let handle;
      try{
        handle=await open(tmp,constants.O_WRONLY|constants.O_CREAT|
          constants.O_EXCL|constants.O_NOFOLLOW,0o600);
        await handle.writeFile(bytes);
        await handle.sync();
      }catch{
        await unlink(tmp).catch(()=>{});
        throw Error('SIWC_VAULT_WRITE_FAILED');
      }finally{if(handle)await handle.close();}
      try{await rename(tmp,this.file(clientId));}
      catch{await unlink(tmp).catch(()=>{});throw Error('SIWC_VAULT_COMMIT_FAILED');}
      const result=await this.readUnsafe(clientId);
      if(!result||result.version!==createHash('sha256').update(bytes).digest('hex'))
        throw Error('SIWC_VAULT_READBACK_FAILED');
      return {version:result.version};
    }finally{
      await lockFd.close();
      await unlink(lock).catch(()=>{});
    }
  }
}
