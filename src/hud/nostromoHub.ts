import {
  createTentaculoHubTree,
  type HubItem,
  type HubSystem,
} from './tentaculoHud';

/** Source inventory, NOT runtime discovery and NOT a permission catalog.
 * Existing project connectors are visible as future integrations only.
 */
const sourceNodes: readonly HubItem[] = [
  {id:'nostromo',system:'NOSTROMO',kind:'SYSTEM',label:'NOSTROMO · Autónomo',
    sourceRef:'config/nostromo_autonomo.current.json',status:'SOURCE'},
  {id:'nostromo-agent',system:'NOSTROMO',kind:'AGENT',label:'Agente conversacional',
    parentId:'nostromo',sourceRef:'agents/nostromo-autonomo/agent.candidate.json',status:'SOURCE'},
  {id:'nostromo-mcp',system:'NOSTROMO',kind:'MODULE',label:'Único MCP local · stdio',
    parentId:'nostromo',sourceRef:'deployment/nostromo-mcp/server.mjs',status:'SOURCE'},
  {id:'nostromo-terminal',system:'NOSTROMO',kind:'CAPABILITY',label:'Terminal · preparar / ejecutar',
    parentId:'nostromo-mcp',sourceRef:'deployment/nostromo-mcp/policy.mjs',status:'SOURCE'},
  {id:'nostromo-chatgpt',system:'NOSTROMO',kind:'CAPABILITY',label:'ChatGPT · OAuth pendiente',
    parentId:'nostromo',sourceRef:'config/chatgpt_authorized.current.json',status:'SOURCE'},
  {id:'nostromo-router',system:'NOSTROMO',kind:'CAPABILITY',label:'Router LLM / modelo local · pendientes de canario',
    parentId:'nostromo',sourceRef:'config/model_registry.current.json',status:'SOURCE'},
  {id:'manojos',system:'MANOJOS',kind:'SYSTEM',label:'MANOJOS · futuro',
    sourceRef:'src/adapters/manojos3McpAdapter.ts',status:'SOURCE'},
  {id:'vx13',system:'VX13',kind:'SYSTEM',label:'VX13 · futuro',
    sourceRef:'src/adapters/vx13LinkReadOnlyAdapter.ts',status:'SOURCE'},
  {id:'oraculo',system:'ORACULO',kind:'SYSTEM',label:'ORÁCULO · futuro',
    sourceRef:'src/adapters/oraculoAdvisoryBridge.ts',status:'SOURCE'},
];

export interface NostromoHubSnapshot {
  readonly schema:'libre-chat-vx.nostromo-hub-source.v1';
  readonly items:readonly HubItem[];
  readonly activeSystem:'NOSTROMO';
  readonly rootSystems:readonly HubSystem[];
  readonly authority:false;
  readonly readOnly:true;
  readonly status:'SOURCE_INVENTORY_NO_RUNTIME_READBACK';
  readonly mcpInstalled:false;
  readonly chatgptConnected:false;
  readonly materialVerified:false;
}
/** Fail-closed source snapshot. No caller can pass peerVerified or LIVE flags. */
export function nostromoHubSourceSnapshot():NostromoHubSnapshot {
  const items=sourceNodes.map(item=>({...item}));
  const tree=createTentaculoHubTree(items);
  return {
    schema:'libre-chat-vx.nostromo-hub-source.v1',
    items,
    activeSystem:'NOSTROMO',
    rootSystems:tree.roots.map(item=>item.system),
    authority:false,readOnly:true,
    status:'SOURCE_INVENTORY_NO_RUNTIME_READBACK',
    mcpInstalled:false,chatgptConnected:false,materialVerified:false,
  };
}
