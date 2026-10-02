export interface FlowEdge {
  from: string;
  to: string;
  executionEvidenceRef?: string;
}

export function visibleExecutedEdges(edges: FlowEdge[]): FlowEdge[] {
  return edges.filter(e => Boolean(e.executionEvidenceRef));
}
