#!/usr/bin/env node
/** NOSTROMO native wiring audit. READ ONLY: no config parse, credential read,
 * install, spawn of MCP, npm, git fetch, secret material, or service changes.
 * A TCP listener is not proof of an authenticated LibreChat application.
 */
import {lstatSync,existsSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {homedir} from 'node:os';
import {execFileSync} from 'node:child_process';
import net from 'node:net';

const option=(name,fallback)=>{
  const x=process.argv.find(a=>a.startsWith('--'+name+'='));
  return resolve(x?x.slice(name.length+3):fallback);
};
if(process.argv.includes('--help')){
  console.log('node scripts/audit-nostromo-native-wiring.mjs [--vx=PATH] [--upstream=PATH] [--skip-ports]');
  process.exit(0);
}
const vx=option('vx',join(homedir(),'librechat','vx'));
const up=option('upstream',join(homedir(),'librechat','upstream'));
const skipPorts=process.argv.includes('--skip-ports');
function kind(file) {
  try{
    const s=lstatSync(file);
    if(s.isSymbolicLink())return 'SYMLINK_NOT_FOLLOWED';
    if(s.isFile())return 'FILE';
    if(s.isDirectory())return 'DIRECTORY';
    return 'SPECIAL_FILE';
  }catch{return 'ABSENT';}
}
function head(dir){
  if(kind(dir)!=='DIRECTORY')return null;
  try{
    return execFileSync('git',['-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null',
      '-C',dir,'rev-parse','HEAD'],{
      timeout:8000,encoding:'utf8',stdio:['ignore','pipe','ignore'],
      env:{PATH:'/usr/bin:/bin',GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0',
        GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'}
    }).trim();
  }catch{return null;}
}
function readPublicJson(file){
  if(kind(file)!=='FILE')return null;
  try{
    const raw=readFileSync(file,'utf8');
    if(raw.length>100_000)return null;
    const json=JSON.parse(raw);
    return json&&typeof json==='object'&&!Array.isArray(json)?json:null;
  }catch{return null;}
}
async function tcp(port){
  if(skipPorts)return 'SKIPPED';
  return new Promise(done=>{
    const socket=net.connect({host:'127.0.0.1',port});
    let finished=false;
    const finish=value=>{if(finished)return;finished=true;socket.destroy();done(value);};
    socket.setTimeout(600,()=>finish('NO_RESPONSE'));
    socket.once('connect',()=>finish('TCP_LISTENING_UNIDENTIFIED'));
    socket.once('error',()=>finish('NOT_LISTENING_OR_BLOCKED'));
  });
}
const expectedUp='f10b1d91f1eee3a2c82d5247bf620351486b7c1b';
const vxHead=head(vx),upHead=head(up);
const mcpSource=kind(join(vx,'deployment/nostromo-mcp/server.mjs'));
const mcpJson=readPublicJson(join(vx,'deployment/nostromo-mcp/package.json'));
const agentFile=join(vx,'agents/nostromo-autonomo/agent.candidate.json');
const agent=readPublicJson(agentFile);
const yamlFile=join(up,'librechat.yaml');
const yaml=kind(yamlFile); // Do NOT read the configuration or .env values.
const env=kind(join(up,'.env'));
const overlay=kind(join(up,'client/src/components/VX/VXCockpitBridge.tsx'));
const presentationFile=join(up,'client/src/components/Chat/Presentation.tsx');
let presentationRef='UNREADABLE';
if(kind(presentationFile)==='FILE'){
  try{presentationRef=readFileSync(presentationFile,'utf8').includes('VXCockpitBridge')?
    'SOURCE_REFERENCES_BRIDGE':'NO_BRIDGE_REFERENCE';}catch{}
}
const client=readPublicJson(join(up,'client/package.json'));
const bins={};
for(const [name,subdir] of [
  ['rimraf','packages/data-provider'],['tsdown','packages/data-provider'],
  ['vite','client'],['tsc','packages/data-provider']
]){
  bins[name]=[
    join(up,'node_modules/.bin',name),join(up,subdir,'node_modules/.bin',name)
  ].some(p=>existsSync(p))?'PRESENT_NOT_RUN':'MISSING';
}
const [p3080,p27017]=await Promise.all([tcp(3080),tcp(27017)]);
const blockers=[];
if(upHead!==expectedUp)blockers.push('UPSTREAM_IDENTITY_MISMATCH');
if(mcpSource!=='FILE'||mcpJson?.version!=='0.3.0')blockers.push('MCP_SOURCE_NOT_V03');
if(!agent||agent.enabled!==true||!agent.model)
  blockers.push('NATIVE_AGENT_NOT_PROVISIONED');
if(yaml!=='FILE')blockers.push('LIBRECHAT_YAML_NOT_PRESENT');
else blockers.push('MCP_CONFIG_CONTENT_NOT_AUDITED');
if(env!=='FILE')blockers.push('BACKEND_ENV_NOT_PRESENT');
if(overlay!=='FILE'||presentationRef!=='SOURCE_REFERENCES_BRIDGE')
  blockers.push('COCKPIT_BRIDGE_NOT_SOURCE_CONNECTED');
if(client?.dependencies?.['@librechat/vx']===undefined)
  blockers.push('CLIENT_VX_DEPENDENCY_NOT_DECLARED');
for(const name of ['rimraf','tsdown','vite'])if(bins[name]==='MISSING')
  blockers.push('FRONTEND_BIN_MISSING_'+name.toUpperCase());
if(p3080!=='TCP_LISTENING_UNIDENTIFIED')blockers.push('BACKEND_TCP_NOT_LISTENING');
blockers.push('AGENT_TO_MCP_TOOL_CALL_NOT_E2E_VERIFIED');
blockers.push('MODEL_AND_CHATGPT_OAUTH_BINDING_NOT_VERIFIED');
const result={
  schema:'nostromo.native-wiring.r0.v1',
  readOnly:true,mutations:0,secretsRead:false,
  observedAt:new Date().toISOString(),vx,upstream:up,
  vxHead,upstreamHead:upHead,expectedUpstreamHead:expectedUp,
  mcp:{source:mcpSource,packageVersion:mcpJson?.version??null,
    configuration:yaml==='FILE'?'YAML_PRESENT_UNPARSED':'YAML_NOT_CONFIGURED',
    liveMcpSession:'NOT_VERIFIED'},
  agent:{candidate:kind(agentFile),candidateEnabled:agent?.enabled===true,
    modelAssigned:typeof agent?.model==='string'&&!!agent.model,
    agentBuilderRegistered:'NOT_VERIFIED'},
  visual:{bridgeFile:overlay,presentationRef,
    advancedCockpitMounted:'NOT_VERIFIED'},
  backend:{envExistenceOnly:env,port3080:p3080,port27017:p27017,
    serviceIdentity:'NOT_VERIFIED'},
  client:{vxDependencyDeclared:client?.dependencies?.['@librechat/vx']!==undefined,
    frontendBins:bins},
  oauth:{source:kind(join(vx,'src/llm/siwcResponsesClient.ts')),
    authenticatedSession:'NOT_VERIFIED'},
  blockers,
  status:blockers.length?'WIRING_INCOMPLETE':'R0_GATES_PRESENT_NOT_E2E_VERIFIED',
  note:'YAML and .env values intentionally not read. Listener ports and SOURCE are not proof of LIVE.'
};
console.log(JSON.stringify(result,null,2));
