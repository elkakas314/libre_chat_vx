'use strict';
/** Exactly one read-only metrics tool over the operator-configured native MCP,
 * with the same per-user ACL / app server attestation as the status port.
 */
function createNativeMcpMetricsPort({req,services,registry,manager,flowManager,expectedCommand,expectedCwd}) {
 if(!req||!services||!registry||!manager||!flowManager||
    typeof expectedCommand!=='string'||!expectedCommand.startsWith('/')||
    typeof expectedCwd!=='string'||!expectedCwd.startsWith('/'))
  throw Error('NATIVE_METRICS_DEPENDENCIES_REQUIRED');
 const serverName='nostromo-local',toolName='nostromo_metricas';
 async function checked() {
  const user=req.user;
  if(!user||typeof user.id!=='string'||!user.id||typeof user.role!=='string'||!user.role||
     !await services.userCanUseMCPServers(user,req))return null;
  const servers=await services.getAccessibleMCPServers(user.id,user.role),config=servers?.[serverName];
  if(!config||config.type!=='stdio'||config.command!==expectedCommand||
     !Array.isArray(config.args)||config.args.length!==0||
     !await registry.isAppServerConfig(serverName,config))return null;
  const snap=await manager.getServerToolFunctionsSnapshot(user.id,serverName,config);
  const tools=Object.entries(snap?.tools??{}).filter(([key,entry])=>{
   const raw=entry?.serverToolName??key.split('_mcp_')[0];
   return raw===toolName&&entry?.type==='function'&&entry?.function?.parameters?.type==='object';
  });
  if(tools.length!==1)return null;
  return {user,config,revision:snap.publicationRevision??snap.publicationGeneration??'LIVE_MCP'};
 }
 return {
  async available(){try{return !!await checked();}catch{return false;}},
  async call(timeoutMs,cwd){
   try {
    if(cwd!==expectedCwd||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>120000)
      return {status:'UNKNOWN_OUTCOME',reason:'METRICS_REQUEST_INVALID'};
    const state=await checked();if(!state)return {status:'UNKNOWN_OUTCOME',reason:'MCP_ACCESS_UNAVAILABLE'};
    const result=await manager.callTool({user:state.user,serverName,serverConfig:state.config,toolName,
     provider:'openAI',toolArguments:{cwd:expectedCwd},flowManager,options:{signal:AbortSignal.timeout(timeoutMs)}});
    if(!Array.isArray(result)||typeof result[0]!=='string'||result[0].length>32768)
      return {status:'UNKNOWN_OUTCOME',reason:'MCP_RESPONSE_UNRECOGNIZED'};
    let payload;try{payload=JSON.parse(result[0]);}catch{return {status:'UNKNOWN_OUTCOME',reason:'MCP_RESPONSE_INVALID'};}
    if(!payload||typeof payload!=='object'||Array.isArray(payload)||payload.status!=='READ_OK')
      return {status:'UNKNOWN_OUTCOME',reason:'MCP_RESPONSE_INVALID'};
    return {status:'OK',structuredContent:payload};
   }catch{return {status:'UNKNOWN_OUTCOME',reason:'MCP_CALL_FAILED'};}
  },
 };
}
module.exports={createNativeMcpMetricsPort};
