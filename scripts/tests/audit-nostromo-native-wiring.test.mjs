import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../audit-nostromo-native-wiring.mjs',import.meta.url));
const run=(vx,up)=>spawnSync(process.execPath,[script,
  '--vx='+vx,'--upstream='+up,'--skip-ports'],{encoding:'utf8',timeout:12000});
test('native wiring audit never prints .env secrets and never claims LIVE from SOURCE',()=>{
 const base=mkdtempSync(path.join(os.tmpdir(),'nostromo-wiring-'));
 const vx=path.join(base,'vx'),up=path.join(base,'upstream');
 const make=(root,rel,txt)=>{
  const p=path.join(root,rel);mkdirSync(path.dirname(p),{recursive:true});writeFileSync(p,txt);
 };
 try{
  make(up,'.env','SECRET_VALUE_NOSTROMO_DO_NOT_PRINT=abc\n');
  make(up,'librechat.yaml','mcpServers:\n  nostromo-autonomo:\n    env:\n      PRIVATE_SECRET: SECRET_VALUE_NOSTROMO_DO_NOT_PRINT\n');
  make(up,'client/package.json',JSON.stringify({dependencies:{'@librechat/vx':'workspace:*'}}));
  make(up,'client/src/components/Chat/Presentation.tsx','import VXCockpitBridge from "VX";');
  make(up,'client/src/components/VX/VXCockpitBridge.tsx','export default function Bridge(){}');
  make(vx,'deployment/nostromo-mcp/server.mjs','// SOURCE');
  make(vx,'deployment/nostromo-mcp/package.json',JSON.stringify({version:'0.3.0'}));
  make(vx,'agents/nostromo-autonomo/agent.candidate.json',JSON.stringify({enabled:false,model:null}));
  make(vx,'src/llm/siwcResponsesClient.ts','// OAuth implementation not enabled');
  const out=run(vx,up);
  assert.equal(out.status,0,out.stderr);
  assert.equal(out.stderr,'');
  assert.equal(out.stdout.includes('SECRET_VALUE_NOSTROMO_DO_NOT_PRINT'),false);
  const j=JSON.parse(out.stdout);
  assert.equal(j.readOnly,true);
  assert.equal(j.mutations,0);
  assert.equal(j.secretsRead,false);
  assert.equal(j.mcp.configuration,'YAML_PRESENT_UNPARSED');
  assert.equal(j.agent.candidateEnabled,false);
  assert.equal(j.agent.agentBuilderRegistered,'NOT_VERIFIED');
  assert.equal(j.backend.port3080,'SKIPPED');
  assert.equal(j.visual.presentationRef,'SOURCE_REFERENCES_BRIDGE');
  assert.equal(j.status,'WIRING_INCOMPLETE');
  assert.ok(j.blockers.includes('MCP_CONFIG_CONTENT_NOT_AUDITED'));
  assert.ok(j.blockers.includes('NATIVE_AGENT_NOT_PROVISIONED'));
  assert.ok(j.blockers.includes('MODEL_AND_CHATGPT_OAUTH_BINDING_NOT_VERIFIED'));
 }finally{rmSync(base,{recursive:true,force:true});}
});
test('without native yaml, bridge or backend, wiring is explicitly incomplete',()=>{
 const base=mkdtempSync(path.join(os.tmpdir(),'nostromo-empty-'));
 try{
  const out=run(path.join(base,'vx'),path.join(base,'upstream'));
  assert.equal(out.status,0,out.stderr);
  const j=JSON.parse(out.stdout);
  assert.ok(j.blockers.includes('LIBRECHAT_YAML_NOT_PRESENT'));
  assert.ok(j.blockers.includes('COCKPIT_BRIDGE_NOT_SOURCE_CONNECTED'));
  assert.ok(j.blockers.includes('BACKEND_TCP_NOT_LISTENING'));
  assert.equal(j.mcp.liveMcpSession,'NOT_VERIFIED');
 }finally{rmSync(base,{recursive:true,force:true});}
});
