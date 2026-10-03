export type LlmModelPath =
  | 'DIRECT_PROVIDER'
  | 'LOCAL_OPENAI_COMPATIBLE'
  | 'EXTERNAL_OPENAI_COMPATIBLE_ROUTER'
  | 'MANOJOS3_MANAGED_LITELLM';

export type LlmActionPath =
  | 'NONE'
  | 'MANOJOS3_MCP';

export type LlmAdvisoryPath =
  | 'NONE'
  | 'MANOJOS3_INTERFLOW_ADVISORY';

export type LlmTopologyState =
  | 'SOURCE_SUPPORTED'
  | 'CONFIG_REQUIRED'
  | 'LIVE_UNVERIFIED'
  | 'BLOCKED_BY_SOURCE_CONFLICT';

export interface LlmTopology {
  id: string;
  label: string;
  modelPath: LlmModelPath;
  actionPath: LlmActionPath;
  advisoryPath: LlmAdvisoryPath;
  state: LlmTopologyState;
  authority: false;
  paidFallbackAllowed: false;
  notes: readonly string[];
}

export const LLM_TOPOLOGIES: readonly LlmTopology[] = [
  {
    id:'direct-provider-chat',
    label:'LibreChat direct provider',
    modelPath:'DIRECT_PROVIDER',
    actionPath:'NONE',
    advisoryPath:'NONE',
    state:'SOURCE_SUPPORTED',
    authority:false,
    paidFallbackAllowed:false,
    notes:[
      'Simple chat path. Provider/model supplies reasoning.',
      'No MANOJOS3 action plane unless MCP is added separately.',
    ],
  },
  {
    id:'local-model-plus-m3',
    label:'Local OpenAI-compatible model + MANOJOS3 MCP',
    modelPath:'LOCAL_OPENAI_COMPATIBLE',
    actionPath:'MANOJOS3_MCP',
    advisoryPath:'MANOJOS3_INTERFLOW_ADVISORY',
    state:'CONFIG_REQUIRED',
    authority:false,
    paidFallbackAllowed:false,
    notes:[
      'LibreChat may use a local OpenAI-compatible endpoint such as Ollama.',
      'MANOJOS3 remains a separate governed tool/action plane.',
    ],
  },
  {
    id:'direct-provider-plus-m3',
    label:'Direct provider model + MANOJOS3 MCP',
    modelPath:'DIRECT_PROVIDER',
    actionPath:'MANOJOS3_MCP',
    advisoryPath:'MANOJOS3_INTERFLOW_ADVISORY',
    state:'CONFIG_REQUIRED',
    authority:false,
    paidFallbackAllowed:false,
    notes:[
      'Primary model is independent from MANOJOS3.',
      'MANOJOS3 receives bounded objectives through MCP.',
    ],
  },
  {
    id:'external-router-plus-m3',
    label:'External OpenAI-compatible router + MANOJOS3 MCP',
    modelPath:'EXTERNAL_OPENAI_COMPATIBLE_ROUTER',
    actionPath:'MANOJOS3_MCP',
    advisoryPath:'MANOJOS3_INTERFLOW_ADVISORY',
    state:'CONFIG_REQUIRED',
    authority:false,
    paidFallbackAllowed:false,
    notes:[
      'LibreChat talks to one OpenAI-compatible router.',
      'Router selects models; MANOJOS3 still owns no UI authority.',
    ],
  },
  {
    id:'manojos3-router-plus-m3',
    label:'MANOJOS3-managed LiteLLM + MANOJOS3 MCP',
    modelPath:'MANOJOS3_MANAGED_LITELLM',
    actionPath:'MANOJOS3_MCP',
    advisoryPath:'MANOJOS3_INTERFLOW_ADVISORY',
    state:'BLOCKED_BY_SOURCE_CONFLICT',
    authority:false,
    paidFallbackAllowed:false,
    notes:[
      'Target architecture keeps inference and actions as separate connections.',
      'Source reports disagree about currently live verified free aliases; live readback required before promotion.',
    ],
  },
] as const;

export const DEFAULT_SOURCE_ONLY_TOPOLOGY = 'direct-provider-plus-m3' as const;

export function topologyById(id: string): LlmTopology | undefined {
  return LLM_TOPOLOGIES.find((topology) => topology.id === id);
}

export function topologyCanClaimLive(topology: LlmTopology): false {
  void topology;
  return false;
}
