import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,stat,symlink,chmod,rm,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {tmpdir} from 'node:os';
import {SiwcProtectedFileVault} from '../src/llm/siwcProtectedVault';
import type {SiwcAccountCredentials} from '../src/llm/siwcSession';
const client='oaiapp_secure-test';
const record:SiwcAccountCredentials={
  clientId:client,hostId:'urn:uuid:00000000-1111-4222-8333-444444444444',
  subject:'verified-subject',identity:{verification:'OIDC_JWKS_NONCE_AUD_VERIFIED',
    subject:'verified-subject',issuedClientId:client,expectedNonce:'n'},
  scopes:['openid','offline_access','resource.invoke','chatgpt.tokens.use.direct'],
  savedAtMs:1000,tokenExpiresAtMs:2000,earliestRefreshAtMs:1000,
  accessToken:'private-access-test-only',refreshToken:'private-refresh-test-only',
  idToken:'private-id-test-only',
};
test('vault CAS protects multi-version credentials and writes owner-only file',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'vx-siwc-vault-'));
  try{
    const vault=new SiwcProtectedFileVault(dir,randomBytes(32));
    assert.equal(await vault.read(client),null);
    const first=await vault.update(client,null,record);
    assert.match(first.version,/^[a-f0-9]{64}$/);
    const result=await vault.read(client);
    assert.equal(result?.record.subject,'verified-subject');
    const info=await stat(join(dir,client+'.json'));
    assert.equal(info.mode&0o077,0);
    await assert.rejects(vault.update(client,null,record),/VERSION_CONFLICT/);
    const next=await vault.update(client,first.version,{
      ...record,accessToken:'new-private-access',refreshToken:'new-private-refresh'});
    assert.notEqual(next.version,first.version);
    const persisted=await readFile(join(dir,client+'.json'),'utf8');
    assert.equal(persisted.includes('new-private-refresh'),false);
    assert.equal(persisted.includes('siwc-aes256gcm-v1'),true);
    assert.equal(persisted.includes('private-refresh-test-only'),false);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('vault prevents symlink reads, broad access and client path traversal',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'vx-siwc-safe-'));
  try{
    const vault=new SiwcProtectedFileVault(dir,randomBytes(32));
    await assert.rejects(vault.read('../escape'),/CLIENT_ID_INVALID/);
    await symlink('/etc/passwd',join(dir,client+'.json'));
    await assert.rejects(vault.read(client),/READ_FAILED/);
    await rm(join(dir,client+'.json'));
    await chmod(dir,0o755);
    await assert.rejects(vault.read(client),/DIRECTORY_UNSAFE/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('vault refuses missing key, wrong key and plaintext legacy records',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'vx-siwc-encrypted-'));
  const secret=randomBytes(32);
  try{
    assert.throws(()=>new SiwcProtectedFileVault(dir,Buffer.alloc(0)),/KEY_REQUIRED/);
    const vault=new SiwcProtectedFileVault(dir,secret);
    await vault.update(client,null,record);
    const other=new SiwcProtectedFileVault(dir,randomBytes(32));
    await assert.rejects(other.read(client),/DECRYPT_FAILED/);
    assert.equal((await vault.read(client))?.record.accessToken,'private-access-test-only');
  } finally {await rm(dir,{recursive:true,force:true});}
});
