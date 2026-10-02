import type { CrossTargetTruthEnvelope, TargetCapabilityProjection } from '../core/types';
import type { ConcreteTargetId } from '../cockpit/systemTarget';

export type TargetId = ConcreteTargetId;
export type AdvisoryProviderId = 'ORACULO';
export type EndpointId = TargetId | AdvisoryProviderId;

export interface AdapterIdentity {
  endpointId: EndpointId;
  endpointKind: 'TARGET' | 'ADVISORY';
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
  endpointId: EndpointId;
  status: 'OK' | 'STALE' | 'OFFLINE' | 'UNAVAILABLE' | 'ERROR';
  value?: T;
  truth: CrossTargetTruthEnvelope;
}

export interface MutationIntent {
  operationId: string;
  targetId: TargetId;
  capabilityRef: string;
  operation: string;
  args?: Record<string, unknown>;
  expectedState?: Record<string, unknown>;
  authorizationRef?: string;
  idempotencyKey?: string;
}

export interface MutationSubmission {
  operationId: string;
  status: 'SUBMITTED' | 'AUTH_REQUIRED' | 'REJECTED' | 'UNAVAILABLE';
  submissionRef?: string;
}

export interface VerificationResult {
  operationId: string;
  status: 'VERIFIED' | 'FAILED' | 'UNKNOWN_OUTCOME' | 'NOT_RUN' | 'UNAVAILABLE';
  readbackRefs: string[];
  evidenceRefs: string[];
  receiptRef?: string;
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
    return {
      operationId,
      status: 'UNAVAILABLE',
      readbackRefs: [],
      evidenceRefs: [],
    };
  }
}
