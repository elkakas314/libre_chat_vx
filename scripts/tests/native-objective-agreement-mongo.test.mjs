import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';

// Opt-in integration fixture uses the existing local database and collection.
// It creates and deletes only its own random, explicitly marked test record.
const upstream=process.env.NOSTROMO_E5_TEST_UPSTREAM;
const installedMcp=process.env.NOSTROMO_E5_INSTALLED_MCP;
test('agreement CAS and owner isolation on the existing local Mongo conversation collection',
  {skip:!upstream,timeout:20000},async()=>{
  const require=createRequire(import.meta.url);
  const hostRequire=createRequire(path.join(upstream,'api','package.json'));
  const {MongoClient,ObjectId}=hostRequire('mongodb');
  const {NativeObjectiveAgreement,mongoConversationAgreementStore}=require('../../dist/src/librechat/nativeObjectiveAgreement.js');
  const client=new MongoClient('mongodb://127.0.0.1:27017',{serverSelectionTimeoutMS:3000});
  const fixtureId=new ObjectId(),suffix=randomUUID(),scope={userId:'nostromo-fixture-'+suffix,tenantId:'fixture-'+suffix,conversationId:randomUUID()};
  let inserted=false;
  try{
    await client.connect();
    const collection=client.db('LibreChat').collection('conversations');
    await collection.insertOne({_id:fixtureId,user:scope.userId,tenantId:scope.tenantId,conversationId:scope.conversationId,
      nostromoE5Fixture:true,title:'NOSTROMO E5 disposable fixture',expiredAt:null});inserted=true;
    const service=new NativeObjectiveAgreement(mongoConversationAgreementStore(collection));
    const proposal={schema:'nostromo.objective.handoff.v1',objective_ref:'fixture',conversation_ref:scope.conversationId,agreement_ref:'untrusted',
      plan_hash:'a'.repeat(64),plan_version:1,execution_lane:'NOSTROMO_LOCAL',target_id:'NOSTROMO_LOCAL',objective:'Consultar el estado del MCP NOSTROMO',expected_result:'Comprobar si el MCP NOSTROMO responde',
      acceptance_criteria:[{criterion_id:'state',predicate_ref:'nostromo.mcp.live'}],capability_refs:['nostromo_estado'],context_refs:[],
      constraints:{no_paid_fallback:true,max_execution_seconds:30},risk:'R0',idempotency_key:'b'.repeat(64),readback_required:true,status:'AGREED',authority:false};
    const preview=await service.preview(scope,proposal,0);assert.equal(preview.ok,true);
    assert.equal(await service.verify(scope,proposal),false);
    const agreed=await service.confirm(scope,1,preview.preview.plan_hash,preview.revision);assert.equal(agreed.ok,true);
    assert.equal(await service.verify(scope,agreed.handoff),true);
    const reconnected=new NativeObjectiveAgreement(mongoConversationAgreementStore(collection));
    assert.equal(await reconnected.verify(scope,agreed.handoff),true);
    const {NativeObjectiveReceiptStore}=require('../../dist/src/librechat/nativeObjectiveReceipts.js');
    const receipts=new NativeObjectiveReceiptStore(collection,reconnected), h=agreed.handoff;
    const {executeNativeStatus}=require('../../dist/src/librechat/nativeStatusExecution.js');
    let calls=0;
    const port={available:async()=>true,call:async()=>{calls++;return {status:'OK',structuredContent:{kind:'nostromo.autonomous.local-mcp.v1',mcpLive:true}};}};
    const execution=await executeNativeStatus({scope,planVersion:1,planHash:h.plan_hash,agreements:reconnected,receipts,port});
    assert.equal(execution.status,'VERIFIED');assert.equal(calls,2);
    assert.equal((await receipts.read(scope,execution.receiptRef)).outcome,'VERIFIED');
    const last=await receipts.latest(scope,1,h.plan_hash);assert.equal(last.receiptRef,execution.receiptRef);
    assert.equal(await receipts.latest({...scope,tenantId:'other'},1,h.plan_hash),null);
    const denied=await executeNativeStatus({scope,planVersion:1,planHash:h.plan_hash,agreements:reconnected,receipts,
      port:{available:async()=>false,call:async()=>{throw Error('must not dispatch');}}});
    assert.equal(denied.status,'DENIED');
    const receipt={schema:'nostromo.execution.receipt.v1',objective_ref:h.objective_ref,conversation_ref:h.conversation_ref,
      agreement_ref:h.agreement_ref,plan_hash:h.plan_hash,plan_version:h.plan_version,target_id:h.target_id,
      capability_ref:'nostromo_estado',tool_id:'nostromo_estado',risk:'R0',principal_ref:scope.userId,tenant_ref:scope.tenantId,
      idempotency_key:h.idempotency_key,args_hash:'1'.repeat(64),observation_hash:'2'.repeat(64),acceptance:[],
      outcome:'VERIFIED',started_at_ms:1,finished_at_ms:2};
    const simultaneous=await Promise.all([receipts.write(scope,receipt),receipts.write(scope,receipt)]);
    const written=simultaneous[0];assert.ok(written);assert.deepEqual(simultaneous[1],written);
    assert.deepEqual(await receipts.write(scope,receipt),written);
    assert.deepEqual(await receipts.read(scope,written.receiptRef),receipt);
    assert.equal(await receipts.read({...scope,userId:'wrong-user'},written.receiptRef),null);
    assert.equal(await receipts.write(scope,{...receipt,principal_ref:'wrong-user'}),null);
    assert.equal(await service.verify({...scope,userId:'wrong-user'},agreed.handoff),false);
    assert.equal(await service.verify({...scope,tenantId:'wrong-tenant'},agreed.handoff),false);
    // A concurrent or prior host-owned sibling must survive plan updates.
    await collection.updateOne({_id:fixtureId},{$set:{'nostromoObjectiveAgreement.otherHostState':{fixture:'preserved'}}});
    const race=await Promise.all([service.preview(scope,proposal,agreed.revision),service.preview(scope,{...proposal,objective:'changed'},agreed.revision)]);
    assert.equal(race.filter((result)=>result.ok).length,1);
    const preserved=await collection.findOne({_id:fixtureId},{projection:{'nostromoObjectiveAgreement.otherHostState':1}});
    assert.deepEqual(preserved.nostromoObjectiveAgreement.otherHostState,{fixture:'preserved'});
    assert.deepEqual(await receipts.read(scope,written.receiptRef),receipt);
    assert.equal(await receipts.write(scope,receipt),null);
    assert.equal(await receipts.latest(scope,1,h.plan_hash),null);
    assert.equal(await service.verify(scope,agreed.handoff),false);
  }finally{
    if(inserted){
      const removed=await client.db('LibreChat').collection('conversations').deleteOne({_id:fixtureId,user:scope.userId,conversationId:scope.conversationId,nostromoE5Fixture:true});
      assert.equal(removed.deletedCount,1,'fixture cleanup failed');
    }
    await client.close();
  }
});

