import test from 'node:test';
import assert from 'node:assert/strict';
import {assessNpmDryRun} from '../librechat-npm-dry-run-guard.mjs';

test('npm dry-run admits additions only; never treats plan as an install PASS',()=>{
 const x=assessNpmDryRun(JSON.stringify({added:123,removed:0,changed:0}));
 assert.deepEqual(x,{status:'DRY_RUN_ADDITIONS_ONLY',allow:true,added:123,removed:0,changed:0});
});
test('npm dry-run rejects removal or replacement of existing dependencies',()=>{
 for(const fixture of [
  {added:3,removed:1,changed:0},
  {added:4,removed:0,changed:1},
  {added:0,removed:3,changed:2}
 ]){
  const x=assessNpmDryRun(JSON.stringify(fixture));
  assert.equal(x.allow,false);
  assert.equal(x.status,'DRY_RUN_EXISTING_PACKAGES_AT_RISK');
 }
});
test('unknown dry-run payload or truncated output fails closed before mutating node_modules',()=>{
 for(const payload of ['','not-json','[]','{}',JSON.stringify({added:'1',removed:0,changed:0}),
    JSON.stringify({added:1,removed:-1,changed:0}),JSON.stringify({added:1,removed:0})]){
  assert.equal(assessNpmDryRun(payload).allow,false);
 }
});
