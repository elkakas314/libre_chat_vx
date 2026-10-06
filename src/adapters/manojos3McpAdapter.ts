import type { TargetCapabilityProjection } from '../core/types';
import {
  type AdapterIdentity,
  type MutationIntent,
  type MutationSubmission,
  type ReadRequest,
  type ReadResult,
  type TargetAdapter,
  type VerificationResult,
} from './targetAdapter';

export const MANOJOS3_MCP_READ_TOOLS = {
  status: 'manojos_status',
  capabilities: 'manojos_capabilities',
  skills: 'manojos_skills',
  run: 'manojos_run',
  receipt: 'manojos_receipt',
  authorization_requirement: 'manojos_authorization_requirement',
} as const;

export type Manojos3ReadOperation = keyof typeof MANOJOS3_MCP_READ_TOOLS | 'readiness';

export interface Manojos3McpReadback<T = unknown> {
  status: 'OK' | 'STALE' | 'OFFLINE' | 'UNAVAILABLE' | 'ERROR';
  value?: T;
  observedAt: string;
  sourceRevision?: string;
  evidenceRefs?: string[];
  receiptRef?: string;
  verified?: boolean;
  error?: string;
}

export interface Manojos3McpTransport {
  status(): Promise<Manojos3McpReadback>;
  readiness?(): Promise<Manojos3McpReadback>;
  capabilities(): Promise<Manojos3McpReadback<TargetCapabilityProjection[]>>;
  skills(): Promise<Manojos3McpReadback>;
  run?(args?: Record<string, unknown>): Promise<Manojos3McpReadback>;
  receipt?(args?: Record<string, unknown>): Promise<Manojos3McpReadback>;
  authorizationRequirement?(args?: Record<string, unknown>): Promise<Manojos3McpReadback>;
  prepareMutation?(
    intent: MutationIntent,
  ): Promise<{ ok: true; intent: MutationIntent } | { ok: false; reason: string }>;
  submitMutation?(intent: MutationIntent): Promise<MutationSubmission>;
  verifyMutation?(operationId: string): Promise<VerificationResult>;
}

export class Manojos3McpTargetAdapter implements TargetAdapter {
  constructor(
    private readonly transport: Manojos3McpTransport,
    private readonly sourceRevision?: string,
  ) {}

  identity(): AdapterIdentity {
    return {
      endpointId: 'MANOJOS3',
      endpointKind: 'TARGET',
      adapterId: 'manojos3-mcp-target-adapter',
      authority: false,
      sourceRevision: this.sourceRevision,
    };
  }

  async health(): Promise<ReadResult> {
    return this.toReadResult(await this.transport.status());
  }

  async readiness(): Promise<ReadResult> {
    const result = this.transport.readiness
      ? await this.transport.readiness()
      : await this.transport.status();
    return this.toReadResult(result);
  }

  async discoverCapabilities(): Promise<TargetCapabilityProjection[]> {
    const readback = await this.transport.capabilities();
    if (readback.status !== 'OK' || !Array.isArray(readback.value)) return [];
    return readback.value.filter((item) => item.targetId === 'MANOJOS3');
  }

  async read<T = unknown>(request: ReadRequest): Promise<ReadResult<T>> {
    const operation = request.operation as Manojos3ReadOperation;
    let readback: Manojos3McpReadback<unknown>;

    switch (operation) {
      case 'status':
        readback = await this.transport.status();
        break;
      case 'readiness':
        readback = this.transport.readiness
          ? await this.transport.readiness()
          : await this.transport.status();
        break;
      case 'capabilities':
        readback = await this.transport.capabilities();
        break;
      case 'skills':
        readback = await this.transport.skills();
        break;
      case 'run':
        readback = this.transport.run
          ? await this.transport.run(request.args)
          : this.unavailable('MCP_RUN_READ_UNCONFIGURED');
        break;
      case 'receipt':
        readback = this.transport.receipt
          ? await this.transport.receipt(request.args)
          : this.unavailable('MCP_RECEIPT_READ_UNCONFIGURED');
        break;
      case 'authorization_requirement':
        readback = this.transport.authorizationRequirement
          ? await this.transport.authorizationRequirement(request.args)
          : this.unavailable('MCP_AUTH_REQUIREMENT_READ_UNCONFIGURED');
        break;
      default:
        readback = this.unavailable('MCP_READ_OPERATION_NOT_ALLOWLISTED');
    }

    return this.toReadResult(readback as Manojos3McpReadback<T>);
  }

  async prepareMutation(
    intent: MutationIntent,
  ): Promise<{ ok: true; intent: MutationIntent } | { ok: false; reason: string }> {
    if (!intent.authorizationRef) return { ok: false, reason: 'AUTHORIZATION_REQUIRED' };
    if (!intent.expectedState) return { ok: false, reason: 'EXPECTED_STATE_REQUIRED' };
    if (!intent.idempotencyKey) return { ok: false, reason: 'IDEMPOTENCY_KEY_REQUIRED' };
    if (!this.transport.prepareMutation) {
      return { ok: false, reason: 'MATERIAL_BINDING_UNCONFIGURED' };
    }
    return this.transport.prepareMutation(intent);
  }

  async submitMutation(intent: MutationIntent): Promise<MutationSubmission> {
    if (!this.transport.submitMutation) {
      return { operationId: intent.operationId, status: 'UNAVAILABLE' };
    }
    // No automatic retry here. UNKNOWN_OUTCOME is reconciled by target readback/verification.
    return this.transport.submitMutation(intent);
  }

  async verifyMutation(operationId: string): Promise<VerificationResult> {
    if (!this.transport.verifyMutation) {
      return {
        operationId,
        status: 'UNAVAILABLE',
        readbackRefs: [],
        evidenceRefs: [],
      };
    }
    return this.transport.verifyMutation(operationId);
  }

  private unavailable(reason: string): Manojos3McpReadback {
    return {
      status: 'UNAVAILABLE',
      observedAt: new Date().toISOString(),
      evidenceRefs: [],
      error: reason,
    };
  }

  private toReadResult<T>(readback: Manojos3McpReadback<T>): ReadResult<T> {
    return {
      endpointId: 'MANOJOS3',
      status: readback.status,
      value: readback.value,
      truth: {
        targetId: 'MANOJOS3',
        truthClass: readback.status === 'OK' || readback.status === 'STALE' ? 'LIVE' : 'EXTERNAL',
        status: readback.verified
          ? 'VERIFIED'
          : readback.status === 'STALE'
            ? 'STALE'
            : 'NO_VERIFICADO',
        observedAt: readback.observedAt,
        observedRevision: readback.sourceRevision,
        evidenceRefs: readback.evidenceRefs ?? [],
        receiptRef: readback.receiptRef,
        uncertaintyReason: readback.error,
      },
    };
  }
}