test('Mongo-backed fixture reaches installed MCP with no model and recovers its task without replay',
  {skip:!upstream||!installedMcp,timeout:20000},async()=>{
  const require=createRequire(import.meta.url),hostRequire=createRequire(path.join(upstream,'api','package.json'));
  const mcpRequire=createRequire(path.join(installedMcp,'server.mjs'));
  const {MongoClient,ObjectId}=hostRequire('mongodb');
  const {Client}=await import(mcpRequire.resolve('@modelcontextprotocol/sdk/client/index.js'));
  const {StdioClientTransport}=await import(mcpRequire.resolve('@modelcontextprotocol/sdk/client/stdio.js'));
  const {NativeObjectiveAgreement,mongoConversationAgreementStore}=require('../../dist/src/librechat/nativeObjectiveAgreement.js');
  const {resolveNativeAgreedObjective}=require('../../dist/src/librechat/nativeInferenceRouteAdapter.js');
  const db=new MongoClient('mongodb://127.0.0.1:27017',{serverSelectionTimeoutMS:3000});
  const fixtureId=new ObjectId(),suffix=randomUUID(),scope={userId:'nostromo-fixture-'+suffix,tenantId:'fixture-'+suffix,conversationId:randomUUID()};
  const root=await mkdtemp(path.join(tmpdir(),'nostromo-e5-mongo-mcp-'));let inserted=false,client;
  const connect=async()=>{
    const transport=new StdioClientTransport({command:process.execPath,args:[path.join(installedMcp,'server.mjs')],
      env:{PATH:process.env.PATH??'',NOSTROMO_MCP_ENABLED:'1',NOSTROMO_ALLOWED_ROOTS:root,NOSTROMO_APPROVAL_DIR:root,
        NOSTROMO_TOOL_SET:'nostromo_metricas,nostromo_tarea_iniciar,nostromo_tarea_estado,nostromo_tarea_cancelar'},stderr:'pipe'});
    const c=new Client({name:'nostromo-e5-mongo-fixture',version:'1'},{capabilities:{}});await c.connect(transport);return c;
  };
  const payload=(response)=>JSON.parse(response.content.find((part)=>part.type==='text').text);
  try{
    await db.connect();const collection=db.db('LibreChat').collection('conversations');
    await collection.insertOne({_id:fixtureId,user:scope.userId,tenantId:scope.tenantId,conversationId:scope.conversationId,
      nostromoE5Fixture:true,title:'NOSTROMO E5 disposable fixture',expiredAt:null});inserted=true;
    const service=new NativeObjectiveAgreement(mongoConversationAgreementStore(collection));
    const proposal={schema:'nostromo.objective.handoff.v1',objective_ref:'fixture',conversation_ref:scope.conversationId,agreement_ref:'untrusted',
      plan_hash:'a'.repeat(64),plan_version:1,execution_lane:'NOSTROMO_LOCAL',target_id:'NOSTROMO_LOCAL',objective:'Read state, metrics and directory',
      expected_result:'R0 results returned',acceptance_criteria:[{criterion_id:'state',predicate_ref:'state-read'}],
      capability_refs:['nostromo_estado','nostromo_metricas','nostromo_tarea_iniciar'],context_refs:[],constraints:{no_paid_fallback:true,max_execution_seconds:30},
      risk:'R0',idempotency_key:'b'.repeat(64),readback_required:true,status:'AGREED',authority:false};
    const preview=await service.preview(scope,proposal,0);assert.equal(preview.ok,true);
    const agreement=await service.confirm(scope,1,preview.preview.plan_hash,preview.revision);assert.equal(agreement.ok,true);
    client=await connect();const announced=await client.listTools();
    const host={verifyAgreement:(handoff)=>service.verify(scope,handoff),
      readCapabilities:async()=>({observedAtMs:Date.now(),entries:announced.tools.map((tool)=>({capabilityRef:tool.name,toolId:tool.name,
        targetId:'NOSTROMO_LOCAL',risk:'R0',availability:'LIVE',registryBacked:true,aclAllowed:true,adapterLive:true,sourceRevision:'isolated-test-handshake'}))}),
      checkOwnerAuthority:async()=>true}; // synthetic fixture authority, not a real grant
    assert.equal((await resolveNativeAgreedObjective(agreement.handoff,host)).ok,true);
    assert.equal(payload(await client.callTool({name:'nostromo_estado',arguments:{}})).mcpLive,true);
    assert.equal(payload(await client.callTool({name:'nostromo_metricas',arguments:{cwd:root}})).status,'READ_OK');
    const args={cwd:root,argv:['pwd'],timeout_s:5,max_output:1024,idempotency_key:agreement.handoff.idempotency_key};
    const started=payload(await client.callTool({name:'nostromo_tarea_iniciar',arguments:args}));assert.equal(started.started,true);
    let final;
    for(let i=0;i<100;i++){
      final=payload(await client.callTool({name:'nostromo_tarea_estado',arguments:{jobId:started.jobId}}));
      if(final.finishedAt)break;
      await new Promise((resolve)=>setTimeout(resolve,20));
    }
    assert.equal(final.status,'EXIT_0');assert.equal(final.materialVerified,false);
    await client.close();client=await connect();
    const retry=payload(await client.callTool({name:'nostromo_tarea_iniciar',arguments:args}));
    assert.equal(retry.jobId,started.jobId);assert.equal(retry.started,false);assert.equal(retry.deduplicated,true);
  }finally{
    if(client)await client.close();
    if(inserted){const removed=await db.db('LibreChat').collection('conversations').deleteOne({_id:fixtureId,user:scope.userId,conversationId:scope.conversationId,nostromoE5Fixture:true});assert.equal(removed.deletedCount,1);}
    await db.close();await rm(root,{recursive:true,force:true});
  }
});
