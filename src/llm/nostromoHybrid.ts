export type HybridLane =
  | 'LOCAL_VOICE'
  | 'FREE_REASONING'
  | 'MANOJOS3_OBJECTIVE';

export type HybridRuntimeMode =
  | 'FULL'
  | 'LOCAL_ONLY'
  | 'LOCAL_PLUS_ACTIONS'
  | 'HUD_ONLY'
  | 'UNAVAILABLE';

export interface HybridRuntimeSignals {
  libreChatAvailable: boolean;
  localVoiceAvailable: boolean;
  freeReasonerAvailable: boolean;
  manojos3McpReadable: boolean;
}

export interface HybridTurnSignals {
  conversationalOnly: boolean;
  needsDeepReasoning: boolean;
  needsCoding: boolean;
  needsLongContext: boolean;
  targetActionRequested: boolean;
}

export interface NostromoHybridArchitecture {
  id: 'NOSTROMO_HYBRID';
  localVoice: {
    alias: 'nostromo-voice-local';
    sizeTarget: '1-2GB';
    lifecycle: 'LIBRECHAT_COUPLED_ON_DEMAND';
    responsibilities: readonly string[];
    forbidden: readonly string[];
  };
  freeReasoningRouter: {
    owner: 'MANOJOS3_LITELLM';
    aliases: readonly string[];
    paidFallbackAllowed: false;
    authority: false;
  };
  actionPlane: {
    owner: 'MANOJOS3_MCP';
    deploymentEnv: 'MANOJOS3_MCP_URL';
    authority: false;
  };
  authority: false;
}

export const NOSTROMO_HYBRID: NostromoHybridArchitecture = {
  id:'NOSTROMO_HYBRID',
  localVoice:{
    alias:'nostromo-voice-local',
    sizeTarget:'1-2GB',
    lifecycle:'LIBRECHAT_COUPLED_ON_DEMAND',
    responsibilities:[
      'stable personality and Spanish natural-language voice',
      'short conversational continuity and referential resolution',
      'lightweight classification and response composition',
      'render structured MANOJOS3 evidence without changing facts',
      'summarize bounded context for presentation',
    ],
    forbidden:[
      'mint target authorization',
      'invent receipts/readback',
      'replace MANOJOS3 semantic routing for material objectives',
      'rewrite immutable evidence facts',
      'auto-fallback to paid models',
    ],
  },
  freeReasoningRouter:{
    owner:'MANOJOS3_LITELLM',
    aliases:[
      'manojos-general-free',
      'manojos-reasoning-free',
      'manojos-coding-free',
      'manojos-fast-free',
      'manojos-long-context-free',
    ],
    paidFallbackAllowed:false,
    authority:false,
  },
  actionPlane:{
    owner:'MANOJOS3_MCP',
    deploymentEnv:'MANOJOS3_MCP_URL',
    authority:false,
  },
  authority:false,
};

export function deriveHybridRuntimeMode(s: HybridRuntimeSignals): HybridRuntimeMode {
  if (!s.libreChatAvailable) return 'UNAVAILABLE';
  if (!s.localVoiceAvailable && s.manojos3McpReadable) return 'HUD_ONLY';
  if (!s.localVoiceAvailable) return 'UNAVAILABLE';
  if (s.freeReasonerAvailable && s.manojos3McpReadable) return 'FULL';
  if (s.manojos3McpReadable) return 'LOCAL_PLUS_ACTIONS';
  return 'LOCAL_ONLY';
}

export function chooseHybridLane(s: HybridTurnSignals): HybridLane {
  if (s.targetActionRequested) return 'MANOJOS3_OBJECTIVE';
  if (s.needsDeepReasoning || s.needsCoding || s.needsLongContext) return 'FREE_REASONING';
  return 'LOCAL_VOICE';
}

export function tentacleHudDependsOnLocalVoice(): false {
  return false;
}

export function tentacleHudDependsOnReasoningRouter(): false {
  return false;
}
