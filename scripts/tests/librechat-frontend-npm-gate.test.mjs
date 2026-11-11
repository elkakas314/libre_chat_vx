import test from 'node:test';
import assert from 'node:assert/strict';
import {assessNpmEnvironment} from '../librechat-frontend-npm-gate.mjs';

const expected='npm@11.13.0';
test('matches major 11 and lock v3 for official LibreChat contract',()=>{
 const result=assessNpmEnvironment({
  declaredPackageManager:expected,actualNpmVersion:'11.13.0',lockfileVersion:3
 });
 assert.equal(result.applyAdmissible,true);
 assert.equal(result.status,'NPM_ENVIRONMENT_ADMISSIBLE');
});
test('Lenovo observed npm10.9.8 is a config gap before any install',()=>{
 const result=assessNpmEnvironment({
  declaredPackageManager:expected,actualNpmVersion:'10.9.8',lockfileVersion:3
 });
 assert.equal(result.applyAdmissible,false);
 assert.deepEqual(result.blockers,['NPM_MAJOR_MISMATCH']);
 assert.equal(result.status,'NPM_ENVIRONMENT_BLOCKED');
});
test('rejects untrusted manager, malformed npm versions and wrong lock format',()=>{
 for(const input of [
  {declaredPackageManager:'npm@unknown',actualNpmVersion:'11.13.0',lockfileVersion:3},
  {declaredPackageManager:expected,actualNpmVersion:'NaN',lockfileVersion:3},
  {declaredPackageManager:expected,actualNpmVersion:'11.13.0',lockfileVersion:2},
  {declaredPackageManager:expected,actualNpmVersion:'11.13.0'}
 ])assert.equal(assessNpmEnvironment(input).applyAdmissible,false);
});
