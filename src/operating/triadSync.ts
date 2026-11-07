/**
 * TriadSync admission only. Executor = existing MANOJOS3/connected GitHub+Drive;
 * this module neither owns a scheduler nor copies local files.
 */
export const TRIAD_SYNC_SCHEMA='libre-chat-vx.triad-sync.v1' as const;
export type TriadSyncGate='READY'|'GATE_CONFIG'|'GATE_LOCAL'|'GATE_DRIVE'|'GATE_GITHUB'|'GATE_EVIDENCE';
export interface TriadGitHub {
  repo:string;branch:string;observedHead:string;expectedHead:string;
  patRepo:string;patVerified:boolean;patCanPush:boolean;
  ciHead?:string;ciState?:'SUCCESS'|'FAILED'|'PENDING'|'UNOBSERVED';
}
export interface TriadLocal {
  root:string;head?:string;workingTree:'CLEAN'|'DIRTY'|'UNKNOWN';
  untracked:'NONE'|'PRESENT'|'UNKNOWN';backupRef?:string;
  overlayPin?:string;
}
export interface TriadDriveDocument {
  id:string;expectedRevision:string;observedRevision:string;
  writable:boolean;sourceHead:string;
}
export interface TriadObservation {
  project:'LIBRECHAT_VX';github:TriadGitHub;local:TriadLocal;
  drive:readonly TriadDriveDocument[];
}
export interface TriadSyncPlan {
  schema:typeof TRIAD_SYNC_SCHEMA;authority:false;
  github:{gate:TriadSyncGate;reasons:string[]};
  drive:{gate:TriadSyncGate;reasons:string[];docs:string[]};
  local:{gate:TriadSyncGate;reasons:string[]};
  publishProof:'REQUIRES_CI_EXACT_SHA_AND_PROVIDER_READBACK';
  nextAction:string;
}

function validSHA(value:string):boolean{return /^[a-f0-9]{40}$/i.test(value);}
function safeBranch(value:string):boolean{
  return !!value&&value.length<160&&!value.startsWith('/')&&!value.endsWith('/')&&
    !value.includes('..')&&!value.includes('@{')&&!/[\s~^:?*\\]/.test(value);
}
function safeDriveId(value:string):boolean{return /^[A-Za-z0-9_-]{18,}$/.test(value);}
function safeRoot(value:string):boolean{
  return value==='/home/elkakas314/librechat/vx';
}
export function evaluateTriadSync(o:TriadObservation):TriadSyncPlan {
  const gh:string[]=[];
  if(o.project!=='LIBRECHAT_VX'||o.github.repo!=='elkakas314/libre_chat_vx'||
     !safeBranch(o.github.branch))gh.push('REPO_OR_BRANCH_MISMATCH');
  if(!validSHA(o.github.observedHead)||!validSHA(o.github.expectedHead)||
    o.github.observedHead!==o.github.expectedHead)gh.push('GITHUB_HEAD_CHANGED');
  if(!o.github.patVerified||!o.github.patCanPush||o.github.patRepo!==o.github.repo)
    gh.push('FINE_GRAINED_PAT_SCOPE_MISSING');
  const githubGate:TriadSyncGate=gh.length?'GATE_GITHUB':'READY';

  const dr:string[]=[];
  const seen=new Set<string>();
  if(!o.drive.length)dr.push('DRIVE_TARGETS_MISSING');
  for(const doc of o.drive) {
    if(!safeDriveId(doc.id)||seen.has(doc.id))dr.push('DRIVE_ID_INVALID_OR_DUPLICATED');
    seen.add(doc.id);
    if(!doc.writable)dr.push('DRIVE_WRITE_NOT_CONFIRMED');
    if(!doc.expectedRevision||doc.observedRevision!==doc.expectedRevision)
      dr.push('DRIVE_REVISION_CHANGED');
    if(doc.sourceHead!==o.github.observedHead)dr.push('DRIVE_SOURCE_HEAD_MISMATCH');
  }
  if(githubGate!=='READY')dr.push('GITHUB_PRECONDITION_FAILED');
  if(o.github.ciState!=='SUCCESS'||o.github.ciHead!==o.github.observedHead)
    dr.push('CI_EXACT_HEAD_NOT_VERIFIED');
  const driveGate:TriadSyncGate=dr.length?'GATE_DRIVE':'READY';

  const loc:string[]=[];
  if(!safeRoot(o.local.root))loc.push('LOCAL_ROOT_MISMATCH');
  if(o.local.workingTree!=='CLEAN'||o.local.untracked!=='NONE')
    loc.push('LOCAL_UNCOMMITTED_OR_UNOBSERVED');
  if(!o.local.head||!validSHA(o.local.head))loc.push('LOCAL_GIT_HEAD_NOT_VERIFIED');
  if(!o.local.backupRef?.trim())loc.push('ROLLBACK_SNAPSHOT_REQUIRED');
  if(o.local.overlayPin!=='f10b1d91f1eee3a2c82d5247bf620351486b7c1b')
    loc.push('UPSTREAM_PIN_MISMATCH');
  if(githubGate!=='READY')loc.push('GITHUB_PRECONDITION_FAILED');
  if(o.github.ciState!=='SUCCESS'||o.github.ciHead!==o.github.observedHead)
    loc.push('CI_EXACT_HEAD_NOT_VERIFIED');
  const localGate:TriadSyncGate=loc.length?'GATE_LOCAL':'READY';

  return {
    schema:TRIAD_SYNC_SCHEMA,authority:false,
    github:{gate:githubGate,reasons:gh},
    drive:{gate:driveGate,reasons:dr,docs:o.drive.map(x=>x.id)},
    local:{gate:localGate,reasons:loc},
    publishProof:'REQUIRES_CI_EXACT_SHA_AND_PROVIDER_READBACK',
    nextAction:githubGate!=='READY'?'RECONCILE_REMOTE_AND_PAT':
      driveGate==='READY'&&localGate==='READY'?'ALLOW_GOVERNED_SYNC_PROPOSAL':
      driveGate==='READY'?'UPDATE_DRIVE_WITH_REQUIRED_REVISION_AND_READBACK':
      localGate==='READY'?'RECONCILE_DRIVE_REVISION':
      'PRESERVE_LOCAL_AND_RECHECK_INDEPENDENT_SCOPES',
  };
}
/** Never call this on unverified action output: a write is not proof of effect. */
export interface TriadWriteReadback {
  requestedSha:string;newGitHubHead?:string;actualGitHubHead?:string;
  driveExpectedRevision?:string;driveObservedRevision?:string;
  localReadbackSha?:string;localExpectedSha?:string;
}
export function verifyTriadWrite(r:TriadWriteReadback):{
  github:boolean;drive:boolean;local:boolean;complete:boolean;
}{
  const github=!!r.newGitHubHead&&validSHA(r.newGitHubHead)&&
    r.newGitHubHead===r.actualGitHubHead;
  const drive=!!r.driveExpectedRevision&&!!r.driveObservedRevision&&
    r.driveExpectedRevision===r.driveObservedRevision;
  const local=!!r.localExpectedSha&&!!r.localReadbackSha&&
    r.localExpectedSha===r.localReadbackSha;
  return {github,drive,local,complete:github&&drive&&local};
}
