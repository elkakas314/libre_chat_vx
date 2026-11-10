#!/usr/bin/env node
/** Single user-facing NOSTROMO MCP. Spawned on demand over stdio by LibreChat;
 * internally calls existing, separately governed MANOJOS3 and HOST_CONTROL.
 * Not a new host daemon, not a remote HTTP admin endpoint.
 */
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {z} from 'zod';
import {requireLoopbackUrl,evaluateExec,exactLocalGrant,boundedResult,hostExecRequest} from './policy.mjs';

const enabled=process.env.NOSTROMO_MCP_ENABLED==='1';
const cwdList=(process.env.NOSTROMO_ALLOWED_CWDS||'').split(':').filter(Boolean);
const services=(process.env.NOSTROMO_ALLOWED_SERVICES||'').split(',').filter(Boolean);
const repos=(process.env.NOSTROMO_ALLOWED_REPOS||'').split(':').filter(Boolean);
const scope={enabled,allowedWorkingDirs:cwdList};
const grantSource=process.env.NOSTROMO_LOCAL_GRANT_BROKER_FILE||'';
const response=(object,error=false)=>({
  content:[{type:'text',text:JSON.stringify(boundedResult(object))}],
  ...(error?{isError:true}:{})
});
async function upstream(kind,name,args={}) {
  if(!enabled)return {status:'UNAVAILABLE',reason:'NOSTROMO_MCP_DISABLED'};
  const key=kind==='MANOJOS3'?'MANOJOS3_MCP_URL':'HOST_CONTROL_MCP_URL';
  let url;
  try {url=requireLoopbackUrl(process.env[key]);}
  catch {return {status:'UNAVAILABLE',reason:kind+'_LOOPBACK_NOT_CONFIRMED'};}
  const client=new Client({name:'nostromo-control',version:'0.1.0'},{capabilities:{}});
  try {
    await client.connect(new StreamableHTTPClientTransport(url));
    const result=await client.callTool({name,arguments:args});
    return {status:result.isError?'TARGET_TOOL_ERROR':'TARGET_RETURNED_UNVERIFIED',
      target:kind,tool:name,readback:result.structuredContent??result.content};
  } catch {
    return {status:'UNAVAILABLE',reason:kind+'_MCP_REQUEST_FAILED'};
  } finally {
    await client.close().catch(()=>{});
  }
}
const server=new McpServer({name:'nostromo-control',version:'0.1.0'});
server.registerTool('nostromo_health',{
 description:'Inform SOURCE/CONFIGURED flags; never claim target LIVE from config',
 inputSchema:{}
},async()=>response({server:'nostromo-control',oneExposedMcp:true,
 enabled,hostBound:!!process.env.HOST_CONTROL_MCP_URL,manojosBound:!!process.env.MANOJOS3_MCP_URL,
 grantProviderBound:!!grantSource,localInference:process.env.NOSTROMO_LOCAL_MODEL_BASE_URL?'CONFIG_ONLY':'UNCONFIGURED',
 materialVerified:false}));
server.registerTool('nostromo_host_read',{
 description:'R0 host inspection by explicit existing HOST_CONTROL tool; readback unverified',
 inputSchema:{
   operation:z.enum(['host_status','host_listener_status','host_service_status','host_git_status','host_process_list']),
   unit:z.string().optional(),path:z.string().optional(),limit:z.number().int().min(1).max(300).optional()
 }
},async({operation,unit,path,limit})=>{
 const args={};
 if(operation==='host_service_status'){
   if(!unit||!services.includes(unit))return response({status:'DENIED',reason:'SERVICE_NOT_ALLOWLISTED'},true);
   args.unit=unit;
 } else if(operation==='host_git_status'){
   if(!path||!repos.includes(path))return response({status:'DENIED',reason:'REPO_NOT_ALLOWLISTED'},true);
   args.path=path;
 } else if(operation==='host_process_list')args.limit=limit??80;
 return response(await upstream('HOST_CONTROL',operation,args));
});
server.registerTool('nostromo_manojos_status',{
 description:'Read MANOJOS3 governed health/capabilities; status is not a host repair receipt',
 inputSchema:{kind:z.enum(['status','capabilities','skills']).default('status')}
},async({kind})=>response(await upstream('MANOJOS3','manojos_'+kind,{})));
server.registerTool('nostromo_manojos_submit',{
 description:'Delegate a user objective to EXISTING MANOJOS3 Policy/Kernel; no independent authority.',
 inputSchema:{objective:z.string().min(8).max(3000),
   risk:z.enum(['R0','R1','R2','R3']).default('R0')}
},async({objective,risk})=>{
 if(risk==='R3')return response({status:'DENIED',reason:'DESTRUCTIVE_OBJECTIVE_REQUIRES_HOST_OPERATOR'},true);
 return response(await upstream('MANOJOS3','manojos_submit',
   {objective,risk_ceiling:risk}));
});
const terminalInput={
 argv:z.array(z.string().min(1).max(512)).min(1).max(32),
 cwd:z.string().min(1).max(240),
 timeout_s:z.number().int().min(1).max(60).default(30),
 max_output:z.number().int().min(256).max(8192).default(8192)
};
server.registerTool('nostromo_terminal_preview',{
 description:'Plan exact terminal argv with SHA-256; NEVER executes command or grants permission.',
 inputSchema:terminalInput
},async(args)=>{
 const prepared=evaluateExec(args,scope);
 return response(prepared,prepared.status==='DENIED'||prepared.status==='DISABLED');
});
server.registerTool('nostromo_terminal_execute',{
 description:'Execute EXACT argv in existing HOST_CONTROL, only if an independent local one-shot R2 grant matches the exact request hash. Never retry unknown effects.',
 inputSchema:terminalInput
},async(args)=>{
 const plan=evaluateExec(args,scope);
 if(plan.status!=='LOCAL_GRANT_REQUIRED')return response(plan,true);
 const grantId=await exactLocalGrant(grantSource,plan.requestHash);
 if(!grantId)return response({
   status:'LOCAL_GRANT_REQUIRED',requestHash:plan.requestHash,authority:false},true);
 const callArgs={argv:args.argv,script:null,cwd:args.cwd,env:{},timeout_s:args.timeout_s,
   max_output:args.max_output,grant_id:grantId};
 const result=await upstream('HOST_CONTROL','host_exec',callArgs);
 // Once submitted, failure may follow a material effect; do not retry.
 return response({status:'RECONCILE_REQUIRED',requestHash:plan.requestHash,
   host:result,authority:false,automaticRetry:false});
});
async function main(){
 await server.connect(new StdioServerTransport());
}
main().catch(()=>{process.exitCode=1;});
