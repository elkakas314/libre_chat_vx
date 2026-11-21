import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';

const upstream=process.env.NOSTROMO_E5_TEST_UPSTREAM;
const sourceRequire=createRequire(import.meta.url);
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');

test('E5 Mongo real: atomic dispatch claim survives reconnect, rejects conflicts and requires verified receipt',
 {skip:!upstream,timeout:22000},async()=>{
  const hostRequire=createRequire(path.join(upstream,'api','package.json'));
  const {MongoClient,ObjectId}=hostRequire('mongodb');
  const {NativeObjectiveAgreement,mongoConversationAgreementStore}=
    sourceRequire('../../dist/src/librechat/nativeObjectiveAgreement.js');
  const {NativeObjectiveReceiptStore}=
    sourceRequire('../../dist/src/librechat/nativeObjectiveReceipts.js');
  const {NativeObjectiveDispatchLedger}=
    sourceRequire('../../dist/src/librechat/nativeObjectiveDispatchLedger.js');
  const client=new MongoClient('mongodb://127.0.0.1:27017',{serverSelectionTimeoutMS:3000});
  const id=new ObjectId(),tag=randomUUID();
  const scope={userId:'nostromo-dispatch-fixture-'+tag,tenantId:'fixture-'+tag,conversationId:randomUUID()};
  let inserted=false;
  try {
    await client.connect();const coll=client.db('LibreChat').collection('conversations');
    await coll.insertOne({_id:id,user:scope.userId,tenantId:scope.tenantId,conversationId:scope.conversationId,
      nostromoE5Fixture:true,title:'NOSTROMO E5 disposable dispatch ledger fixture',expiredAt:null});inserted=true;
    const agreements=new NativeObjectiveAgreement(mongoConversationAgreementStore(coll));
    const proposal={schema:'nostromo.objective.handoff.v1',objective_ref:'fixture',conversation_ref:scope.conversationId,
      agreement_ref:'untrusted',plan_hash:'a'.repeat(64),plan_version:1,
      execution_lane:'NOSTROMO_LOCAL',target_id:'NOSTROMO_LOCAL',
      objective:'Consultar el estado del MCP NOSTROMO',expected_result:'Comprobar si el MCP NOSTROMO responde',
      acceptance_criteria:[{criterion_id:'state',predicate_ref:'nostromo.mcp.live'}],
      capability_refs:['nostromo_estado'],context_refs:[],constraints:{no_paid_fallback:true,max_execution_seconds:30},
      risk:'R0',idempotency_key:'b'.repeat(64),readback_required:true,status:'AGREED',authority:false};
    const p=await agreements.preview(scope,proposal,0);assert.equal(p.ok,true);
    const a=await agreements.confirm(scope,1,p.preview.plan_hash,p.revision);assert.equal(a.ok,true);
    const handoff=a.handoff,key=handoff.idempotency_key;
    const receipts=new NativeObjectiveReceiptStore(coll,agreements);
    const make=(who=scope)=>new NativeObjectiveDispatchLedger(coll,agreements,receipts,who,handoff);
    const journal=make(),reconnected=make(),other=make({...scope,userId:'other'});
    const stamp=Date.now(),argsHash='1'.repeat(64);
    const fingerprint=createHash('sha256').update(JSON.stringify(Object.fromEntries(
      Object.entries({objective_ref:handoff.objective_ref,agreement_ref:handoff.agreement_ref,
      plan_hash:handoff.plan_hash,plan_version:handoff.plan_version,target_id:handoff.target_id,
      tool_id:'nostromo_estado',principal:scope.userId,tenant:scope.tenantId,args_hash:argsHash})
        .sort(([a],[b])=>a.localeCompare(b))))).digest('hex');
    assert.equal(await journal.get(key),null);
    const claims=await Promise.all([journal.begin(key,fingerprint,stamp),reconnected.begin(key,fingerprint,stamp)]);
    assert.deepEqual(claims.slice().sort(),[false,true]);
    assert.equal((await journal.get(key)).state,'DISPATCHED');
    assert.equal((await reconnected.get(key)).fingerprint,fingerprint);
    assert.equal((await other.get(key)).state,'UNKNOWN_OUTCOME');
    assert.equal(await reconnected.begin(key,'c'.repeat(64),stamp+1),false);
    await assert.rejects(()=>journal.complete(key,'VERIFIED',stamp+2),/VERIFIED_RECEIPT_REQUIRED/);
    await reconnected.markUnknown(key,stamp+3);
    assert.equal((await journal.get(key)).state,'UNKNOWN_OUTCOME');
    const receipt={schema:'nostromo.execution.receipt.v1',objective_ref:handoff.objective_ref,
      conversation_ref:handoff.conversation_ref,agreement_ref:handoff.agreement_ref,
      plan_hash:handoff.plan_hash,plan_version:handoff.plan_version,
      target_id:handoff.target_id,capability_ref:'nostromo_estado',tool_id:'nostromo_estado',
      risk:'R0',principal_ref:scope.userId,tenant_ref:scope.tenantId,idempotency_key:key,
      args_hash:'1'.repeat(64),observation_hash:'2'.repeat(64),
      acceptance:[{criterion_id:'state',predicate_ref:'nostromo.mcp.live',result:'PASS'}],
      outcome:'VERIFIED',started_at_ms:stamp,finished_at_ms:stamp+4};
    const invalid=await receipts.write(scope,{...receipt,args_hash:'f'.repeat(64)});
    assert.ok(invalid?.receiptRef);
    await assert.rejects(()=>journal.complete(key,'VERIFIED',stamp+4,invalid.receiptRef),/RECEIPT_FINGERPRINT_OR_ACCEPTANCE_MISMATCH/);
    const saved=await receipts.write(scope,receipt);assert.ok(saved?.receiptRef);
    await journal.complete(key,'VERIFIED',stamp+5,saved.receiptRef);
    assert.equal((await reconnected.get(key)).state,'VERIFIED');
    assert.equal((await reconnected.get(key)).receiptRef,saved.receiptRef);
    assert.equal(await reconnected.begin(key,fingerprint,stamp+6),false);
    await assert.rejects(()=>other.complete(key,'VERIFIED',stamp+7,saved.receiptRef));
    // Expiring this agreement cannot erase the old claim or permit its replay.
    const newer=await agreements.preview(scope,{...proposal,objective:'Changed'},a.revision);
    assert.equal(newer.ok,true);
    assert.equal(await journal.begin(key,fingerprint,stamp+8),false);
    assert.equal((await journal.get(key)).state,'UNKNOWN_OUTCOME');
    const persisted=await coll.findOne({_id:id},{projection:{'nostromoObjectiveAgreement.dispatchClaims':1}});
    assert.equal(persisted.nostromoObjectiveAgreement.dispatchClaims.length,1);
    console.log('E5_DISPATCH_CLAIM_MONGO_PASS',JSON.stringify({created:claims.filter(Boolean).length,
      restored:true,verifiedReceipt:true,isolatedOwner:true,nonReplay:true}));
  } finally {
    if(inserted) {
      const removed=await client.db('LibreChat').collection('conversations').deleteOne({
        _id:id,user:scope.userId,conversationId:scope.conversationId,nostromoE5Fixture:true});
      assert.equal(removed.deletedCount,1,'fixture cleanup failed');
    }
    await client.close();
  }
});
