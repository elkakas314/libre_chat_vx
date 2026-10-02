import type { CrossTargetTruthEnvelope, TargetCapabilityProjection } from '../core/types';

export type TargetId = 'VX13' | 'MANOJOS3' | 'ORACULO';

export interface AdapterIdentity {
  targetId: TargetId;
  adapterId: string;
  authority: false;
  sourceRevision?: string;
}

export interface ReadRequest {
  operation: string;
  args?: Record<string, unknown>;
  timeoutMs?: number;
}

export interface ReadResult<T = unknown> {
  targetId: TargetId;
  status: 'OK' | 'STALE' | 'OFFLINE' | 'UNAVAILABLE' | 'ERROR';
  value?: T;
  truth: CrossTargetTruthEnvelope;
}

export interface MutationIntent {
  operationId: string;
  operation: string;
  args?: Record<string, unknown>;
  expectedState?: Record<string, unknown>;
  authorityRef?: string;
  idempotencyKey?: string;
}

export interface MutationSubmission {
  operationId: string;
  status: 'SUBMITTED' | 'AUTH_REQUIRED' | 'REJECTED' | 'UNAVAILABLE';
  receiptRef?: string;
}

export interface VerificationResult {
  operationId: string;
  status: 'VERIFIED' | 'FAILED' | 'UNKNOWN_OUTCOME';
  evidenceRefs: string[];
}

export interface TargetAdapter {
  identity(): AdapterIdentity;
  health(): Promise<ReadResult>;
  readiness(): Promise<ReadResult>;
  discoverCapabilities(): Promise<TargetCapabilityProjection[]>;
  read<T = unknown>(request: ReadRequest): Promise<ReadResult<T>>;
  prepareMutation(
    intent: MutationIntent,
  ): Promise<{ ok: true; intent: MutationIntent } | { ok: false; reason: string }>;
  submitMutation(intent: MutationIntent): Promise<MutationSubmission>;
  verifyMutation(operationId: string): Promise<VerificationResult>;
}

export abstract class ReadOnlyTargetAdapter implements TargetAdapter {
  abstract identity(): AdapterIdentity;
  abstract health(): Promise<ReadResult>;
  abstract readiness(): Promise<ReadResult>;
  abstract discoverCapabilities(): Promise<TargetCapabilityProjection[]>;
  abstract read<T = unknown>(request: ReadRequest): Promise<ReadResult<T>>;

  async prepareMutation(
    _intent: MutationIntent,
  ): Promise<{ ok: false; reason: string }> {
    return { ok: false, reason: 'READ_ONLY_ADAPTER' };
  }

  async submitMutation(intent: MutationIntent): Promise<MutationSubmission> {
    return { operationId: intent.operationId, status: 'UNAVAILABLE' };
  }

  async verifyMutation(operationId: string): Promise<VerificationResult> {
    return { operationId, status: 'FAILED', evidenceRefs: [] };
  }
}
