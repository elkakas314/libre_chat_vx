import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
const upstream=process.env.NOSTROMO_E5_TEST_UPSTREAM;
const mcp=process.env.NOSTROMO_E5_INSTALLED_MCP;

test('native metrics lane: Mongo real, MCP installed, source frontend plan and durable no-replay',
{skip:!upstream||!mcp,timeout:20000},async()=>{
 const require=createRequire(import.meta.url),hostRequire=createRequire(path.join(upstream,'api','package.json'));
 const mcpRequire=createRequire(path.join(mcp,'server.mjs'));
 const {MongoClient,ObjectId}=hostRequire('mongodb');
 const {Client}=await import(mcpRequire.resolve('@modelcontextprotocol/sdk/client/index.js'));
 const {StdioClientTransport}=await import(mcpRequire.resolve('@modelcontextprotocol/sdk/client/stdio.js'));
 const {NativeObjectiveAgreement,mongoConversationAgreementStore}=require('../../dist/src/librechat/nativeObjectiveAgreement.js');
 const {NativeObjectiveReceiptStore}=require('../../dist/src/librechat/nativeObjectiveReceipts.js');
 const {NativeObjectiveDispatchLedger}=require('../../dist/src/librechat/nativeObjectiveDispatchLedger.js');
 const {METRICS_OBJECTIVE,METRICS_EXPECTED,METRICS_ARGUMENT_REF,METRICS_CWD,executeNativeMetrics}=
  require('../../dist/src/librechat/nativeMetricsExecution.js');
 const {normalizeMcpToolResult}=require('../../dist/src/cockpit/governedMcpDispatch.js');
 const db=new MongoClient('mongodb://127.0.0.1:27017',{serverSelectionTimeoutMS:3000});
 const id=new ObjectId(),tag=randomUUID(),scope={userId:'nostromo-metrics-fixture-'+tag,tenantId:'fixture-'+tag,conversationId:randomUUID()};
 let inserted=false,client=null;let calls=0;
 try {
  await db.connect();const collection=db.db('LibreChat').collection('conversations');
  await collection.insertOne({_id:id,user:scope.userId,tenantId:scope.tenantId,
   conversationId:scope.conversationId,nostromoE5Fixture:true,expiredAt:null});inserted=true;
  const agreements=new NativeObjectiveAgreement(mongoConversationAgreementStore(collection));
  const proposal={schema:'nostromo.objective.handoff.v1',objective_ref:'fixture-metrics',
   conversation_ref:scope.conversationId,agreement_ref:'untrusted',plan_hash:'a'.repeat(64),plan_version:1,
   execution_lane:'NOSTROMO_LOCAL',target_id:'NOSTROMO_LOCAL',objective:METRICS_OBJECTIVE,
   expected_result:METRICS_EXPECTED,
   acceptance_criteria:[{criterion_id:'metrics',predicate_ref:'nostromo.metrics.read'}],
   capability_refs:['nostromo_metricas'],context_refs:[METRICS_ARGUMENT_REF],
   constraints:{no_paid_fallback:true,max_execution_seconds:12},risk:'R0',idempotency_key:'b'.repeat(64),
   readback_required:true,status:'AGREED',authority:false};
  const preview=await agreements.preview(scope,proposal,0);assert.equal(preview.ok,true);
  const agreed=await agreements.confirm(scope,1,preview.preview.plan_hash,preview.revision);assert.equal(agreed.ok,true);
  const transport=new StdioClientTransport({command:process.execPath,args:[path.join(mcp,'server.mjs')],
   env:{PATH:process.env.PATH??'',NOSTROMO_MCP_ENABLED:'1',NOSTROMO_ALLOWED_ROOTS:METRICS_CWD,
    NOSTROMO_APPROVAL_DIR:METRICS_CWD,NOSTROMO_TOOL_SET:'nostromo_metricas'},stderr:'pipe'});
  client=new Client({name:'nostromo-metrics-native-fixture',version:'1'},{capabilities:{}});
  await client.connect(transport);
  const tools=(await client.listTools()).tools;assert.ok(tools.find(x=>x.name==='nostromo_metricas'));
  const receipts=new NativeObjectiveReceiptStore(collection,agreements);
  const makeLedger=()=>new NativeObjectiveDispatchLedger(collection,agreements,receipts,scope,agreed.handoff);
  const port={available:async()=>true,call:async(_timeoutMs,cwd)=>{
   assert.equal(cwd,METRICS_CWD);calls++;
   return normalizeMcpToolResult(await client.callTool({name:'nostromo_metricas',arguments:{cwd}}));
  }};
  const input={scope,planVersion:1,planHash:agreed.handoff.plan_hash,agreements,receipts,port};
  const first=await executeNativeMetrics({...input,ledger:makeLedger()});
  assert.equal(first.status,'VERIFIED',JSON.stringify(first).slice(0,250));
  assert.equal(calls,2);assert.equal((await receipts.read(scope,first.receiptRef)).outcome,'VERIFIED');
  const again=await executeNativeMetrics({...input,ledger:makeLedger()});
  assert.equal(again.status,'DENIED');assert.equal(again.reason,'IDEMPOTENT_REPLAY_VERIFIED');
  assert.equal(calls,2);
  const wrong=await executeNativeMetrics({...input,scope:{...scope,userId:'wrong'},ledger:makeLedger()});
  assert.equal(wrong.status,'DENIED');
  console.log('E5_NATIVE_METRICS_MONGO_MCP_PASS',JSON.stringify({calls,modelCalls:0,
   agreementFixture:true,ownerMcpPermissionsFixture:true,realMongo:true}));
 }finally {
  if(client)await client.close().catch(()=>{});
  if(inserted){const n=await db.db('LibreChat').collection('conversations').deleteOne({_id:id,
   conversationId:scope.conversationId,user:scope.userId,nostromoE5Fixture:true});assert.equal(n.deletedCount,1);}
  await db.close();
 }
});
