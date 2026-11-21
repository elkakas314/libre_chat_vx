import test from 'node:test';
import assert from 'node:assert/strict';
import {renderNativeObjectiveAgreementRoute,MOUNT_MARKER} from '../../deployment/librechat-agents/stage-native-objective-agreement.mjs';
test('mount generator adds exactly one native authenticated route after existing convos route',()=>{
 const input="  app.use('/api/convos', routes.convos);\n  app.use('/api/traces', routes.traces);";
 const out=renderNativeObjectiveAgreementRoute(input);
 assert.equal(out.status,'PATCH_AVAILABLE');
 assert.equal(out.content.includes(MOUNT_MARKER),true);
 assert.equal(out.content.includes("require('./middleware')"),true);
 assert.equal(out.content.includes("mongoose.connection.db?.collection('conversations')"),true);
 assert.equal(out.content.includes('serviceFor: objectiveServiceFor'),true);
 assert.equal(renderNativeObjectiveAgreementRoute(out.content).status,'ALREADY_INSTALLED');
});
test('fails closed on anchor drift, competing route or modified marker',()=>{
 assert.throws(()=>renderNativeObjectiveAgreementRoute('not the upstream'),/ANCHOR/);
 assert.throws(()=>renderNativeObjectiveAgreementRoute("  app.use('/api/convos', routes.convos);\n  app.use('/api/convos', routes.convos);"),/ANCHOR/);
 assert.throws(()=>renderNativeObjectiveAgreementRoute("  app.use('/api/convos', routes.convos);\n"+MOUNT_MARKER),/MARKER/);
 assert.throws(()=>renderNativeObjectiveAgreementRoute("  app.use('/api/convos', routes.convos);\napp.use('/api/nostromo/objectives'"),/ALREADY_PRESENT/);
});
