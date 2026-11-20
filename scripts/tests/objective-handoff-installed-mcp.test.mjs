import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

// Integration fixture: real installed MCP executable and SDK, synthetic host agreement/ACL.
// It is NOT an authenticated LibreChat task or proof that the runtime is wired.
const installed = process.env.NOSTROMO_E5_INSTALLED_MCP;
test('validated preflight can reach installed MCP in an isolated stdio fixture with no model', { skip: !installed, timeout: 20000 }, async () => {
  const require = createRequire(import.meta.url);
  const hostRequire = createRequire(path.join(installed, 'server.mjs'));
  const { Client } = await import(hostRequire.resolve('@modelcontextprotocol/sdk/client/index.js'));
  const { StdioClientTransport } = await import(hostRequire.resolve('@modelcontextprotocol/sdk/client/stdio.js'));
  const { resolveNativeAgreedObjective } = require('../../dist/src/librechat/nativeInferenceRouteAdapter.js');
  const root = await mkdtemp(path.join(tmpdir(), 'nostromo-e5-contract-'));
  const transport = new StdioClientTransport({ command:process.execPath, args:[path.join(installed,'server.mjs')],
    env:{ PATH:process.env.PATH ?? '', NOSTROMO_MCP_ENABLED:'1', NOSTROMO_ALLOWED_ROOTS:root,
      NOSTROMO_APPROVAL_DIR:root, NOSTROMO_TOOL_SET:'nostromo_estado,nostromo_metricas' }, stderr:'pipe' });
  const client = new Client({name:'nostromo-e5-isolated-fixture',version:'1'},{capabilities:{}});
  try {
    await client.connect(transport);
    const announced=await client.listTools();
    const request={ schema:'nostromo.objective.handoff.v1',objective_ref:'fixture',conversation_ref:'fixture',agreement_ref:'fixture',
      plan_hash:'a'.repeat(64),plan_version:1,execution_lane:'NOSTROMO_LOCAL',target_id:'NOSTROMO_LOCAL',objective:'Read MCP state',
      expected_result:'State read',acceptance_criteria:[{criterion_id:'state',predicate_ref:'state-read'}],capability_refs:['nostromo_estado'],
      context_refs:[],constraints:{no_paid_fallback:true,max_execution_seconds:30},risk:'R0',idempotency_key:'b'.repeat(64),
      readback_required:true,status:'AGREED',authority:false };
    const preflight=await resolveNativeAgreedObjective(request,{
      verifyAgreement:async()=>true, // test fixture only; not a real host agreement
      readCapabilities:async()=>({observedAtMs:Date.now(),entries:announced.tools.filter((tool)=>tool.name==='nostromo_estado').map((tool)=>({
        capabilityRef:tool.name,toolId:tool.name,targetId:'NOSTROMO_LOCAL',risk:'R0',availability:'LIVE',
        registryBacked:true,aclAllowed:true,adapterLive:true,sourceRevision:'isolated-test-handshake' }))}),
      checkOwnerAuthority:async()=>true, // test fixture only; not a real owner grant
    });
    assert.equal(preflight.ok,true);
    assert.equal(preflight.authority,false);
    const response=await client.callTool({name:preflight.tools[0].toolId,arguments:{}});
    const state=JSON.parse(response.content.find((item)=>item.type==='text').text);
    assert.equal(state.mcpLive,true);
    assert.equal(state.hostExecutionAuthority,false);
    const metrics=await client.callTool({name:'nostromo_metricas',arguments:{cwd:root}});
    assert.equal(JSON.parse(metrics.content.find((item)=>item.type==='text').text).status,'READ_OK');
  } finally {
    await client.close();
    await rm(root,{recursive:true,force:true});
  }
});
