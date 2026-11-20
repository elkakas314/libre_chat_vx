'use strict';

/** Adapter for the existing LibreChat MCPManager. It exposes only the local
 * read-only status tool and never accepts a server, tool name or args from a client. */
function createNativeMcpStatusPort({req, services, registry, manager, flowManager, expectedCommand}) {
  if (!req || !services || !registry || !manager || !flowManager || typeof expectedCommand !== 'string' || !expectedCommand.startsWith('/'))
    throw Error('NATIVE_MCP_DEPENDENCIES_REQUIRED');
  const serverName='nostromo-local', toolName='nostromo_estado';
  async function checked() {
    const user=req.user;
    if (!user || typeof user.id !== 'string' || !user.id || typeof user.role !== 'string' || !user.role ||
        !await services.userCanUseMCPServers(user,req)) return null;
    const servers=await services.getAccessibleMCPServers(user.id,user.role);
    const config=servers?.[serverName];
    // Block user-owned shadow servers and all remote or unexpected executables.
    if (!config || config.type !== 'stdio' || config.command !== expectedCommand ||
        !Array.isArray(config.args) || config.args.length !== 0 ||
        !await registry.isAppServerConfig(serverName,config)) return null;
    const snapshot=await manager.getServerToolFunctionsSnapshot(user.id,serverName,config);
    const entries=Object.entries(snapshot?.tools ?? {}).filter(([key,entry]) => {
      const raw=entry?.serverToolName ?? key.split('_mcp_')[0];
      return raw===toolName && entry?.type==='function' && entry?.function?.parameters?.type==='object';
    });
    if(entries.length!==1) return null;
    return {user,config,entry:entries[0][1],revision:snapshot.publicationRevision ?? snapshot.publicationGeneration ?? 'live-catalog'};
  }
  return {
    async available() {
      try { return !!await checked(); } catch { return false; }
    },
    async call(timeoutMs) {
      try {
        if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000) return {status:'UNKNOWN_OUTCOME',reason:'INVALID_TIMEOUT'};
        const state=await checked();
        if(!state)return {status:'UNKNOWN_OUTCOME',reason:'MCP_ACCESS_UNAVAILABLE'};
        const result=await manager.callTool({user:state.user,serverName,serverConfig:state.config,toolName,
          provider:'openAI',toolArguments:{},flowManager,options:{signal:AbortSignal.timeout(timeoutMs)}});
        if (!Array.isArray(result) || typeof result[0] !== 'string' || result[0].length > 32768)
          return {status:'UNKNOWN_OUTCOME',reason:'MCP_RESPONSE_UNRECOGNIZED'};
        let observation;try { observation=JSON.parse(result[0]); } catch { return {status:'UNKNOWN_OUTCOME',reason:'MCP_RESPONSE_INVALID'}; }
        if (!observation || typeof observation !== 'object' || Array.isArray(observation) ||
            observation.kind!=='nostromo.autonomous.local-mcp.v1' || typeof observation.mcpLive!=='boolean')
          return {status:'UNKNOWN_OUTCOME',reason:'MCP_RESPONSE_INVALID'};
        return {status:'OK',structuredContent:observation};
      } catch { return {status:'UNKNOWN_OUTCOME',reason:'MCP_CALL_FAILED'}; }
    },
  };
}
module.exports={createNativeMcpStatusPort};
