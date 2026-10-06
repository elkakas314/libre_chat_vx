import type {
  MutationIntent,
  MutationSubmission,
  ReadRequest,
  ReadResult,
  TargetAdapter,
  TargetId,
  VerificationResult,
} from '../adapters/targetAdapter';
import type { ConcreteTargetId, TargetScope } from '../cockpit/systemTarget';
import { isConcreteTarget } from '../cockpit/systemTarget';

export interface TargetScopeReadResult<T = unknown> {
  scope: TargetScope;
  status: 'OK' | 'PARTIAL' | 'NEEDS_TARGET';
  results: Array<{ targetId: ConcreteTargetId; result: ReadResult<T> }>;
  authority: false;
}

const TARGETS: readonly ConcreteTargetId[] = ['MANOJOS3', 'VX13'];

export class NostromoTargetGateway {
  readonly authority = false as const;
  private readonly adapters = new Map<TargetId, TargetAdapter>();

  constructor(
    adapters: readonly TargetAdapter[] = [],
    private readonly now: () => string = () => new Date().toISOString(),
  ) {
    for (const adapter of adapters) this.register(adapter);
  }

  register(adapter: TargetAdapter): this {
    const identity = adapter.identity();
    if (
      identity.endpointKind !== 'TARGET' ||
      (identity.endpointId !== 'MANOJOS3' && identity.endpointId !== 'VX13')
    ) {
      throw new Error('TARGET_ADAPTER_REQUIRED');
    }
    this.adapters.set(identity.endpointId, adapter);
    return this;
  }

  configuredTargets(): ConcreteTargetId[] {
    return TARGETS.filter((targetId) => this.adapters.has(targetId));
  }

  async read<T = unknown>(targetId: ConcreteTargetId, request: ReadRequest): Promise<ReadResult<T>> {
    const adapter = this.adapters.get(targetId);
    if (!adapter) return this.unavailableRead<T>(targetId, 'TARGET_ADAPTER_UNCONFIGURED');
    return adapter.read<T>(request);
  }

  async readScope<T = unknown>(
    scope: TargetScope,
    request: ReadRequest,
    autoTarget?: ConcreteTargetId,
  ): Promise<TargetScopeReadResult<T>> {
    if (scope === 'AUTO' && !autoTarget) {
      return { scope, status: 'NEEDS_TARGET', results: [], authority: false };
    }

    const targetIds = isConcreteTarget(scope)
      ? [scope]
      : scope === 'BOTH'
        ? [...TARGETS]
        : [autoTarget as ConcreteTargetId];

    const results = await Promise.all(
      targetIds.map(async (targetId) => ({
        targetId,
        result: await this.read<T>(targetId, request),
      })),
    );
    return {
      scope,
      status: results.every(({ result }) => result.status === 'OK') ? 'OK' : 'PARTIAL',
      results,
      authority: false,
    };
  }

  async prepareMutation(
    intent: MutationIntent,
  ): Promise<{ ok: true; intent: MutationIntent } | { ok: false; reason: string }> {
    const adapter = this.adapters.get(intent.targetId);
    if (!adapter) return { ok: false, reason: 'TARGET_ADAPTER_UNCONFIGURED' };
    return adapter.prepareMutation(intent);
  }

  async submitMutation(intent: MutationIntent): Promise<MutationSubmission> {
    const adapter = this.adapters.get(intent.targetId);
    if (!adapter) return { operationId: intent.operationId, status: 'UNAVAILABLE' };
    // Deliberately one delegation only: gateway never retries a material effect.
    return adapter.submitMutation(intent);
  }

  async verifyMutation(
    targetId: ConcreteTargetId,
    operationId: string,
  ): Promise<VerificationResult> {
    const adapter = this.adapters.get(targetId);
    if (!adapter) {
      return {
        operationId,
        status: 'UNAVAILABLE',
        readbackRefs: [],
        evidenceRefs: [],
      };
    }
    return adapter.verifyMutation(operationId);
  }

  private unavailableRead<T>(targetId: ConcreteTargetId, reason: string): ReadResult<T> {
    return {
      endpointId: targetId,
      status: 'UNAVAILABLE',
      truth: {
        targetId,
        truthClass: 'SOURCE',
        status: 'NO_VERIFICADO',
        observedAt: this.now(),
        evidenceRefs: [],
        uncertaintyReason: reason,
      },
    };
  }
}
