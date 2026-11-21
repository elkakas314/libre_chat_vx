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

test('npm v11 prefixed action-lines are accepted only with exact JSON add objects',()=>{
 const npm = {add:[{name:'debug',version:'4.4.3',path:'/sample/node_modules/debug'}],
   added:1,audited:0,change:[],changed:0,remove:[],removed:0};
 const result=assessNpmDryRun('add debug 4.4.3\n'+JSON.stringify(npm,null,2));
 assert.deepEqual(result,{status:'DRY_RUN_ADDITIONS_ONLY',allow:true,
   added:1,removed:0,changed:0,prefixedActionLinesVerified:1});
});
test('npm v11 prefixed add lines cannot hide changes, removals, missing metadata or mismatches',()=>{
 const v={add:[{name:'debug',version:'4.4.3'}],added:1,
   change:[],changed:0,remove:[],removed:0};
 const fixture=x=>'add debug 4.4.3\n'+JSON.stringify(x);
 const rejects=[
   fixture({...v,removed:1,remove:[{name:'any'}]}),
   fixture({...v,changed:1,change:[{name:'debug'}]}),
   fixture({...v,added:2}),
   fixture({...v,add:undefined}),
   fixture({...v,remove:[{name:'tampering'}]}),
   fixture({...v,add:[{name:'debug',version:'1.0.0'}]}),
   'add altered 4.4.3\n'+JSON.stringify(v),
   'change debug 4.4.3\n'+JSON.stringify(v),
   'npm WARN unsafe\n'+JSON.stringify(v),
   'add debug 4.4.3\n{broken-json'
 ];
 for(const x of rejects)assert.equal(assessNpmDryRun(x).allow,false,x.slice(0,120));
});
test('multiple prefixed add lines require multiplicity and matching versions',()=>{
 const changes={add:[{name:'foo',version:'1.2.3'},{name:'foo',version:'1.2.3'},
   {name:'@scope/pkg',version:'2.0.0'}],added:3,
   remove:[],removed:0,change:[],changed:0};
 const ok='add foo 1.2.3\nadd @scope/pkg 2.0.0\nadd foo 1.2.3\n'+JSON.stringify(changes);
 assert.equal(assessNpmDryRun(ok).allow,true);
 assert.equal(assessNpmDryRun(ok.replace('add foo 1.2.3\n','')).allow,false);
});
