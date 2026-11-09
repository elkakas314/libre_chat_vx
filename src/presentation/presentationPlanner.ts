export type InformationShape =
  | 'PLAIN'
  | 'HIERARCHY'
  | 'TIMELINE'
  | 'COMPARISON'
  | 'RELATIONSHIPS'
  | 'STATUS'
  | 'EVIDENCE'
  | 'INTERACTIVE';

export type PresentationMode =
  | 'CHAT'
  | 'RESOURCE_TREE'
  | 'TIMELINE'
  | 'COMPARISON_TABLE'
  | 'MERMAID_DIAGRAM'
  | 'STATUS_SUMMARY'
  | 'EVIDENCE_VIEW'
  | 'INTERACTIVE_ARTIFACT';

export interface PresentationSignals {
  shape?: InformationShape;
  userAskedVisual?: boolean;
  userAskedInteractive?: boolean;
  itemCount?: number;
}

export function choosePresentationMode(signals:PresentationSignals):PresentationMode {
  if (signals.userAskedInteractive || signals.shape==='INTERACTIVE') return 'INTERACTIVE_ARTIFACT';
  switch (signals.shape) {
    case 'HIERARCHY': return 'RESOURCE_TREE';
    case 'TIMELINE': return 'TIMELINE';
    case 'COMPARISON': return 'COMPARISON_TABLE';
    case 'RELATIONSHIPS': return 'MERMAID_DIAGRAM';
    case 'STATUS': return 'STATUS_SUMMARY';
    case 'EVIDENCE': return 'EVIDENCE_VIEW';
    default:
      return signals.userAskedVisual && (signals.itemCount ?? 0) > 3
        ? 'INTERACTIVE_ARTIFACT'
        : 'CHAT';
  }
}
