import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createNativeMcpMetricsPort}=require('../../deployment/librechat-agents/native-mcp-metrics-port.cjs');
const cwd='/home/elkakas314';
function fixture(){
 const calls=[];const config={type:'stdio',command:'/installed/wrapper',args:[]};
 const req={user:{id:'owner',role:'USER'}};
 const services={async userCanUseMCPServers(){return true;},async getAccessibleMCPServers(){return {'nostromo-local':config};}};
 const registry={async isAppServerConfig(){return true;}};
 const manager={async getServerToolFunctionsSnapshot(){return {tools:{'nostromo_metricas_mcp_nostromo-local':
  {type:'function',function:{parameters:{type:'object'}}}}};},
  async callTool(args){calls.push(args);return [JSON.stringify({status:'READ_OK',loadAvg:[0.5,0.3,0.4]}),undefined];}};
 const deps={req,services,registry,manager,flowManager:{},expectedCommand:'/installed/wrapper',expectedCwd:cwd};
 return {deps,calls,port:createNativeMcpMetricsPort(deps)};
}
test('native metrics port uses fixed operator cwd and user native manager',async()=>{
 const {port,calls}=fixture();assert.equal(await port.available(),true);
 assert.equal((await port.call(1000,cwd)).status,'OK');
 assert.equal(calls.length,1);assert.equal(calls[0].toolName,'nostromo_metricas');
 assert.equal(calls[0].serverName,'nostromo-local');
 assert.deepEqual(calls[0].toolArguments,{cwd});
 assert.equal((await port.call(1000,'/etc')).status,'UNKNOWN_OUTCOME');assert.equal(calls.length,1);
});
test('native metrics port fails closed on shadow server, ACL denial, ambiguous catalog',async()=>{
 for(const mode of ['privilege','shadow','catalog','wrong-executable']){
  const {deps,calls}=fixture();
  if(mode==='privilege')deps.services.userCanUseMCPServers=async()=>false;
  if(mode==='shadow')deps.registry.isAppServerConfig=async()=>false;
  if(mode==='catalog')deps.manager.getServerToolFunctionsSnapshot=async()=>({tools:{}});
  if(mode==='wrong-executable')deps.expectedCommand='/wrong/wrapper';
  const port=createNativeMcpMetricsPort(deps);assert.equal(await port.available(),false,mode);
  assert.equal((await port.call(2000,cwd)).status,'UNKNOWN_OUTCOME');
  assert.equal(calls.length,0);
 }
});
test('native metrics port rejects malformed response and timeouts',async()=>{
 const {deps}=fixture();deps.manager.callTool=async()=>['not json'];
 assert.equal((await createNativeMcpMetricsPort(deps).call(2000,cwd)).status,'UNKNOWN_OUTCOME');
 assert.equal((await createNativeMcpMetricsPort(deps).call(0,cwd)).status,'UNKNOWN_OUTCOME');
});
