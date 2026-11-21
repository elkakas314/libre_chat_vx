/** E5 fixture: installed MCP stdio binary, fake agreement/ACL; never claim authenticated E2E. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const app = process.env.NOSTROMO_E5_INSTALLED_MCP_DIR;
const enabled = Boolean(app && existsSync(app+'/package.json') && existsSync(app+'/server.mjs'));
const sdkRequire = enabled ? createRequire(app + '/package.json') : null;
const { dispatchGovernedObjective, normalizeMcpToolResult } = createRequire(import.meta.url)('../../dist/src/cockpit/governedMcpDispatch.js');
test('FIXTURE installed MCP binary + governed read-only dispatch; no LLM, mock agreement', {timeout:15000,skip:!enabled}, async()=>{
 const { Client } = sdkRequire('@modelcontextprotocol/sdk/client/index.js');
 const { StdioClientTransport } = sdkRequire('@modelcontextprotocol/sdk/client/stdio.js');
 let llmCalls=0, physicalCalls=0;
 const fixtureDir=await mkdtemp(path.join(tmpdir(),'nostromo-e5-dispatch-'));
 const t=new StdioClientTransport({command:process.execPath,
   args:[app+'/server.mjs'],
   env:{PATH:'/usr/bin:/bin',NOSTROMO_MCP_ENABLED:'1',NOSTROMO_APPROVAL_DIR:fixtureDir,
      NOSTROMO_ALLOWED_ROOTS:'/home/elkakas314',
      NOSTROMO_TOOL_SET:'nostromo_metricas,nostromo_directorio_listar'},
   stderr:'pipe'});
 const client=new Client({name:'e5-governed-fixture',version:'1.0'},{capabilities:{}});
 try{
  await client.connect(t);
  const names=(await client.listTools()).tools;
  const tool=names.find(z=>z.name==='nostromo_estado');
  assert.ok(tool,'nostromo_estado installed tool');
  const host={
   async verifyAgreement(){return true;}, // fixture ONLY
   async checkOwnerAuthority(){return true;}, // fixture ONLY
   async readCapabilities(){return {observedAtMs:Date.now(),entries:[{
     capabilityRef:'nostromo.estado',targetId:'NOSTROMO_LOCAL',toolId:'nostromo_estado',
     risk:'R0',availability:'LIVE',registryBacked:true,aclAllowed:true,
     adapterLive:true,sourceRevision:'MCP_INSTALLED_FIXTURE'}]};},
   async readToolSchema(){return {inputSchema:tool.inputSchema,safeRepeatReadback:true};},
   async verifyAcceptance(_handoff,_criterion,observation){return observation?.mcpLive===true?'PASS':'FAIL';},
   async writeReceipt(){return {receiptRef:'FIXTURE_ONLY'};}
  };
  const handoff={schema:'nostromo.objective.handoff.v1',objective_ref:'fixture-e5',
   conversation_ref:'fixture-conversation',agreement_ref:'fixture-agreement',
   plan_hash:'a'.repeat(64),plan_version:1,execution_lane:'NOSTROMO_LOCAL',
   target_id:'NOSTROMO_LOCAL',objective:'Consultar estado',expected_result:'MCP Live',
   acceptance_criteria:[{criterion_id:'status',predicate_ref:'nostromo.mcp.live'}],
   capability_refs:['nostromo.estado'],context_refs:[],
   constraints:{no_paid_fallback:true,max_execution_seconds:10},risk:'R0',
   idempotency_key:'b'.repeat(64),readback_required:true,status:'AGREED',authority:false};
  const result=await dispatchGovernedObjective({
   handoff,args:{},host,
   transport:{async callTool(call){physicalCalls++;return normalizeMcpToolResult(await client.callTool({name:call.name,arguments:call.arguments}));}},
   owner:{principalRef:'fixture-user',tenantRef:null},llmGuard:{assertNotCalled(){assert.equal(llmCalls,0);}}
  });
  assert.equal(result.status,'VERIFIED',JSON.stringify(result).slice(0,280));
  assert.equal(physicalCalls,2,'R0 execution and independent readback');
  assert.equal(llmCalls,0);
  console.log('E5_MCP_FIXTURE_VERIFIED',JSON.stringify({calls:physicalCalls,LLM_CALLS:llmCalls,installedExecutable:true,agreementAuthenticated:false}));
 }finally{await client.close().catch(()=>{});await rm(fixtureDir,{recursive:true,force:true});}
});
