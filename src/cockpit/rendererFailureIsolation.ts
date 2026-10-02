export type RendererMode = 'SPECIALIZED' | 'GENERIC_READONLY' | 'CIRCUIT_OPEN';

export interface RendererHealth {
  failures: number;
  schemaValid: boolean;
  budgetExceeded: boolean;
}

export function rendererMode(h: RendererHealth): RendererMode {
  if (!h.schemaValid || h.budgetExceeded) return 'GENERIC_READONLY';
  if (h.failures >= 3) return 'CIRCUIT_OPEN';
  return 'SPECIALIZED';
}

// Renderer health is local UI state and must not be projected as target physical health.
