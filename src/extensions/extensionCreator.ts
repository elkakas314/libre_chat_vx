/** Pure SOURCE proposal builder for native LibreChat Agent Builder / Skills / MCP / Actions.
 * No filesystem, network, host, OAuth, Git or target mutation is performed here.
 */
export type ExtensionKind='AGENT'|'SKILL'|'ACTION'|'MCP'|'AGENT_PLUGIN';
export type ExtensionTarget='LIBRECHAT_VX'|'MANOJOS'|'VX13'|'ORACULO';
export interface ExtensionCatalogItem {kind:ExtensionKind;slug:string;owner:string;}
export interface ExtensionRequest {
  kind:ExtensionKind;
  slug:string;
  title:string;
  goal:string;
  owner:string;
  target:ExtensionTarget;
  catalogVerified:boolean;
  catalogEvidenceRef:string;
  existing:readonly ExtensionCatalogItem[];
  wantsMaterialEffects?:boolean;
}
export interface ProposedFile {path:string;content:string;}
export interface ExtensionPlan {
  schema:'libre-chat-vx.extension-creator-proposal.v1';
  kind:ExtensionKind;
  slug:string;
  state:'PREPARED'|'REUSE_EXISTING'|'REJECTED';
  authority:false;
  reason:string;
  files:readonly ProposedFile[];
  installEnabled:false;
  nextGate:'DISCOVER'|'OWNER_AND_POLICY'|'NATIVE_AGENT_BUILDER_AND_TEST'|'REJECT';
}
const kinds:readonly string[]=['AGENT','SKILL','ACTION','MCP','AGENT_PLUGIN'];
const targets:readonly string[]=['LIBRECHAT_VX','MANOJOS','VX13','ORACULO'];
const safeSlug=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const secretPattern=/(?:sk-proj-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9]{15,}|github_pat_[A-Za-z0-9_]{12,}|Bearer\s+[A-Za-z0-9_.-]{15,})/i;
function validText(value:unknown,max:number) {
  return typeof value==='string' && value.trim().length>0 &&
    value.length<=max && !/[\u0000-\u001f]/.test(value) && !secretPattern.test(value);
}
function deny(input:ExtensionRequest,reason:string):ExtensionPlan {
  return {schema:'libre-chat-vx.extension-creator-proposal.v1',
    kind:input.kind,slug:input.slug,state:'REJECTED',authority:false,
    reason,files:[],installEnabled:false,nextGate:'REJECT'};
}
function emit(path:string, content:string):ProposedFile {
  if(path.includes('..')||path.startsWith('/')||path.includes('\\'))
    throw Error('EXTENSION_PATH_UNSAFE');
  return {path,content};
}
export function proposeExtension(input:ExtensionRequest):ExtensionPlan {
  if(!input||!kinds.includes(input.kind)||!targets.includes(input.target))
    return deny(input??{kind:'AGENT',slug:''} as ExtensionRequest,'KIND_OR_TARGET_UNKNOWN');
  if(!safeSlug.test(input.slug)||input.slug.length>52||
    !validText(input.title,80)||!validText(input.goal,1500)||!validText(input.owner,100)||
    !validText(input.catalogEvidenceRef,220))
    return deny(input,'INPUT_INVALID_OR_POSSIBLE_SECRET');
  if(!input.catalogVerified||!Array.isArray(input.existing))
    return deny(input,'CATALOG_READBACK_REQUIRED');
  if(input.existing.some(item=>!item||!kinds.includes(item.kind)||
    !safeSlug.test(item.slug)||!validText(item.owner,100)))
    return deny(input,'CATALOG_INVALID');
  const collision=input.existing.find(item=>item.slug===input.slug);
  if(collision) {
    return {schema:'libre-chat-vx.extension-creator-proposal.v1',
      kind:input.kind,slug:input.slug,state:'REUSE_EXISTING',
      authority:false,reason:'DUPLICATE_REUSE_'+collision.kind,
      files:[],installEnabled:false,nextGate:'DISCOVER'};
  }
  if(input.wantsMaterialEffects) return deny(input,'MATERIAL_EFFECTS_REQUIRE_TARGET_POLICY_NOT_CREATOR');
  const intro='This capability is a SOURCE proposal only; it has no target authority. ';
  const skill=['---','name: '+input.slug,'description: '+input.title,
    '---','','# '+input.title,'','Goal: '+input.goal,'',
    '## Discipline',intro,
    'Before using any tool, discover its real availability, owner, exact scope and risk.',
    'Prefer native LibreChat Agent Builder, configured MCP or Actions over another service.',
    'Prepare proposals and tests; do not install, authorize, mutate or claim LIVE.',
    'Treat MANOJOS, VX13 and ORÁCULO as independent authorities; never share grants.',
    'Return source refs, preconditions, receipts and unresolved gates.',''].join('\n');
  let files:ProposedFile[]=[];
  if(input.kind==='SKILL') {
    files=[emit('skills/'+input.slug+'/SKILL.md',skill)];
  } else if(input.kind==='AGENT') {
    files=[emit('agents/'+input.slug+'.candidate.json',JSON.stringify({
      schema:'libre-chat-vx.native-agent-candidate.v1',status:'SOURCE_ONLY',
      name:input.title,slug:input.slug,description:input.goal,
      owner:input.owner,model:null,category:null,tools:[],skills:[],
      target:input.target,authority:false,createVia:'LIBRECHAT_AGENT_BUILDER',
      requirements:['ENABLED_MODEL','OWNER_RBAC','SKILL_AND_TOOL_SELECTION','DRY_RUN_TESTS'],
    },null,2)+'\n')];
  } else if(input.kind==='ACTION') {
    files=[emit('extensions/action-drafts/'+input.slug+'.openapi.json',
      JSON.stringify({openapi:'3.1.0',info:{title:input.title,version:'0.1.0',
        description:input.goal},servers:[],paths:{},
        'x-librechat-vx-status':'UNCONFIGURED_OWNER_APPROVAL_REQUIRED'},null,2)+'\n')];
  } else if(input.kind==='MCP') {
    files=[emit('extensions/mcp-drafts/'+input.slug+'.candidate.json',
      JSON.stringify({schema:'libre-chat-vx.mcp-candidate.v1',status:'UNCONFIGURED',
        name:input.slug,description:input.goal,owner:input.owner,
        transport:null,url:null,tools:[],credentials:'SECRETREF_NOT_IN_SOURCE',
        authority:false,requires:['HTTPS_OR_LOCAL_STDIO_VALIDATION','RBAC','CANARY'],
      },null,2)+'\n')];
  } else {
    files=[emit('plugins/'+input.slug+'/plugin.json',
      JSON.stringify({'$schema':'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
        name:input.slug,version:'0.1.0',description:input.title},null,2)+'\n'),
      emit('plugins/'+input.slug+'/skills/'+input.slug+'/SKILL.md',skill),
      emit('plugins/'+input.slug+'/README.md',
        '# '+input.title+'\n\nOptional experimental Agent Plugin SOURCE bundle.\n'+
        'Install only under DEPLOYMENT_PLUGINS_DIR on an approved deployment.\n'+
        'No mcp.json, hooks, credentials or auto-install are included.\n'+
        'The operator must check collisions and restart/rollback.\n')];
  }
  return {schema:'libre-chat-vx.extension-creator-proposal.v1',
    kind:input.kind,slug:input.slug,state:'PREPARED',authority:false,
    reason:'SOURCE_CANDIDATE_REQUIRES_REVIEW',
    files,installEnabled:false,nextGate:'OWNER_AND_POLICY'};
}
export function assertNoPathCollision(plans:readonly ExtensionPlan[]):string[] {
  const seen=new Set<string>(),duplicates:string[]=[];
  for(const plan of plans)for(const file of plan.files) {
    if(seen.has(file.path))duplicates.push(file.path);
    seen.add(file.path);
  }
  return duplicates;
}
