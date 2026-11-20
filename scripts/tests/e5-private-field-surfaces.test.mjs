import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import path from 'node:path';

const upstream=process.env.NOSTROMO_E5_TEST_UPSTREAM;
test('installed native conversation listing and share snapshots omit private agreement state', {skip:!upstream,timeout:20000},async()=>{
 const require=createRequire(path.join(upstream,'api/package.json'));
 const mongoose=require('mongoose'),{createModels,createMethods}=require('@librechat/data-schemas');
 const {ObjectId}=mongoose.Types,user='nostromo-surface-fixture-'+randomUUID(),conversationId=randomUUID(),messageId=randomUUID();
 const conversationIdDb=new ObjectId(),messageIdDb=new ObjectId(),marker='PRIVATE_AGREEMENT_FIXTURE_'+randomUUID();
 let conversationInserted=false,messageInserted=false,shareId;
 try{
  mongoose.set('autoIndex',false);await mongoose.connect('mongodb://127.0.0.1:27017/LibreChat');createModels(mongoose);
  const db=mongoose.connection.db,now=new Date();
  await db.collection('conversations').insertOne({_id:conversationIdDb,user,conversationId,title:'Disposable E5 fixture',
    isArchived:false,isTemporary:false,pinned:false,createdAt:now,updatedAt:now,expiredAt:null,nostromoObjectiveAgreement:{marker}});conversationInserted=true;
  await db.collection('messages').insertOne({_id:messageIdDb,user,conversationId,messageId,text:'Fixture text',sender:'User',
    isCreatedByUser:true,createdAt:now,updatedAt:now});messageInserted=true;
  const methods=createMethods(mongoose);
  const one=await methods.getConvo(user,conversationId);
  assert.ok(one);assert.equal(JSON.stringify(one).includes(marker),false);
  const page=await methods.getConvosByCursor(user,{limit:10});
  assert.ok(JSON.stringify(page).includes(conversationId));assert.equal(JSON.stringify(page).includes(marker),false);
  const search=await methods.getConvosQueried(user,[{conversationId}],null,10);
  assert.ok(JSON.stringify(search).includes(conversationId));assert.equal(JSON.stringify(search).includes(marker),false);
  const share=await methods.createSharedLink(user,conversationId,undefined,undefined,false);shareId=share.shareId;
  const storedShare=await db.collection('sharedlinks').findOne({shareId,user});
  assert.ok(storedShare);assert.equal(JSON.stringify(storedShare).includes(marker),false);
  const link=await methods.getSharedLink(user,conversationId);
  assert.ok(link);assert.equal(JSON.stringify(link).includes(marker),false);
  const exposed=await methods.getSharedMessages(shareId);
  assert.ok(exposed);assert.equal(JSON.stringify(exposed).includes(marker),false);
 }finally{
  const db=mongoose.connection.db;
  if(shareId){const r=await db.collection('sharedlinks').deleteOne({shareId,user,conversationId});assert.equal(r.deletedCount,1);}
  if(messageInserted){const r=await db.collection('messages').deleteOne({_id:messageIdDb,user,conversationId});assert.equal(r.deletedCount,1);}
  if(conversationInserted){const r=await db.collection('conversations').deleteOne({_id:conversationIdDb,user,conversationId});assert.equal(r.deletedCount,1);}
  await mongoose.disconnect();
 }
});
