import type { LlmTopology } from './llmPlane';

export interface ModelRouteHealth {
  configured: boolean;
  reachable: boolean;
  zeroCostVerified: boolean;
  sourceConflict: boolean;
}

export type ModelRouteDecision =
  | { state:'READY'; reason:string }
  | { state:'BLOCKED'; reason:string };

export function evaluateModelRoute(
  topology: LlmTopology,
  health: ModelRouteHealth,
): ModelRouteDecision {
  if (!health.configured) return { state:'BLOCKED', reason:'CONFIG_REQUIRED' };
  if (!health.reachable) return { state:'BLOCKED', reason:'MODEL_PATH_UNREACHABLE' };
  if (health.sourceConflict) return { state:'BLOCKED', reason:'SOURCE_CONFLICT_REQUIRES_LIVE_READBACK' };
  if (!health.zeroCostVerified) return { state:'BLOCKED', reason:'ZERO_COST_NOT_VERIFIED' };
  if (topology.paidFallbackAllowed) return { state:'BLOCKED', reason:'PAID_FALLBACK_FORBIDDEN' };
  return { state:'READY', reason:'ZERO_COST_ROUTE_VERIFIED' };
}

export function mayAutoFallbackToPaid(): false {
  return false;
}

export function modelRouteGrantsTargetAuthority(): false {
  return false;
}
