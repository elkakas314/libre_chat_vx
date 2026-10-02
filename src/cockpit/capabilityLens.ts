import type { Risk } from '../core/types';

export type CapabilityLens =
  | 'BROWSER'
  | 'RUNTIME'
  | 'CONNECTORS_FILES'
  | 'BUILD'
  | 'REPO'
  | 'LIBRECHAT'
  | 'MODELS'
  | 'TOOLBUS_MCP'
  | 'THREADS'
  | 'HOST'
  | 'STATE_EVIDENCE'
  | 'OTHER';

export interface CapabilityCatalogItem {
  id: string;
  category: string;
  provider?: string;
  risk: Risk;
  status: string;
  availability: string;
}

export interface CapabilityLensSummary {
  lens: CapabilityLens;
  total: number;
  available: number;
  readVerified: number;
  materialRisk: number;
}

export function lensForCategory(category: string): CapabilityLens {
  switch (category) {
    case 'browser': return 'BROWSER';
    case 'process':
    case 'observability':
    case 'system':
    case 'service': return 'RUNTIME';
    case 'connectors':
    case 'filesystem': return 'CONNECTORS_FILES';
    case 'construction':
    case 'coding': return 'BUILD';
    case 'git': return 'REPO';
    case 'librechat': return 'LIBRECHAT';
    case 'models':
    case 'external_advisory': return 'MODELS';
    case 'mcp':
    case 'mcp_toolbus':
    case 'openai_plugin': return 'TOOLBUS_MCP';
    case 'threads': return 'THREADS';
    case 'remote_desktop': return 'HOST';
    case 'state': return 'STATE_EVIDENCE';
    default: return 'OTHER';
  }
}

export function summarizeCapabilities(items: CapabilityCatalogItem[]): CapabilityLensSummary[] {
  const map = new Map<CapabilityLens, CapabilityLensSummary>();
  for (const item of items) {
    const lens = lensForCategory(item.category);
    const current = map.get(lens) ?? {
      lens,
      total: 0,
      available: 0,
      readVerified: 0,
      materialRisk: 0,
    };
    current.total += 1;
    if (item.availability === 'AVAILABLE') current.available += 1;
    if (item.status === 'READ_VERIFIED') current.readVerified += 1;
    if (item.risk === 'R2' || item.risk === 'R3') current.materialRisk += 1;
    map.set(lens, current);
  }
  return [...map.values()].sort((a, b) => a.lens.localeCompare(b.lens));
}
