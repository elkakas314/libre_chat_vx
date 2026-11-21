import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
const upstream=process.env.NOSTROMO_E5_TEST_UPSTREAM;
const mcp=process.env.NOSTROMO_E5_INSTALLED_MCP;
test('SOURCE fixture: real Mongo claim -> existing MCP metrics -> receipt -> reconnect replay denied; LLM=0',
{skip:!upstream||!mcp,timeout:20000},async()=>{
 const require=createRequire(import.meta.url);
 const hostRequire=createRequire(path.join(upstream,'api','package.json'));
 const mcpRequire=createRequire(path.join(mcp,'server.mjs'));
 const {MongoClient,ObjectId}=hostRequire('mongodb');
 const {Client}=await import(mcpRequire.resolve('@modelcontextprotocol/sdk/client/index.js'));
 const {StdioClientTransport}=await import(mcpRequire.resolve('@modelcontextprotocol/sdk/client/stdio.js'));
 const {NativeObjectiveAgreement,mongoConversationAgreementStore}=require('../../dist/src/librechat/nativeObjectiveAgreement.js');
 const {NativeObjectiveReceiptStore}=require('../../dist/src/librechat/nativeObjectiveReceipts.js');
 const {NativeObjectiveDispatchLedger}=require('../../dist/src/librechat/nativeObjectiveDispatchLedger.js');
 const {createNativeAgreementArgumentBinding}=require('../../dist/src/librechat/nativeGovernedExecution.js');
 const {dispatchGovernedObjective,argumentCommitment,normalizeMcpToolResult}=require('../../dist/src/cockpit/governedMcpDispatch.js');
 const db=new MongoClient('mongodb://127.0.0.1:27017',{serverSelectionTimeoutMS:3000});
 const id=new ObjectId(),tag=randomUUID(),scope={userId:'nostromo-dispatch-tool-fixture-'+tag,tenantId:'fixture-'+tag,conversationId:randomUUID()};
 const root=await mkdtemp(path.join(tmpdir(),'nostromo-e5-toolfixture-'));
 let inserted=false,client=null;
 let mcpCalls=0,llmCalls=0;
 try{
  await db.connect();const collection=db.db('LibreChat').collection('conversations');
  await collection.insertOne({_id:id,user:scope.userId,tenantId:scope.tenantId,conversationId:scope.conversationId,
   nostromoE5Fixture:true,title:'NOSTROMO E5 disposable live-tool fixture',expiredAt:null});inserted=true;
  const agreements=new NativeObjectiveAgreement(mongoConversationAgreementStore(collection));
  const args={cwd:root},ref=argumentCommitment(args);assert.ok(ref);
  const proposed={schema:'nostromo.objective.handoff.v1',objective_ref:'metrics-fixture',
   conversation_ref:scope.conversationId,agreement_ref:'untrusted',plan_hash:'a'.repeat(64),plan_version:1,
   execution_lane:'NOSTROMO_LOCAL',target_id:'NOSTROMO_LOCAL',objective:'Consult host metrics within fixture root',
   expected_result:'READ_OK from MCP metric tool',acceptance_criteria:[{criterion_id:'metrics',predicate_ref:'nostromo.metrics.read'}],
   capability_refs:['nostromo_metricas'],context_refs:[ref],
   constraints:{no_paid_fallback:true,max_execution_seconds:12},risk:'R0',idempotency_key:'b'.repeat(64),
   readback_required:true,status:'AGREED',authority:false};
  const preview=await agreements.preview(scope,proposed,0);assert.equal(preview.ok,true);
  const agreement=await agreements.confirm(scope,1,preview.preview.plan_hash,preview.revision);assert.equal(agreement.ok,true);
  const handoff=agreement.handoff;
  const transport=new StdioClientTransport({command:process.execPath,args:[path.join(mcp,'server.mjs')],
   env:{PATH:process.env.PATH??'',NOSTROMO_MCP_ENABLED:'1',NOSTROMO_ALLOWED_ROOTS:root,
    NOSTROMO_APPROVAL_DIR:root,NOSTROMO_TOOL_SET:'nostromo_metricas'},stderr:'pipe'});
  client=new Client({name:'nostromo-e5-ledger-integration-fixture',version:'1'},{capabilities:{}});
  await client.connect(transport);
  const announced=await client.listTools();
  assert.ok(announced.tools.find(x=>x.name==='nostromo_metricas'));
  const receipts=new NativeObjectiveReceiptStore(collection,agreements);
  const ledger=new NativeObjectiveDispatchLedger(collection,agreements,receipts,scope,handoff);
  const entry={targetId:'NOSTROMO_LOCAL',capabilityRef:'nostromo_metricas',toolId:'nostromo_metricas',
   risk:'R0',availability:'LIVE',registryBacked:true,aclAllowed:true,adapterLive:true,sourceRevision:'isolated-mcp-fixture'};
  const binding=createNativeAgreementArgumentBinding({agreements,scope,
   presentationReadback:async()=>true}); // Synthetic consent, fixture ONLY.
  const host={
   verifyAgreement:handoff=>agreements.verify(scope,handoff),
   readCapabilities:async()=>({observedAtMs:Date.now(),entries:[entry]}),
   checkOwnerAuthority:async()=>true, // Synthetic owner authorization, fixture ONLY.
   readToolSchema:async()=>({inputSchema:{type:'object',additionalProperties:false,
    properties:{cwd:{type:'string',minLength:1}},required:['cwd']},safeRepeatReadback:true}),
   verifyArgumentsBinding:binding,
   verifyAcceptance:async(_h,_crit,observation)=>observation?.status==='READ_OK'?'PASS':'FAIL',
   writeReceipt:receipt=>receipts.write(scope,receipt),
  };
  const wire={async callTool(call){mcpCalls++; assert.equal(call.name,'nostromo_metricas');
    const raw=await client.callTool({name:call.name,arguments:call.arguments});
    return normalizeMcpToolResult(raw);
  }};
  const input={handoff,args,host,ledger,transport:wire,owner:{principalRef:scope.userId,tenantRef:scope.tenantId},
   llmGuard:{assertNotCalled(){assert.equal(llmCalls,0);}}};
  const result=await dispatchGovernedObjective(input);
  assert.equal(result.status,'VERIFIED',JSON.stringify(result).slice(0,300));
  assert.equal(mcpCalls,2);
  assert.equal((await ledger.get(handoff.idempotency_key)).state,'VERIFIED');
  assert.equal((await receipts.read(scope,result.receiptRef)).outcome,'VERIFIED');
  const afterReconnection=new NativeObjectiveDispatchLedger(collection,agreements,receipts,scope,handoff);
  const replay=await dispatchGovernedObjective({...input,ledger:afterReconnection});
  assert.equal(replay.status,'DENIED');
  assert.equal(replay.reason,'IDEMPOTENT_REPLAY_VERIFIED');
  assert.equal(mcpCalls,2,'do not replay tool');
  assert.equal(llmCalls,0);
  console.log('E5_INSTALLED_MCP_MONGO_DISPATCH_FIXTURE_PASS',JSON.stringify({
   mcpCalls,llmCalls,realMongo:true,installedMcpBinary:true,
   authenticatedRealSession:false,ownerAuthorizationSynthetic:true,argumentPresentationSynthetic:true}));
 }finally {
  if(client)await client.close().catch(()=>{});
  if(inserted){const removed=await db.db('LibreChat').collection('conversations').deleteOne({
    _id:id,user:scope.userId,conversationId:scope.conversationId,nostromoE5Fixture:true});
   assert.equal(removed.deletedCount,1,'fixture cleanup failed');}
  await db.close();
  await rm(root,{recursive:true,force:true});
 }
});
