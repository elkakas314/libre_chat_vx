import React from 'react';
import { resourceNodeKey, type ResourceNode } from '../resources/resourceTree';

export interface ResourceTreeViewProps {
  nodes: readonly ResourceNode[];
  expandedIds?: ReadonlySet<string>;
  onToggle?: (node: ResourceNode) => void;
}

export function ResourceTreeView({
  nodes,
  expandedIds = new Set<string>(),
  onToggle,
}: ResourceTreeViewProps) {
  const byKey = new Map(nodes.map((node) => [resourceNodeKey(node), node]));
  const byParent = new Map<string, ResourceNode[]>();

  for (const node of nodes) {
    if (!node.parentId) continue;
    const parentKey = `${node.sourceId}:${node.parentId}`;
    const siblings = byParent.get(parentKey) ?? [];
    siblings.push(node);
    byParent.set(parentKey, siblings);
  }

  const roots = nodes.filter((node) => (
    !node.parentId || !byKey.has(`${node.sourceId}:${node.parentId}`)
  ));

  const renderNode = (node: ResourceNode, lineage: ReadonlySet<string>): React.ReactNode => {
    const key = resourceNodeKey(node);
    if (lineage.has(key)) {
      return <li key={key}>{node.name} · cycle blocked</li>;
    }

    const expanded = expandedIds.has(key);
    const children = byParent.get(key) ?? [];
    const nextLineage = new Set(lineage);
    nextLineage.add(key);

    return (
      <li key={key} data-resource-kind={node.kind} data-resource-source={node.sourceId}>
        {node.expandable ? (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => onToggle?.(node)}
          >
            {expanded ? '▾' : '▸'} {node.name}
          </button>
        ) : (
          <span>{node.name}</span>
        )}
        <span> · {node.kind}</span>
        <span> · {node.freshness}</span>
        {expanded && children.length > 0 ? (
          <ul>{children.map((child) => renderNode(child, nextLineage))}</ul>
        ) : null}
      </li>
    );
  };

  return (
    <section aria-label="Resource tree" data-testid="vx-resource-tree">
      <h2>Resources</h2>
      <ul>{roots.map((node) => renderNode(node, new Set<string>()))}</ul>
    </section>
  );
}
