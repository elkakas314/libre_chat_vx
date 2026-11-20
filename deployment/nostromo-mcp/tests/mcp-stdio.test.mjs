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
  const toolList=(await client.listTools()).tools;
  const names=toolList.map(t=>t.name).sort();
  assert.deepEqual(names.sort(),['nostromo_auditoria_r0','nostromo_estado','nostromo_herramientas','nostromo_terminal_ejecutar','nostromo_terminal_preparar']);
  assert.match(toolList.find(t=>t.name==='nostromo_estado').description,/R0 read-only, structured status/i);
  assert.match(toolList.find(t=>t.name==='nostromo_estado').description,/explicitly asks for nostromo_estado/i);
  const toolView=parse(await client.callTool({name:'nostromo_herramientas',arguments:{}}));
  assert.equal(toolView.tools.length,12);
  assert.equal(toolView.tools.filter(t=>t.enabled).length,5);
  assert.equal(toolView.mutableByModel,false);
  const state=parse(await client.callTool({name:'nostromo_estado',arguments:{}}));
  assert.equal(state.kind,'nostromo.autonomous.local-mcp.v1');
  assert.equal(state.enabled,false);
  assert.equal(state.mcpLive,true);
  const call=await client.callTool({name:'nostromo_terminal_ejecutar',arguments:{cwd:'/tmp',argv:['pwd']}});
  assert.equal(call.isError,true);
  assert.equal(parse(call).status,'DISABLED');
 });
});
test('MCP stdio scoped directory listing is opt-in, R0 and never reveals secret names',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-mcp-dir-'));
 try{
  await writeFile(path.join(root,'public.md'),'SAFE');
  await writeFile(path.join(root,'.env'),'TOKEN=PRIVATE');
  await writeFile(path.join(root,'secret-token.txt'),'HIDDEN');
  await withServer({NOSTROMO_MCP_ENABLED:'1',NOSTROMO_ALLOWED_ROOTS:root,
      NOSTROMO_TOOL_SET:'nostromo_directorio_listar'},async client=>{
    const listed=(await client.listTools()).tools.map(x=>x.name);
    assert.equal(listed.includes('nostromo_directorio_listar'),true);
    assert.equal(listed.includes('nostromo_terminal_ejecutar'),false);
    const response=await client.callTool({name:'nostromo_directorio_listar',
      arguments:{directory:root,maxEntries:12}});
    assert.notEqual(response.isError,true);
    const data=parse(response);
    assert.equal(data.status,'READ_OK');
    assert.equal(data.entries.includes('public.md'),true);
    assert.equal(data.entries.includes('.env'),false);
    assert.equal(data.entries.includes('secret-token.txt'),false);
    assert.equal(data.materialVerified,false);
  });
 }finally{await rm(root,{recursive:true,force:true});}
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
   assert.deepEqual(tools,['nostromo_auditoria_r0','nostromo_estado','nostromo_herramientas','nostromo_terminal_preparar']);
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

test('MCP async tool calls return jobId, permit polling and bound R2 without approval',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-async-stdio-'));
 try{
  await withServer({
    NOSTROMO_MCP_ENABLED:'1',NOSTROMO_ALLOWED_ROOTS:root,
    NOSTROMO_APPROVAL_DIR:'',
    NOSTROMO_TOOL_SET:'nostromo_tarea_iniciar,nostromo_tarea_estado,nostromo_tarea_cancelar',
  },async client=>{
    const tools=(await client.listTools()).tools.map(t=>t.name);
    assert.ok(tools.includes('nostromo_tarea_iniciar'));
    assert.ok(tools.includes('nostromo_tarea_estado'));
    assert.ok(tools.includes('nostromo_tarea_cancelar'));
    assert.equal(tools.includes('nostromo_terminal_ejecutar'),false);
    const started=parse(await client.callTool({
      name:'nostromo_tarea_iniciar',
      arguments:{cwd:root,argv:['pwd'],timeout_s:5,max_output:1024}
    }));
    assert.equal(started.status,'RUNNING');
    assert.equal(started.persisted,true);
    assert.equal(started.started,true);
    let final;
    for(let i=0;i<100;i++){
      const data=parse(await client.callTool({
        name:'nostromo_tarea_estado',arguments:{jobId:started.jobId}
      }));
      if(data.finishedAt){final=data;break;}
      await new Promise(r=>setTimeout(r,20));
    }
    assert.ok(final,'expected terminal readback');
    assert.equal(final.status,'EXIT_0');
    assert.equal(final.result.exitCode,0);
    assert.match(final.result.stdout,/nostromo-async-stdio-/);
    assert.equal(final.materialVerified,false);
    const denied=parse(await client.callTool({name:'nostromo_tarea_iniciar',
      arguments:{cwd:root,argv:['/bin/sh','-c','echo unsafe']}}));
    assert.equal(denied.status,'LOCAL_APPROVAL_REQUIRED');
    assert.equal(denied.started,false);
    const missing=parse(await client.callTool({name:'nostromo_tarea_estado',
      arguments:{jobId:'00000000-0000-4000-8000-000000000000'}}));
    assert.equal(missing.status,'NOT_FOUND');
  });
 }finally{await rm(root,{recursive:true,force:true});}
});


