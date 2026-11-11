import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
let Client,StdioClientTransport,sdkMissing=false;
try{
 ({Client}=await import('@modelcontextprotocol/sdk/client/index.js'));
 ({StdioClientTransport}=await import('@modelcontextprotocol/sdk/client/stdio.js'));
}catch(error){
 if(error?.code!=='ERR_MODULE_NOT_FOUND')throw error;
 sdkMissing=true;
}

/** Actual SDK client → existing NOSTROMO stdio server → R0 tool → result.
 * Needs the existing package dependencies installed. NO model/host/LibreChat
 * involved, no auth, no install, no R2 execution. Never mark this as E2E.
 */
const server=fileURLToPath(new URL('../server.mjs',import.meta.url));
const payload=result=>{
 const text=result?.content?.find(item=>item?.type==='text')?.text;
 assert.equal(typeof text,'string','MCP_TOOL_TEXT_MISSING');
 return JSON.parse(text);
};

test('M3 SDK stdio handshake and bounded R0 tool invocation; no exec capability', {timeout:20000,skip:sdkMissing?'SDK_DEPENDENCY_NOT_INSTALLED_IN_THIS_RUNTIME':false}, async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-mcp-stdio-r0-'));
 const file=path.join(root,'README.md');
 let client=null, transport=null;
 try{
  await chmod(root,0o700);
  await writeFile(file,'NOSTROMO E2 stdio canary only\n',{mode:0o600});
  transport=new StdioClientTransport({
   command:process.execPath,
   args:[server],
   env:{...process.env,
     NOSTROMO_MCP_ENABLED:'1',
     NOSTROMO_TOOL_SET:'nostromo_terminal_preparar,nostromo_archivo_leer',
     NOSTROMO_ALLOWED_ROOTS:root,
     NOSTROMO_APPROVAL_DIR:'',
   },
   stderr:'pipe'
  });
  client=new Client({name:'nostromo-e2-source-canary',version:'0.0.1'});
  await client.connect(transport); // real initialize handshake and server info
  const announced=await client.listTools();
  const names=announced.tools.map(x=>x.name);
  assert.deepEqual(names.sort(),[
   'nostromo_estado','nostromo_herramientas','nostromo_terminal_preparar','nostromo_archivo_leer'
  ].sort());
  assert.equal(names.includes('nostromo_terminal_ejecutar'),false);
  assert.equal(names.includes('nostromo_tarea_iniciar'),false);
  const state=payload(await client.callTool({name:'nostromo_estado',arguments:{}}));
  assert.equal(state.mcpLive,true); // only in this disposable canary process
  assert.equal(state.enabled,true);
  assert.equal(state.hostExecutionAuthority,false);
  assert.equal(state.chatgptBinding,'SEPARATE_OAUTH_NOT_VERIFIED');

  // Prepare is non-executing even with MCP enabled, and cannot mint R2.
  const preview=payload(await client.callTool({name:'nostromo_terminal_preparar',arguments:{
   argv:['pwd'],cwd:root,timeout_s:5,max_output:1024
  }}));
  assert.equal(preview.status,'READY_R0');
  assert.equal(preview.risk,'R0');
  assert.equal(typeof preview.requestHash,'string');
  assert.equal(preview.requestHash.length,64);

  const read=payload(await client.callTool({name:'nostromo_archivo_leer',
   arguments:{file,maxBytes:256}}));
  assert.equal(read.status,'READ_OK');
  assert.equal(read.text,'NOSTROMO E2 stdio canary only\n');
  assert.equal(read.materialVerified,false);
  assert.equal(read.excerptSha256.length,64);

  const denied=payload(await client.callTool({name:'nostromo_archivo_leer',
   arguments:{file:'/etc/hosts',maxBytes:256}}));
  assert.equal(denied.status,'DENIED');
  assert.equal(denied.reason,'FILE_OUTSIDE_ALLOWED_ROOTS');
 }finally{
  try{await client?.close();}catch{}
  try{await transport?.close();}catch{}
  await rm(root,{recursive:true,force:true});
 }
});
