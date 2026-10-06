export type Manojos3EntrypointKind =
  | 'ACTION_MCP'
  | 'INTERNAL_ADVISORY_LITELLM'
  | 'INTERNAL_ADVISORY_INTERFLOW';

export interface Manojos3Entrypoint {
  id: string;
  kind: Manojos3EntrypointKind;
  transport: string;
  sourceEndpoint?: string;
  deploymentEnv?: string;
  state: 'SOURCE_EXISTS_DEPLOYMENT_UNBOUND' | 'SOURCE_INTERNAL_ONLY';
  authority: false;
  sourcePins: readonly { path:string; blobSha:string }[];
  notes: readonly string[];
}

export const MANOJOS3_ACTION_MCP_TOOLS = [
  'manojos_gpt_migration_profile',
  'manojos_status',
  'manojos_capabilities',
  'manojos_skills',
  'manojos_attach',
  'manojos_run',
  'manojos_authorization_requirement',
  'manojos_authorization',
  'manojos_receipt',
  'manojos_submit',
  'manojos_resume',
  'manojos_advance',
  'manojos_pause',
  'manojos_cancel',
] as const;

export const MANOJOS3_ENTRYPOINTS: readonly Manojos3Entrypoint[] = [
  {
    id:'manojos3-action-mcp',
    kind:'ACTION_MCP',
    transport:'streamable-http',
    sourceEndpoint:'http://127.0.0.1:8790/mcp',
    deploymentEnv:'MANOJOS3_MCP_URL',
    state:'SOURCE_EXISTS_DEPLOYMENT_UNBOUND',
    authority:false,
    sourcePins:[
      { path:'src/manojos3/mcp_gateway.py', blobSha:'fc21e6bf46dddc500ead1224654054a77056e808' },
      { path:'docs/OPENAI_PLUGIN.md', blobSha:'9941eb55b6726012a8b87d106fa4ef07fa4c5788' },
    ],
    notes:[
      'Loopback source endpoint is not assumed reachable from a LibreChat container.',
      'MCP forwards to the existing MANOJOS3 control plane and creates no second runtime.',
      'Bootstrap with status/capabilities/skills; do not submit only to acquire context.',
    ],
  },
  {
    id:'manojos3-managed-litellm',
    kind:'INTERNAL_ADVISORY_LITELLM',
    transport:'openai-compatible-http-internal',
    sourceEndpoint:'http://127.0.0.1:4000/v1',
    state:'SOURCE_INTERNAL_ONLY',
    authority:false,
    sourcePins:[
      { path:'src/manojos3/adapters/model_router.py', blobSha:'ab3070fb47376774df56f2f11dc5305c01d5be00' },
      { path:'config/litellm.managed.yaml', blobSha:'1ae3b1f8d9ad835bf3620ae3f99d4b408c4d3f08' },
      { path:'docs/llm-router/LLM_PROVIDER_CATALOG_CURRENT.json', blobSha:'3fdbbd0ecc3751830472a353d0f6b48c7f35e44b' },
    ],
    notes:[
      'Internal MANOJOS3 inference/advisory compatibility infrastructure only.',
      'It is not the primary LibreChat/Nostromo inference gateway.',
      'Do not remove or alter it from LibreChat work; MANOJOS3 consumers are verified separately.',
    ],
  },
  {
    id:'manojos3-interflow-advisory',
    kind:'INTERNAL_ADVISORY_INTERFLOW',
    transport:'manojos3-objective',
    state:'SOURCE_INTERNAL_ONLY',
    authority:false,
    sourcePins:[
      { path:'docs/flows/LLM_MODELS_INTENT_FLOW_CURRENT.json', blobSha:'476fa840a6955084011f185322f2f83e3eb7291e' },
      { path:'src/manojos3/adapters/model_router.py', blobSha:'ab3070fb47376774df56f2f11dc5305c01d5be00' },
    ],
    notes:[
      'Inbound MCP does not expose an arbitrary capability-call tool.',
      'LibreChat should submit an objective through manojos_submit; MANOJOS3 chooses advisory Interflow internally.',
      'Advisor/OpenCode/model outputs never grant Policy/Kernel authority.',
    ],
  },
] as const;

export function entrypointById(id: string): Manojos3Entrypoint | undefined {
  return MANOJOS3_ENTRYPOINTS.find((entrypoint) => entrypoint.id === id);
}
