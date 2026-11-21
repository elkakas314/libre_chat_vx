import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createNativeMcpStatusPort}=require('../../deployment/librechat-agents/native-mcp-status-port.cjs');
function fixture(){
 const calls=[];const config={type:'stdio',command:'/installed/wrapper',args:[]};
 const req={user:{id:'owner',role:'USER'}};
 const services={async userCanUseMCPServers(){return true;},async getAccessibleMCPServers(){return {'nostromo-local':config};}};
 const registry={async isAppServerConfig(){return true;}};
 const manager={async getServerToolFunctionsSnapshot(){return {tools:{'nostromo_estado_mcp_nostromo-local':{type:'function',function:{parameters:{type:'object'}}}}};},
  async callTool(args){calls.push(args);return [JSON.stringify({kind:'nostromo.autonomous.local-mcp.v1',mcpLive:true}),undefined];}};
 const deps={req,services,registry,manager,flowManager:{},expectedCommand:'/installed/wrapper'};
 return {deps,calls,port:createNativeMcpStatusPort(deps)};
}
test('uses the scoped native manager for the fixed status tool',async()=>{
 const {port,calls}=fixture();assert.equal(await port.available(),true);
 assert.equal((await port.call(1000)).status,'OK');assert.equal(calls.length,1);
 assert.equal(calls[0].serverName,'nostromo-local');assert.equal(calls[0].toolName,'nostromo_estado');assert.deepEqual(calls[0].toolArguments,{});
});
test('denies missing privilege, shadow server and unavailable catalog',async()=>{
 for(const scenario of ['privilege','shadow','catalog']){
  const {deps,calls}=fixture();
  if(scenario==='privilege')deps.services.userCanUseMCPServers=async()=>false;
  if(scenario==='shadow')deps.registry.isAppServerConfig=async()=>false;
  if(scenario==='catalog')deps.manager.getServerToolFunctionsSnapshot=async()=>({tools:{}});
  const port=createNativeMcpStatusPort(deps);assert.equal(await port.available(),false);
  assert.equal((await port.call(1000)).status,'UNKNOWN_OUTCOME');assert.equal(calls.length,0);
 }
});
test('rejects unexpected executable and malformed manager output',async()=>{
 let {deps,calls}=fixture();deps.expectedCommand='/wrong/wrapper';let port=createNativeMcpStatusPort(deps);
 assert.equal(await port.available(),false);assert.equal(calls.length,0);
 ({deps}=fixture());deps.manager.callTool=async()=>['not json'];port=createNativeMcpStatusPort(deps);
 assert.equal((await port.call(1000)).status,'UNKNOWN_OUTCOME');
});

test('native port reaches the installed MCP through an isolated manager fixture', {skip:!process.env.NOSTROMO_E5_INSTALLED_MCP_DIR,timeout:20000},async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const path=await import('node:path');
 const dir=process.env.NOSTROMO_E5_INSTALLED_MCP_DIR, reqForMcp=createRequire(path.join(dir,'server.mjs'));
 const {Client}=await import(reqForMcp.resolve('@modelcontextprotocol/sdk/client/index.js'));
 const {StdioClientTransport}=await import(reqForMcp.resolve('@modelcontextprotocol/sdk/client/stdio.js'));
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-status-port-'));let client;
 try{
  client=new Client({name:'nostromo-status-port-fixture',version:'1'},{capabilities:{}});
  await client.connect(new StdioClientTransport({command:process.execPath,args:[path.join(dir,'server.mjs')],stderr:'pipe',
    env:{PATH:process.env.PATH??'',NOSTROMO_MCP_ENABLED:'1',NOSTROMO_ALLOWED_ROOTS:root,NOSTROMO_APPROVAL_DIR:root,NOSTROMO_TOOL_SET:'nostromo_estado'}}));
  const tools=await client.listTools();assert.ok(tools.tools.some(t=>t.name==='nostromo_estado'));
  const {deps}=fixture();deps.manager.getServerToolFunctionsSnapshot=async()=>({tools:{'nostromo_estado_mcp_nostromo-local':
    {type:'function',function:{parameters:tools.tools.find(t=>t.name==='nostromo_estado').inputSchema}}}});
  deps.manager.callTool=async({toolName,toolArguments})=>{const result=await client.callTool({name:toolName,arguments:toolArguments});
    return [result.content.find(c=>c.type==='text')?.text,undefined];};
  const result=await createNativeMcpStatusPort(deps).call(5000);
  assert.equal(result.status,'OK');assert.equal(result.structuredContent.mcpLive,true);
 }finally{if(client)await client.close();await rm(root,{recursive:true,force:true});}
});
