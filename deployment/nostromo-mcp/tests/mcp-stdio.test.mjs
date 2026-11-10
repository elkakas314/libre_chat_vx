import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

const serverPath=fileURLToPath(new URL('../server.mjs',import.meta.url));
async function withServer(env,fn) {
  const transport=new StdioClientTransport({
    command:process.execPath,args:[serverPath],env:{...process.env,...env},stderr:'pipe'
  });
  const client=new Client({name:'nostromo-test-client',version:'0.1.0'},{capabilities:{}});
  try {await client.connect(transport);return await fn(client);}
  finally {await client.close().catch(()=>{});}
}
function parse(result) {
  assert.ok(Array.isArray(result.content));
  return JSON.parse(result.content.find(x=>x.type==='text').text);
}
test('MCP handshake, exactly three terminal tools, fail-closed by default',async()=>{
 await withServer({NOSTROMO_MCP_ENABLED:'0',NOSTROMO_ALLOWED_ROOTS:''},async client=>{
  const names=(await client.listTools()).tools.map(t=>t.name).sort();
  assert.deepEqual(names.sort(),['nostromo_estado','nostromo_herramientas','nostromo_terminal_ejecutar','nostromo_terminal_preparar']);
  const toolView=parse(await client.callTool({name:'nostromo_herramientas',arguments:{}}));
  assert.equal(toolView.tools.length,7);
  assert.equal(toolView.tools.filter(t=>t.enabled).length,4);
  assert.equal(toolView.mutableByModel,false);
  const state=parse(await client.callTool({name:'nostromo_estado',arguments:{}}));
  assert.equal(state.enabled,false);
  const call=await client.callTool({name:'nostromo_terminal_ejecutar',arguments:{cwd:'/tmp',argv:['pwd']}});
  assert.equal(call.isError,true);
  assert.equal(parse(call).status,'DISABLED');
 });
});
test('MCP stdio R0 command executes in allowlisted temporary directory',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-mcp-'));
 try{
  await withServer({NOSTROMO_MCP_ENABLED:'1',NOSTROMO_ALLOWED_ROOTS:root,
      NOSTROMO_APPROVAL_DIR:''},async client=>{
    const args={cwd:root,argv:['pwd'],timeout_s:5,max_output:1024};
    const pre=parse(await client.callTool({name:'nostromo_terminal_preparar',arguments:args}));
    assert.equal(pre.status,'READY_R0');
    const out=await client.callTool({name:'nostromo_terminal_ejecutar',arguments:args});
    assert.notEqual(out.isError,true);
    const result=parse(out);
    assert.equal(result.status,'EXIT_0');
    assert.equal(result.exitCode,0);
    assert.equal(result.classification,'R0');
    assert.ok(result.stdout.includes(root));
    assert.equal(result.materialVerified,false);
    const forbidden=parse(await client.callTool({name:'nostromo_terminal_ejecutar',
      arguments:{cwd:root,argv:['/bin/sh','-c','echo unsafe']}}));
    assert.equal(forbidden.status,'LOCAL_APPROVAL_REQUIRED');
  });
 }finally{await rm(root,{recursive:true,force:true});}
});

test('owner tool registry can remove terminal execution without disabling MCP health or catalog',async()=>{
 await withServer({
   NOSTROMO_MCP_ENABLED:'1',
   NOSTROMO_TOOL_SET:'nostromo_terminal_preparar',
   NOSTROMO_ALLOWED_ROOTS:'',
 },async client=>{
   const tools=(await client.listTools()).tools.map(x=>x.name).sort();
   assert.deepEqual(tools,['nostromo_estado','nostromo_herramientas','nostromo_terminal_preparar']);
   const info=parse(await client.callTool({name:'nostromo_herramientas',arguments:{}}));
   assert.equal(info.tools.find(x=>x.name==='nostromo_terminal_ejecutar').enabled,false);
 });
});

test('opt-in inspection MCP tools return real R0 reads and respect scoping',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-r0-'));
 try{
  const file=path.join(root,'note.md');
  await writeFile(file,'NOSTROMO live stdio');
  await withServer({NOSTROMO_MCP_ENABLED:'1',NOSTROMO_ALLOWED_ROOTS:root,
    NOSTROMO_TOOL_SET:'nostromo_archivo_leer,nostromo_git_inspeccionar,nostromo_metricas'},
    async client=>{
      const names=(await client.listTools()).tools.map(t=>t.name);
      assert.ok(names.includes('nostromo_archivo_leer'));
      assert.ok(names.includes('nostromo_git_inspeccionar'));
      assert.ok(names.includes('nostromo_metricas'));
      assert.equal(names.includes('nostromo_terminal_ejecutar'),false);
      const fileData=parse(await client.callTool({name:'nostromo_archivo_leer',arguments:{file}}));
      assert.equal(fileData.status,'READ_OK');
      assert.match(fileData.text,/NOSTROMO live/);
      const metrics=parse(await client.callTool({name:'nostromo_metricas',arguments:{cwd:root}}));
      assert.equal(metrics.status,'READ_OK');
      assert.ok(metrics.cpuThreads>0);
      assert.equal(metrics.gpuVramBytesVerified,null);
      const denied=parse(await client.callTool({name:'nostromo_archivo_leer',arguments:{file:'/etc/passwd'}}));
      assert.equal(denied.status,'DENIED');
    });
 }finally{await rm(root,{recursive:true,force:true});}
});
