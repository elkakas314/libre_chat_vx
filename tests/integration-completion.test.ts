import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { projectProviderStatus } from '../src/llm/providerStatus';
import type { ProviderRoute } from '../src/llm/inferenceGateway';
import { providerStatusToHud } from '../src/cockpit/providerStatusHud';
import { TentacleHud } from '../src/ui/TentacleHud';
import {
  ReadOnlyTargetAdapter,
  type AdapterIdentity,
  type ReadRequest,
  type ReadResult,
} from '../src/adapters/targetAdapter';
import type { TargetCapabilityProjection } from '../src/core/types';
import { NostromoTargetGateway } from '../src/targets/targetGateway';
import {
  Manojos3McpTargetAdapter,
  type Manojos3McpTransport,
} from '../src/adapters/manojos3McpAdapter';
import {
  ResourceTreeController,
  type ResourceTreeSource,
} from '../src/resources/resourceTree';
import { ResourceTreeView } from '../src/ui/ResourceTreeView';
import { assessAdapterCompatibility } from '../src/compatibility/adapterCompatibility';

const route: ProviderRoute = {
  id: 'normal',
  profile: 'NORMAL',
  provider: 'provider-a',
  model: 'model-a',
  routeModel: 'dynamic/nostromo-normal',
  locality: 'REMOTE',
  capabilities: ['TEXT'],
  health: 'READY',
  quotaState: 'AVAILABLE',
  zeroCost: 'VERIFIED_ZERO_COST',
  contextWindowTokens: 128000,
  privacyAllowed: true,
  paidFallbackAllowed: false,
  observedAtMs: 1000,
  evidence: 'LIVE_READBACK',
  authority: false,
};

test('provider status is projected into HUD as a separate non-authoritative lane', () => {
  const inference = providerStatusToHud(projectProviderStatus(route, 1000));
  const html = renderToStaticMarkup(React.createElement(TentacleHud, {
    model: {
      scope: 'AUTO',
      presentation: 'OBSERVING',
      focusLabel: 'model',
      windows: [],
      evidenceFresh: false,
      inference,
      authority: false,
    },
  }));
  assert.match(html, /inference:NORMAL/);
  assert.match(html, /targetTruth:SEPARATE/);
  assert.match(html, /inferenceAuthority:false/);
});

class MockReadAdapter extends ReadOnlyTargetAdapter {
  constructor(private readonly targetId: 'MANOJOS3' | 'VX13') { super(); }
  identity(): AdapterIdentity {
    return {
      endpointId: this.targetId,
      endpointKind: 'TARGET',
      adapterId: `mock-${this.targetId.toLowerCase()}`,
      authority: false,
    };
  }
  health(): Promise<ReadResult> { return this.read({ operation: 'status' }); }
  readiness(): Promise<ReadResult> { return this.read({ operation: 'readiness' }); }
  discoverCapabilities(): Promise<TargetCapabilityProjection[]> { return Promise.resolve([]); }
  read<T = unknown>(_request: ReadRequest): Promise<ReadResult<T>> {
    return Promise.resolve({
      endpointId: this.targetId,
      status: 'OK',
      value: this.targetId as unknown as T,
      truth: {
        targetId: this.targetId,
        truthClass: 'LIVE',
        status: 'NO_VERIFICADO',
        observedAt: '2026-10-07T00:00:00Z',
        evidenceRefs: ['mock-readback'],
      },
    });
  }
}

test('target gateway fans out BOTH reads while keeping authority false', async () => {
  const gateway = new NostromoTargetGateway([
    new MockReadAdapter('MANOJOS3'),
    new MockReadAdapter('VX13'),
  ]);
  const result = await gateway.readScope('BOTH', { operation: 'status' });
  assert.equal(result.status, 'OK');
  assert.equal(result.results.length, 2);
  assert.equal(result.authority, false);
});

test('AUTO read without resolved target fails closed', async () => {
  const gateway = new NostromoTargetGateway([new MockReadAdapter('MANOJOS3')]);
  const result = await gateway.readScope('AUTO', { operation: 'status' });
  assert.equal(result.status, 'NEEDS_TARGET');
  assert.equal(result.results.length, 0);
});

test('MANOJOS3 MCP adapter exposes read path but material path stays unconfigured', async () => {
  const transport: Manojos3McpTransport = {
    status: async () => ({
      status: 'OK',
      observedAt: '2026-10-07T00:00:00Z',
      value: { ready: true },
      evidenceRefs: ['m3-status'],
    }),
    capabilities: async () => ({
      status: 'OK',
      observedAt: '2026-10-07T00:00:00Z',
      value: [],
      evidenceRefs: ['m3-capabilities'],
    }),
    skills: async () => ({
      status: 'OK',
      observedAt: '2026-10-07T00:00:00Z',
      value: [],
      evidenceRefs: ['m3-skills'],
    }),
  };
  const adapter = new Manojos3McpTargetAdapter(transport);
  const status = await adapter.read({ operation: 'status' });
  assert.equal(status.status, 'OK');
  const prepared = await adapter.prepareMutation({
    operationId: 'op1',
    targetId: 'MANOJOS3',
    capabilityRef: 'cap',
    operation: 'submit',
    authorizationRef: 'auth',
    expectedState: { revision: 'r1' },
    idempotencyKey: 'i1',
  });
  assert.deepEqual(prepared, { ok: false, reason: 'MATERIAL_BINDING_UNCONFIGURED' });
});

test('resource tree loads children only when the selected node is expanded', async () => {
  let childrenCalls = 0;
  const source: ResourceTreeSource = {
    sourceId: 'drive',
    authority: false,
    roots: async () => ({
      sourceId: 'drive',
      nodes: [{
        id: 'root',
        sourceId: 'drive',
        name: 'Drive',
        kind: 'ROOT',
        expandable: true,
        freshness: 'FRESH',
        provenance: ['drive'],
        allowedActions: ['OPEN'],
        authority: false,
      }],
    }),
    children: async (parentId) => {
      childrenCalls += 1;
      return {
        sourceId: 'drive',
        parentId,
        nodes: [{
          id: 'folder',
          parentId,
          sourceId: 'drive',
          name: 'VX13',
          kind: 'FOLDER',
          expandable: false,
          freshness: 'FRESH',
          provenance: ['drive'],
          allowedActions: ['OPEN'],
          authority: false,
        }],
      };
    },
  };
  const tree = new ResourceTreeController([source]);
  await tree.listRoots();
  assert.equal(childrenCalls, 0);
  const page = await tree.expand('drive', 'root');
  assert.equal(childrenCalls, 1);
  assert.equal(page.nodes[0]?.name, 'VX13');

  const html = renderToStaticMarkup(React.createElement(ResourceTreeView, {
    nodes: [
      ...(await source.roots()).nodes,
      ...page.nodes,
    ],
    expandedIds: new Set(['drive:root']),
  }));
  assert.match(html, /Drive/);
  assert.match(html, /VX13/);
});

test('adapter compatibility report fails closed on upstream drift', () => {
  const report = assessAdapterCompatibility({
    expectedUpstreamCommit: 'expected',
    observedUpstreamCommit: 'different',
    expectedBlobs: { 'Presentation.tsx': 'a' },
    observedBlobs: { 'Presentation.tsx': 'b' },
    upstreamClean: true,
    overlayManifestPresent: true,
  });
  assert.equal(report.status, 'FAIL');
  assert.equal(report.blockers.includes('UPSTREAM_COMMIT_MISMATCH'), true);
  assert.equal(report.blobAlignment, 'DRIFT');
  assert.equal(report.authority, false);
});
