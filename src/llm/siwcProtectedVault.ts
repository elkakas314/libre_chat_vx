import { constants } from 'node:fs';
import { open, lstat, unlink, rename } from 'node:fs/promises';
import { createHash, randomUUID, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { resolve, join, isAbsolute } from 'node:path';
import type { SiwcAccountCredentials, SiwcCredentialVault } from './siwcSession';

/**
 * Host-only AES-256-GCM encrypted vault; no raw tokens in browser/Drive/Git.
 * Requires externally provisioned 32-byte key and owner-only 0700 directory.
 * Locked single-writer CAS; abandoned lock requires *manual* diagnosis.
 */
export class SiwcProtectedFileVault implements SiwcCredentialVault {
  private readonly root:string;
  private readonly key:Buffer;
  constructor(root:string,masterKey:Buffer) {
    if(!isAbsolute(root)||root.includes('\\0'))throw Error('SIWC_VAULT_PATH_INVALID');
    if(!Buffer.isBuffer(masterKey)||masterKey.length!==32)
      throw Error('SIWC_VAULT_ENCRYPTION_KEY_REQUIRED');
    this.root=resolve(root);
    this.key=Buffer.from(masterKey); // host-only SecretRef, never persisted here
  }
  private encrypt(record:SiwcAccountCredentials):Buffer {
    const iv=randomBytes(12);
    const cipher=createCipheriv('aes-256-gcm',this.key,iv);
    const plaintext=Buffer.from(JSON.stringify(record),'utf8');
    const ciphertext=Buffer.concat([cipher.update(plaintext),cipher.final()]);
    return Buffer.from(JSON.stringify({format:'siwc-aes256gcm-v1',
      iv:iv.toString('base64url'),tag:cipher.getAuthTag().toString('base64url'),
      ciphertext:ciphertext.toString('base64url')}),'utf8');
  }
  private decrypt(bytes:Buffer):SiwcAccountCredentials {
    try {
      const data=JSON.parse(bytes.toString('utf8')) as Record<string,unknown>;
      if(data.format!=='siwc-aes256gcm-v1'||typeof data.iv!=='string'||
        typeof data.tag!=='string'||typeof data.ciphertext!=='string')
        throw Error('SIWC_VAULT_FORMAT_INVALID');
      const iv=Buffer.from(data.iv,'base64url');
      const tag=Buffer.from(data.tag,'base64url');
      if(iv.length!==12||tag.length!==16)throw Error('SIWC_VAULT_FORMAT_INVALID');
      const decipher=createDecipheriv('aes-256-gcm',this.key,iv);
      decipher.setAuthTag(tag);
      const plaintext=Buffer.concat([decipher.update(Buffer.from(data.ciphertext,'base64url')),
        decipher.final()]);
      return JSON.parse(plaintext.toString('utf8')) as SiwcAccountCredentials;
    } catch { throw Error('SIWC_VAULT_DECRYPT_FAILED'); }
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
      const record=this.decrypt(bytes);
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
      const bytes=this.encrypt(record);
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
