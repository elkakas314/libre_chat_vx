import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readdirSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const SCRIPT=resolve('ci/nostromo-stage-clean-overlay-ci-only.mjs');
test('CI mount guards both upstream chat anchors and binds content-free activity',()=>{
  const source=readFileSync(SCRIPT,'utf8');
  assert.match(source,/EXPECTED_CHATVIEW_BLOB='ef6949da36ab2ebbebaa3dd9faaca63a6297ef99'/);
  assert.match(source,/uniqueOccurrence\(chatView,CHATVIEW_ANCHOR,'CHATVIEW_PRESENTATION'\)/);
  assert.match(source,/activity=\{\{/);
  assert.match(source,/messages,/);
  const projection=readFileSync(resolve('src/cockpit/conversationActivity.ts'),'utf8');
  assert.match(projection,/hasStoredOutput/);
  assert.match(projection,/toolCalls\.slice\(-6\)/);
  assert.doesNotMatch(projection,/functionCall\.arguments/);
});
function run(cwd,env,argv=['--stage']) {
  return spawnSync(process.execPath,[SCRIPT,...argv],{
    cwd,env:{...process.env,...env},encoding:'utf8',timeout:15000
  });
}
test('ci-only native mount cannot run in host or unknown mode',()=>{
  const root=mkdtempSync(join(tmpdir(),'nostromo-ci-stage-gate-'));
  try{
    const host=run(root,{GITHUB_ACTIONS:'',NOSTROMO_CI_EPHEMERAL_STAGE:''});
    assert.equal(host.status,2);
    assert.match(host.stderr,/ONLY_IN_EXPLICIT_GITHUB_ACTIONS_RUNNER/);
    const unknown=run(root,{GITHUB_ACTIONS:'true',NOSTROMO_CI_EPHEMERAL_STAGE:'1'},['--apply']);
    assert.equal(unknown.status,2);
    assert.match(unknown.stderr,/UNKNOWN_OR_MISSING_MODE/);
    assert.equal(readdirSync(root).length,0);
  }finally{rmSync(root,{recursive:true,force:true});}
});
test('CI flag still refuses incorrect canonical checkout paths before writing',()=>{
  const root=mkdtempSync(join(tmpdir(),'nostromo-ci-stage-scope-'));
  try{
    mkdirSync(join(root,'vx'));
    mkdirSync(join(root,'upstream'));
    mkdirSync(join(root,'temp'));
    const denied=run(root,{
      GITHUB_ACTIONS:'true',
      NOSTROMO_CI_EPHEMERAL_STAGE:'1',
      GITHUB_WORKSPACE:root,
      RUNNER_TEMP:join(root,'temp'),
    });
    assert.equal(denied.status,2);
    assert.match(denied.stderr,/WRONG_VX_CWD/);
    assert.equal(readdirSync(join(root,'vx')).length,0);
    assert.equal(readdirSync(join(root,'upstream')).length,0);
  }finally{rmSync(root,{recursive:true,force:true});}
});
