import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire,Module} from 'node:module';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {patchObjectivePrivateField} from './objective-private-field.mjs';

const root=process.env.NOSTROMO_E5_TEST_UPSTREAM;
async function candidate(){
 const paths={schema:'packages/data-schemas/src/schema/convo.ts',methods:'packages/data-schemas/src/methods/conversation.ts',compiled:'packages/data-schemas/dist/index.cjs',esm:'packages/data-schemas/dist/index.mjs'};
 const original=Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([k,p])=>[k,await readFile(path.join(root,p),'utf8')])));
 return {original,patched:patchObjectivePrivateField(original),paths};
}

test('unknown upstream preimage is rejected',()=>assert.throws(()=>patchObjectivePrivateField({schema:'x',methods:'x',compiled:'x'}),/PREIMAGE_MISMATCH/));

test('pinned patch guards source and compiled write paths and rejects drift', {skip:!root},async()=>{
 const {original,patched}=await candidate();
 assert.match(patched.schema,/nostromoObjectiveAgreement.*select: false/);
 assert.match(patched.methods,/'nostromoObjectiveAgreement'/);
 assert.match(patched.compiled,/nostromoObjectiveAgreement.*select: false/);
 assert.match(patched.esm,/nostromoObjectiveAgreement.*select: false/);
 assert.throws(()=>patchObjectivePrivateField({...original,compiled:original.compiled+'\n'}),/PREIMAGE_MISMATCH/);
});

test('real Mongo conversation reads hide the field and native save/import paths cannot forge or unset it', {skip:!root,timeout:20000},async()=>{
 const {patched,paths}=await candidate();
 const require=createRequire(path.join(root,'api','package.json'));
 const mongoose=require('mongoose');
 const filename=path.join(root,paths.compiled), loaded=new Module(filename);
 loaded.filename=filename;loaded.paths=Module._nodeModulePaths(path.dirname(filename));loaded._compile(patched.compiled,filename);
 const conversationId=randomUUID(),user='nostromo-private-fixture-'+randomUUID();let inserted=false;
 try{
  mongoose.set('autoIndex',false);await mongoose.connect('mongodb://127.0.0.1:27017/LibreChat');
  loaded.exports.createModels(mongoose);const methods=loaded.exports.createMethods(mongoose);
  const collection=mongoose.connection.db.collection('conversations');
  await collection.insertOne({conversationId,user,title:'NOSTROMO private-field fixture',nostromoObjectiveAgreement:{revision:7}});inserted=true;
  const read=await methods.getConvo(user,conversationId);
  assert.ok(read);assert.equal(Object.hasOwn(read,'nostromoObjectiveAgreement'),false);
  const privileged=await mongoose.models.Conversation.findOne({user,conversationId}).select('+nostromoObjectiveAgreement').lean();
  assert.equal(privileged.nostromoObjectiveAgreement.revision,7);
  await methods.saveConvo({userId:user},{conversationId,title:'edited',nostromoObjectiveAgreement:{revision:99},'nostromoObjectiveAgreement.revision':99},
    {appendMessageIds:[],unsetFields:{nostromoObjectiveAgreement:1,'nostromoObjectiveAgreement.revision':1}});
  let raw=await collection.findOne({user,conversationId},{projection:{nostromoObjectiveAgreement:1}});
  assert.equal(raw.nostromoObjectiveAgreement.revision,7);
  await methods.bulkSaveConvos([{conversationId,user,title:'imported',nostromoObjectiveAgreement:{revision:88},'nostromoObjectiveAgreement.revision':88}]);
  raw=await collection.findOne({user,conversationId},{projection:{nostromoObjectiveAgreement:1}});
  assert.equal(raw.nostromoObjectiveAgreement.revision,7);
 }finally{
  if(inserted){const removed=await mongoose.connection.db.collection('conversations').deleteOne({conversationId,user});assert.equal(removed.deletedCount,1);}
  await mongoose.disconnect();
 }
});
