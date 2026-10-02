export type DockItemKind = 'ARTIFACT' | 'EVIDENCE' | 'RECEIPT' | 'UNVERIFIED_INPUT';

export interface DockItem {
  ref: string;
  kind: DockItemKind;
  aclFresh: boolean;
  provenance?: string[];
}

export type DockOperation = 'OPEN' | 'PIN' | 'COMPARE' | 'TIMELINE' | 'EXPORT';

export function canOperate(item: DockItem, op: DockOperation): boolean {
  if (!item.aclFresh) return false;
  if (op === 'EXPORT' && item.kind === 'UNVERIFIED_INPUT') return false;
  return true;
}
