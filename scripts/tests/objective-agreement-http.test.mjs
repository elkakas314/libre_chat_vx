import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import path from 'node:path';

const upstream=process.env.NOSTROMO_E5_TEST_UPSTREAM;
test('objective HTTP adapter checks owner, origin and revision on real Mongo fixture', {skip:!upstream,timeout:20000},async()=>{
 const require=createRequire(import.meta.url),hostRequire=createRequire(path.join(upstream,'api/package.json'));
 const express=hostRequire('express'),{MongoClient,ObjectId}=hostRequire('mongodb');
 const {createObjectiveAgreementRouter}=require('../../deployment/librechat-agents/objective-agreement-api.cjs');
 const {NativeObjectiveAgreement,mongoConversationAgreementStore}=require('../../dist/src/librechat/nativeObjectiveAgreement.js');
 const {NativeObjectiveReceiptStore}=require('../../dist/src/librechat/nativeObjectiveReceipts.js');
 const {executeNativeStatus}=require('../../dist/src/librechat/nativeStatusExecution.js');
 const db=new MongoClient('mongodb://127.0.0.1:27017',{serverSelectionTimeoutMS:3000});
 const suffix=randomUUID(),fixtureId=new ObjectId(),user='fixture-'+suffix,tenant='tenant-'+suffix,conversationId=randomUUID();
 let inserted=false,server;
 try{
  await db.connect();const col=db.db('LibreChat').collection('conversations');
  await col.insertOne({_id:fixtureId,user,tenantId:tenant,conversationId,nostromoE5Fixture:true,expiredAt:null});inserted=true;
  const service=new NativeObjectiveAgreement(mongoConversationAgreementStore(col));
  const receipts=new NativeObjectiveReceiptStore(col,service);let calls=0;
  const port={available:async()=>true,call:async()=>{calls++;return {status:'OK',structuredContent:{kind:'nostromo.autonomous.local-mcp.v1',mcpLive:true}};}};
  // Test-only authentication: production must supply native requireJwtAuth.
  const auth=(req,res,next)=>{if(!req.get('x-test-user'))return res.status(401).end();req.user={_id:{toString:()=>req.get('x-test-user')},tenantId:tenant};next();};
  const app=express();app.use(express.json());app.use('/api/nostromo/objectives',createObjectiveAgreementRouter({express,requireJwtAuth:auth,serviceFor:()=>service,
    executeStatusFor:(_req,scope,planVersion,planHash)=>executeNativeStatus({scope,planVersion,planHash,agreements:service,receipts,port}),
    readStatusFor:(_req,scope,version,hash)=>receipts.latest(scope,version,hash)}));
  server=await new Promise((resolve)=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  const origin=`http://127.0.0.1:${server.address().port}`,url=`${origin}/api/nostromo/objectives/${conversationId}`;
  const get=(identity=user)=>fetch(url,{headers:{'x-test-user':identity}});
  const post=(suffix,body,originHeader=origin)=>fetch(url+'/'+suffix,{method:'POST',headers:{'content-type':'application/json',origin:originHeader,'x-test-user':user},body:JSON.stringify(body)});
  assert.equal((await fetch(url)).status,401);assert.equal((await get('other')).status,404);
  const initial=await (await get()).json();assert.equal(initial.phase,'NONE');assert.equal(initial.revision,0);
  const proposal={schema:'nostromo.objective.handoff.v1',objective_ref:'fixture',conversation_ref:conversationId,agreement_ref:'untrusted',
    plan_hash:'a'.repeat(64),plan_version:1,execution_lane:'NOSTROMO_LOCAL',target_id:'NOSTROMO_LOCAL',objective:'Consultar el estado del MCP NOSTROMO',expected_result:'Comprobar si el MCP NOSTROMO responde',
    acceptance_criteria:[{criterion_id:'state',predicate_ref:'nostromo.mcp.live'}],capability_refs:['nostromo_estado'],context_refs:[],
    constraints:{no_paid_fallback:true,max_execution_seconds:30},risk:'R0',idempotency_key:'b'.repeat(64),readback_required:true,status:'AGREED',authority:false};
  assert.equal((await post('preview',{proposal,revision:0},'https://unrelated.example')).status,403);
  assert.equal((await post('preview',{proposal,revision:0,user:'forged'})).status,400);
  const preview=await (await post('preview',{proposal,revision:0})).json();assert.equal(preview.phase,'PREVIEWED');
  assert.equal('agreement_ref' in preview.preview,false);assert.equal('idempotency_key' in preview.preview,false);
  assert.equal((await post('confirm',{plan_version:1,plan_hash:'f'.repeat(64),revision:preview.revision})).status,409);
  const confirmed=await (await post('confirm',{plan_version:1,plan_hash:preview.preview.plan_hash,revision:preview.revision})).json();
  assert.equal(confirmed.phase,'AGREED');assert.equal(confirmed.authority,false);
  const executionBody={plan_version:1,plan_hash:preview.preview.plan_hash};
  assert.equal((await post('execute-status',executionBody,'https://unrelated.example')).status,403);
  assert.equal(calls,0);
  const executed=await (await post('execute-status',executionBody)).json();
  assert.equal(executed.status,'VERIFIED');assert.equal(executed.mcpLive,true);assert.equal(calls,2);
  assert.equal('receipt' in executed,false);assert.match(executed.receiptRef,/^nostromo-receipt:/);
  assert.ok(await receipts.read({userId:user,tenantId:tenant,conversationId},executed.receiptRef));
  const reopened=await (await fetch(url+'/execution?plan_version=1&plan_hash='+preview.preview.plan_hash,{headers:{'x-test-user':user}})).json();
  assert.equal(reopened.status,'VERIFIED');assert.equal(reopened.receiptRef,executed.receiptRef);
  assert.equal('receipt' in reopened,false);
  assert.equal('agreement_ref' in confirmed.plan,false);assert.equal('idempotency_key' in confirmed.plan,false);
  const recovered=await (await get()).json();assert.equal(recovered.phase,'AGREED');assert.equal(recovered.plan.plan_hash,preview.preview.plan_hash);
  assert.equal((await post('preview',{proposal,revision:0})).status,409);
 }finally{
  if(server)await new Promise((resolve,reject)=>server.close((error)=>error?reject(error):resolve()));
  if(inserted){const removed=await db.db('LibreChat').collection('conversations').deleteOne({_id:fixtureId,user,conversationId,nostromoE5Fixture:true});assert.equal(removed.deletedCount,1);}
  await db.close();
 }
});
