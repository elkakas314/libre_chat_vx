export interface CockpitShortMemory {
  lastIntent?: string;
  lastModuleRef?: string;
  lastEntityRef?: string;
  lastEvidenceRef?: string;
  lastBlocker?: string;
  lastWindow?: string;
  observedAtMs: number;
  ttlMs: number;
}

export function memoryFresh(memory: CockpitShortMemory, nowMs: number): boolean {
  return nowMs - memory.observedAtMs <= memory.ttlMs;
}

export function resolveEso(memory: CockpitShortMemory, nowMs: number): string | null {
  if (!memoryFresh(memory, nowMs)) return null;
  return memory.lastEntityRef
    ?? memory.lastModuleRef
    ?? memory.lastEvidenceRef
    ?? memory.lastWindow
    ?? null;
}
