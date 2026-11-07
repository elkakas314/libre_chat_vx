import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTriadSync, verifyTriadWrite, type TriadObservation } from '../src/operating/triadSync';
const head='a'.repeat(40), pin='f10b1d91f1eee3a2c82d5247bf620351486b7c1b';
function fixture(overrides:Partial<TriadObservation>={}):TriadObservation {
  return {
    project:'LIBRECHAT_VX',
    github:{repo:'elkakas314/libre_chat_vx',branch:'feat/triad-sync-gates-20261107',
      observedHead:head,expectedHead:head,patRepo:'elkakas314/libre_chat_vx',
      patVerified:true,patCanPush:true,ciHead:head,ciState:'SUCCESS'},
    local:{root:'/home/elkakas314/librechat/vx',head:'b'.repeat(40),
      workingTree:'CLEAN',untracked:'NONE',backupRef:'backup:ready',
      overlayPin:pin},
    drive:[{id:'11e70lpwe5U3k9FMZWd7h-N0eNaidgaINJP9Pwz1bGx8',
      expectedRevision:'r1',observedRevision:'r1',writable:true,sourceHead:head}],
    ...overrides,
  };
}
test('all independently grounded scopes are eligible, still without authority',()=>{
  const p=evaluateTriadSync(fixture());
  assert.equal(p.github.gate,'READY');
  assert.equal(p.drive.gate,'READY');
  assert.equal(p.local.gate,'READY');
  assert.equal(p.authority,false);
  assert.equal(p.nextAction,'ALLOW_GOVERNED_SYNC_PROPOSAL');
});
test('uninspected local worktree is a gate, but remote and Drive continue',()=>{
  const a=fixture(),p=evaluateTriadSync(fixture({
    local:{...a.local,workingTree:'UNKNOWN',untracked:'UNKNOWN',backupRef:undefined},
  }));
  assert.equal(p.github.gate,'READY');
  assert.equal(p.drive.gate,'READY');
  assert.equal(p.local.gate,'GATE_LOCAL');
  assert.ok(p.local.reasons.includes('LOCAL_UNCOMMITTED_OR_UNOBSERVED'));
  assert.equal(p.nextAction,'UPDATE_DRIVE_WITH_REQUIRED_REVISION_AND_READBACK');
});
test('mismatched Git head or PAT scope prevents publication and Drive promotion',()=>{
  const a=fixture();
  const stale=evaluateTriadSync(fixture({github:{...a.github,observedHead:'c'.repeat(40)}}));
  assert.equal(stale.github.gate,'GATE_GITHUB');
  assert.equal(stale.drive.gate,'GATE_DRIVE');
  assert.equal(stale.local.gate,'GATE_LOCAL');
  const revoked=evaluateTriadSync(fixture({github:{...a.github,patCanPush:false}}));
  assert.equal(revoked.github.gate,'GATE_GITHUB');
  assert.ok(revoked.github.reasons.includes('FINE_GRAINED_PAT_SCOPE_MISSING'));
});
test('Drive revision conflict is isolated from independently clean local scope',()=>{
  const a=fixture();
  const p=evaluateTriadSync(fixture({
    drive:[{...a.drive[0],observedRevision:'r2'}],
  }));
  assert.equal(p.drive.gate,'GATE_DRIVE');
  assert.ok(p.drive.reasons.includes('DRIVE_REVISION_CHANGED'));
  assert.equal(p.local.gate,'READY');
});
test('invalid target root, absent backup and upstream mismatch always gate local',()=>{
  const a=fixture();
  const p=evaluateTriadSync(fixture({local:{
    ...a.local,root:'/home/elkakas314/upstream',backupRef:undefined,overlayPin:'wrong',
  }}));
  assert.equal(p.local.gate,'GATE_LOCAL');
  assert.ok(p.local.reasons.includes('LOCAL_ROOT_MISMATCH'));
  assert.ok(p.local.reasons.includes('ROLLBACK_SNAPSHOT_REQUIRED'));
  assert.ok(p.local.reasons.includes('UPSTREAM_PIN_MISMATCH'));
});
test('CI for exact HEAD required before promoting Drive or local',()=>{
  const a=fixture(),p=evaluateTriadSync(fixture({github:{...a.github,ciState:'PENDING'}}));
  assert.equal(p.github.gate,'READY');
  assert.equal(p.drive.gate,'GATE_DRIVE');
  assert.equal(p.local.gate,'GATE_LOCAL');
  assert.ok(p.drive.reasons.includes('CI_EXACT_HEAD_NOT_VERIFIED'));
});
test('write verification is all-or-nothing across GitHub, Docs and filesystem',()=>{
  const ok=verifyTriadWrite({requestedSha:'x',newGitHubHead:head,actualGitHubHead:head,
    driveExpectedRevision:'r1',driveObservedRevision:'r1',
    localReadbackSha:'b'.repeat(64),localExpectedSha:'b'.repeat(64)});
  assert.equal(ok.complete,true);
  assert.equal(verifyTriadWrite({requestedSha:'x',newGitHubHead:head,
    actualGitHubHead:head,driveExpectedRevision:'r1',
    driveObservedRevision:'r2',localExpectedSha:'b',localReadbackSha:'b'}).complete,false);
  assert.equal(verifyTriadWrite({requestedSha:'x'}).complete,false);
});
