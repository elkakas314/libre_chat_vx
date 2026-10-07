import type { SemanticProfileId } from './inferenceGateway';

export type HybridLane =
  | 'LOCAL_VOICE'
  | 'REMOTE_INFERENCE'
  | 'TARGET_OBJECTIVE';

export type HybridRuntimeMode =
  | 'FULL'
  | 'REMOTE_ONLY'
  | 'LOCAL_ONLY'
  | 'LOCAL_PLUS_ACTIONS'
  | 'HUD_ONLY'
  | 'UNAVAILABLE';

export interface HybridRuntimeSignals {
  libreChatAvailable: boolean;
  localVoiceAvailable: boolean;
  remoteInferenceAvailable?: boolean;
  /** @deprecated Compatibility input. Interpreted as remote inference availability. */
  freeReasonerAvailable?: boolean;
  manojos3McpReadable: boolean;
}

export interface HybridTurnSignals {
  conversationalOnly: boolean;
  needsDeepReasoning: boolean;
  needsResearch?: boolean;
  needsVisualization?: boolean;
  needsLongContext: boolean;
  targetActionRequested: boolean;
  preferLocalVoice?: boolean;
}

export interface NostromoHybridArchitecture {
  id: 'NOSTROMO_HYBRID';
  localVoice: {
    alias: 'nostromo-voice-local';
    sizeTarget: '1-2GB';
    lifecycle: 'OPTIONAL_ON_DEMAND';
    required: false;
    responsibilities: readonly string[];
    forbidden: readonly string[];
  };
  primaryInferenceGateway: {
    owner: 'CLOUDFLARE_AI_GATEWAY';
    semanticProfiles: readonly SemanticProfileId[];
    localModelRequired: false;
    paidFallbackAllowed: false;
    authority: false;
  };
  freeReasoningRouter: {
    owner: 'CLOUDFLARE_AI_GATEWAY';
    aliases: readonly string[];
    paidFallbackAllowed: false;
    authority: false;
  };
  manojos3LiteLlm: {
    role: 'INTERNAL_ADVISORY_COMPATIBILITY';
    primaryForLibreChat: false;
    authority: false;
  };
  actionPlane: {
    owner: 'TARGET_GATEWAY';
    deploymentEnv: 'DEPLOYMENT_SPECIFIC';
    authority: false;
  };
  authority: false;
}

export const NOSTROMO_HYBRID: NostromoHybridArchitecture = {
  id:'NOSTROMO_HYBRID',
  localVoice:{
    alias:'nostromo-voice-local',
    sizeTarget:'1-2GB',
    lifecycle:'OPTIONAL_ON_DEMAND',
    required:false,
    responsibilities:[
      'optional low-cost/local conversational route when explicitly enabled',
      'short conversational continuity and referential resolution',
      'lightweight intent classification and response composition when capable',
      'render structured target evidence without changing facts',
    ],
    forbidden:[
      'be required for LibreChat availability',
      'mint target authorization',
      'invent receipts/readback',
      'replace target semantic routing for material objectives',
      'rewrite immutable evidence facts',
      'auto-fallback to paid models',
    ],
  },
  primaryInferenceGateway:{
    owner:'CLOUDFLARE_AI_GATEWAY',
    semanticProfiles:['RAPIDO','NORMAL','PENSAR','INVESTIGAR','VISUALIZAR','CONTEXTO_LARGO','VISION'],
    localModelRequired:false,
    paidFallbackAllowed:false,
    authority:false,
  },
  freeReasoningRouter:{
    owner:'CLOUDFLARE_AI_GATEWAY',
    aliases:[
      'dynamic/nostromo-rapido',
      'dynamic/nostromo-normal',
      'dynamic/nostromo-pensar',
      'dynamic/nostromo-investigar',
      'dynamic/nostromo-visualizar',
      'dynamic/nostromo-contexto-largo',
      'dynamic/nostromo-vision',
    ],
    paidFallbackAllowed:false,
    authority:false,
  },
  manojos3LiteLlm:{
    role:'INTERNAL_ADVISORY_COMPATIBILITY',
    primaryForLibreChat:false,
    authority:false,
  },
  actionPlane:{
    owner:'TARGET_GATEWAY',
    deploymentEnv:'DEPLOYMENT_SPECIFIC',
    authority:false,
  },
  authority:false,
};

export function deriveHybridRuntimeMode(s: HybridRuntimeSignals): HybridRuntimeMode {
  if (!s.libreChatAvailable) return 'UNAVAILABLE';
  const remote=s.remoteInferenceAvailable ?? s.freeReasonerAvailable ?? false;
  if (remote && s.manojos3McpReadable) return 'FULL';
  if (remote) return 'REMOTE_ONLY';
  if (s.localVoiceAvailable && s.manojos3McpReadable) return 'LOCAL_PLUS_ACTIONS';
  if (s.localVoiceAvailable) return 'LOCAL_ONLY';
  if (s.manojos3McpReadable) return 'HUD_ONLY';
  return 'UNAVAILABLE';
}

export function chooseHybridLane(s: HybridTurnSignals): HybridLane {
  if (s.targetActionRequested) return 'TARGET_OBJECTIVE';
  if (s.preferLocalVoice) return 'LOCAL_VOICE';
  return 'REMOTE_INFERENCE';
}

export function localModelRequired(): false {
  return false;
}

export function tentacleHudDependsOnLocalVoice(): false {
  return false;
}

export function tentacleHudDependsOnReasoningRouter(): false {
  return false;
}
