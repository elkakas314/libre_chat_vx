export type ResourceNodeKind =
  | 'ROOT'
  | 'FOLDER'
  | 'FILE'
  | 'PROJECT'
  | 'MODULE'
  | 'RUN'
  | 'CAPABILITY'
  | 'FLOW'
  | 'SKILL'
  | 'AGENT'
  | 'OTHER';

export type ResourceNodeAction =
  | 'OPEN'
  | 'PREVIEW'
  | 'SEARCH'
  | 'USE_AS_CONTEXT'
  | 'DOWNLOAD'
  | 'COPY_REFERENCE'
  | 'REQUEST_MUTATION';

export interface ResourceNode {
  id: string;
  parentId?: string;
  sourceId: string;
  name: string;
  kind: ResourceNodeKind;
  expandable: boolean;
  freshness: 'FRESH' | 'STALE' | 'UNKNOWN';
  provenance: readonly string[];
  allowedActions: readonly ResourceNodeAction[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
  authority: false;
}

export interface ResourcePage {
  sourceId: string;
  parentId?: string;
  nodes: readonly ResourceNode[];
  nextCursor?: string;
}

export interface ResourceTreeSource {
  sourceId: string;
  authority: false;
  roots(cursor?: string): Promise<ResourcePage>;
  children(parentId: string, cursor?: string): Promise<ResourcePage>;
}

export class ResourceTreeController {
  readonly authority = false as const;
  private readonly sources = new Map<string, ResourceTreeSource>();

  constructor(sources: readonly ResourceTreeSource[] = []) {
    for (const source of sources) this.register(source);
  }

  register(source: ResourceTreeSource): this {
    this.sources.set(source.sourceId, source);
    return this;
  }

  sourceIds(): string[] {
    return [...this.sources.keys()].sort();
  }

  async listRoots(sourceIds: readonly string[] = this.sourceIds()): Promise<ResourcePage[]> {
    return Promise.all(sourceIds.map(async (sourceId) => {
      const source = this.sources.get(sourceId);
      if (!source) {
        return { sourceId, nodes: [] };
      }
      return source.roots();
    }));
  }

  async expand(sourceId: string, parentId: string, cursor?: string): Promise<ResourcePage> {
    const source = this.sources.get(sourceId);
    if (!source) return { sourceId, parentId, nodes: [] };
    // This is the only child-loading path: no background tree crawl or eager recursion.
    return source.children(parentId, cursor);
  }
}

export function resourceNodeKey(node: Pick<ResourceNode, 'sourceId' | 'id'>): string {
  return `${node.sourceId}:${node.id}`;
}
