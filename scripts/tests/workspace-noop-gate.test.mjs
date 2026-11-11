import test from 'node:test';
import assert from 'node:assert/strict';
import {isWorkspaceNoop} from '../workspace-noop-gate.mjs';

const valid={schema:'nostromo.existing-workspace.v1',ui:'MATCHED',
 sourceFiles:192,existingFiles:192,changedSources:0};
test('identical workspace is no-op and must not create additional backup',()=>{
 assert.equal(isWorkspaceNoop(valid,{compiledEntryVerified:true}),true);
 assert.equal(isWorkspaceNoop(valid),false);
});
test('changed source, missing files or mismatched UI never bypass reconcile',()=>{
 for(const different of [
  {...valid,sourceFiles:193},
  {...valid,changedSources:1},
  {...valid,ui:'OUT_OF_SYNC'},
  {...valid,schema:'unknown'},
  {...valid,changedSources:-1},
  null,{}
 ])assert.equal(isWorkspaceNoop(different,{compiledEntryVerified:true}),false);
});