test('MCP persistent async task survives server restart without replay',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-persistent-mcp-'));
 const request={cwd:root,argv:['pwd'],timeout_s:5,max_output:1024,idempotency_key:'d'.repeat(64)};
 const env={
   NOSTROMO_MCP_ENABLED:'1',NOSTROMO_ALLOWED_ROOTS:root,
   NOSTROMO_APPROVAL_DIR:root,
   NOSTROMO_TOOL_SET:'nostromo_terminal_preparar,nostromo_tarea_iniciar,nostromo_tarea_estado,nostromo_tarea_cancelar'
 };
 try{
  let jobId;
  await withServer(env,async client=>{
   const names=(await client.listTools()).tools.map(t=>t.name);
   assert.ok(names.includes('nostromo_tarea_iniciar'));
   assert.ok(names.includes('nostromo_tarea_estado'));
   assert.ok(names.includes('nostromo_tarea_cancelar'));
   assert.equal(names.includes('nostromo_terminal_ejecutar'),false);
   const identity=parse(await client.callTool({name:'nostromo_estado',arguments:{}}));
   assert.equal(identity.taskPersistence,'READY');
   const started=parse(await client.callTool({name:'nostromo_tarea_iniciar',arguments:request}));
   assert.equal(started.status,'RUNNING');
   assert.equal(started.persisted,true);
   jobId=started.jobId;
   let final;
   for(let i=0;i<100;i++){
    const value=parse(await client.callTool({name:'nostromo_tarea_estado',arguments:{jobId}}));
    if(value.finishedAt){final=value;break;}
    await new Promise(resolve=>setTimeout(resolve,20));
   }
   assert.equal(final?.status,'EXIT_0');
   assert.equal(final?.persisted,true);
  });
  await withServer(env,async client=>{
   const recovered=parse(await client.callTool({name:'nostromo_tarea_estado',arguments:{jobId}}));
   assert.equal(recovered.status,'EXIT_0');
   assert.equal(recovered.persisted,true);
   assert.equal(recovered.result.exitCode,0);
   assert.equal(recovered.materialVerified,false);
   const retry=parse(await client.callTool({name:'nostromo_tarea_iniciar',arguments:request}));
   assert.equal(retry.jobId,jobId);
   assert.equal(retry.deduplicated,true);
   assert.equal(retry.started,false);
   const conflict=parse(await client.callTool({name:'nostromo_tarea_iniciar',arguments:{...request,argv:['uname']}}));
   assert.equal(conflict.status,'IDEMPOTENCY_CONFLICT');
  });
 }finally{await rm(root,{recursive:true,force:true});}
});

test('MCP uses private default task state and restores results when approval storage is unset',async()=>{
 const home=await mkdtemp(path.join(tmpdir(),'nostromo-default-home-'));
 const env={
   HOME:home,NOSTROMO_MCP_ENABLED:'1',NOSTROMO_ALLOWED_ROOTS:home,
   NOSTROMO_APPROVAL_DIR:'',
   NOSTROMO_TOOL_SET:'nostromo_tarea_iniciar,nostromo_tarea_estado,nostromo_tarea_cancelar'
 };
 try{
  let jobId;
  await withServer(env,async client=>{
   const state=parse(await client.callTool({name:'nostromo_estado',arguments:{}}));
   assert.equal(state.taskPersistence,'READY');
   const started=parse(await client.callTool({name:'nostromo_tarea_iniciar',arguments:{
    cwd:home,argv:['pwd'],timeout_s:5,max_output:1024
   }}));
   assert.equal(started.persisted,true);
   jobId=started.jobId;
   let final;
   for(let i=0;i<100;i++){
    const value=parse(await client.callTool({name:'nostromo_tarea_estado',arguments:{jobId}}));
    if(value.finishedAt){final=value;break;}
    await new Promise(resolve=>setTimeout(resolve,20));
   }
   assert.equal(final?.status,'EXIT_0');
  });
  await withServer(env,async client=>{
   const recovered=parse(await client.callTool({name:'nostromo_tarea_estado',arguments:{jobId}}));
   assert.equal(recovered.status,'EXIT_0');
   assert.equal(recovered.persisted,true);
  });
 }finally{await rm(home,{recursive:true,force:true});}
});
