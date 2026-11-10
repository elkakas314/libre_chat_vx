#!/usr/bin/env node
/** NOSTROMO Autónomo: one host-local, stdio MCP for LibreChat native agents.
 * No MANOJOS dependency, HTTP listener, new daemon or shell through stdout.
 * All host side effects run as the OS user spawning this process.
 */
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {normalizeRequest,preview,consumeApproval,executeLocal} from './policy.mjs';
import {selectedTools,describeTools} from './tools.mjs';

const enabled=process.env.NOSTROMO_MCP_ENABLED==='1';
const allowedRoots=(process.env.NOSTROMO_ALLOWED_ROOTS||'').split(':').filter(Boolean);
const approvalDir=process.env.NOSTROMO_APPROVAL_DIR||'';
const settings={enabled,roots:allowedRoots};
const server=new McpServer({name:'nostromo-autonomo',version:'0.2.0'});
const activeTools=selectedTools(process.env.NOSTROMO_TOOL_SET);
const result=(payload,isError=false)=>({
  content:[{type:'text',text:JSON.stringify(payload)}],
  ...(isError?{isError:true}:{})
});
const inputSchema={
  argv:z.array(z.string().min(1).max(2048)).min(1).max(40),
  cwd:z.string().min(1).max(512),
  timeout_s:z.number().int().min(1).max(120).default(30),
  max_output:z.number().int().min(256).max(16384).default(8192)
};
if(activeTools.has('nostromo_estado')) server.registerTool('nostromo_estado',{
  description:'Estado del MCP local (configured no implica installed ni live de ChatGPT).',
  inputSchema:{}
},async()=>result({
  kind:'nostromo.autonomous.local-mcp.v1',mode:'TERMINAL',
  enabled,rootsConfigured:allowedRoots.length,approvalConfigured:!!approvalDir,
  principal:'CURRENT_OS_USER',hostExecutionAuthority:false,
  chatgptBinding:'SEPARATE_OAUTH_NOT_VERIFIED',mcpLive:true,
  linkedProjects:'FUTURE_DISABLED'
}));
if(activeTools.has('nostromo_terminal_preparar')) server.registerTool('nostromo_terminal_preparar',{
  description:'Prepara argv+cwd exactos: R0 sin permiso adicional, R2 exige autorización física independiente. No ejecuta.',
  inputSchema
},async(args)=>{
  try {return result(await preview(args,settings));}
  catch(e){return result({status:'DENIED',reason:String(e?.message||'REQUEST_INVALID')},true);}
});
if(activeTools.has('nostromo_terminal_ejecutar')) server.registerTool('nostromo_terminal_ejecutar',{
  description:'Ejecuta terminal local: sólo comandos R0 de lectura admitidos o R2 con permiso de un uso hash-bound creado fuera de LibreChat. Devuelve exitCode/stdout/stderr. Sin shell implícita.',
  inputSchema
},async(args)=>{
  let decision;
  try{decision=await preview(args,settings);}
  catch(e){return result({status:'DENIED',reason:String(e?.message||'REQUEST_INVALID')},true);}
  if(decision.status==='DISABLED'||decision.status==='DENIED')
    return result(decision,true);
  if(decision.risk==='R2'&&!await consumeApproval(approvalDir,decision.requestHash))
    return result({status:'LOCAL_APPROVAL_REQUIRED',risk:'R2',
      requestHash:decision.requestHash,executed:false},true);
  const executed=await executeLocal(decision.request);
  return result({...executed,classification:decision.risk,
    requestHash:decision.requestHash,
    executed:executed.status!=='SPAWN_ERROR',
    // A process exit is not independent verification of an effect.
    materialVerified:false},executed.status!=='EXIT_0');
});
server.registerTool('nostromo_herramientas',{
 description:'Catálogo de herramientas del único MCP NOSTROMO; sólo administrable desde configuración local confiable.',
 inputSchema:{}
},async()=>result({server:'nostromo-autonomo',
 toolRegistry:'OWNER_CONFIGURED_SOURCE',
 tools:describeTools(activeTools),
 mutableByModel:false,installedExtensions:false}));
async function main() {
  await server.connect(new StdioServerTransport());
}
main().catch(e=>{
  process.stderr.write('NOSTROMO_MCP_START_FAILED: '+(e?.code||e?.name||'UNKNOWN')+'\n');
  process.exitCode=1;
});
