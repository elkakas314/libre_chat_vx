import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../stage-isolated-npm11.mjs',import.meta.url));
test('npm 11 isolated tool stager rejects unknown flags before mutation',()=>{
 const res=spawnSync(process.execPath,[script,'--danger'],{encoding:'utf8',timeout:10000});
 assert.equal(res.status,2,res.stderr);
 const report=JSON.parse(res.stdout);
 assert.equal(report.status,'UNKNOWN_FLAG_REFUSED');
 assert.equal(report.mode,'PREVIEW');
 assert.equal(report.systemNpmUnchanged,true);
 assert.equal(report.upstreamUnchanged,true);
});
test('npm 11 isolated tool stager documents opt-in but does not install on help',()=>{
 const res=spawnSync(process.execPath,[script,'--help'],{encoding:'utf8',timeout:10000});
 assert.equal(res.status,0);
 assert.match(res.stdout,/--apply/);
 assert.equal(res.stderr,'');
});
