import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdtempSync,rmSync,readFileSync,statSync} from 'node:fs';
import {tmpdir,homedir} from 'node:os';
import path from 'node:path';
import {createNpmConfigIsolation,ISOLATED_NPM_CONFIG_FILE} from '../npm-config-isolation.mjs';

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

test('private user/global npm configs are distinct and npm --version runs without double-loading',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'nostromo-npm-config-fixture-'));
 try{
   const overrides=createNpmConfigIsolation(dir);
   assert.equal(overrides.npm_config_userconfig,'/dev/null');
   assert.equal(overrides.npm_config_globalconfig,path.join(dir,ISOLATED_NPM_CONFIG_FILE));
   assert.notEqual(overrides.npm_config_userconfig,overrides.npm_config_globalconfig);
   assert.equal(readFileSync(overrides.npm_config_globalconfig,'utf8'),'');
   assert.equal(statSync(overrides.npm_config_globalconfig).mode&0o077,0);
   assert.throws(()=>createNpmConfigIsolation(dir),{code:'EEXIST'});
   const npm=spawnSync('npm',['--version'],{
     encoding:'utf8',timeout:15000,
     env:{HOME:homedir(),PATH:process.env.PATH||'/usr/bin:/bin',
       ...overrides},stdio:['ignore','pipe','pipe']
   });
   assert.equal(npm.status,0,npm.stderr||String(npm.error));
   assert.match(npm.stdout.trim(),/^\d+\.\d+\.\d+$/);
   assert.doesNotMatch(npm.stderr,/double-loading config/i);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
