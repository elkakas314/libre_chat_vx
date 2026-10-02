export type ToolAvailability = 'LIVE' | 'STALE' | 'UNCONFIGURED' | 'UNAVAILABLE';

export interface ToolProjection {
  targetId: string;
  toolId: string;
  risk: 'R0'|'R1'|'R2'|'R3';
  availability: ToolAvailability;
  registryBacked: boolean;
  aclAllowed: boolean;
  adapterLive: boolean;
  sourceRevision: string;
}

export function exposeTool(tool: ToolProjection): boolean {
  if (!tool.registryBacked || !tool.aclAllowed) return false;
  if (tool.risk === 'R0') return tool.availability === 'LIVE' || tool.availability === 'STALE';
  return tool.availability === 'LIVE' && tool.adapterLive;
}

export function deferBulkSchemas(): true { return true; }
