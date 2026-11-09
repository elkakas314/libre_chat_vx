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

// Contract 6: JSON Schema wire names are snake_case, in-process types camelCase.
// This is representation-only. The grouped MANOJOS3 MCP index is a separate ADR-09 scope.
const capabilityWireKeys = new Set([
  'target_id', 'capability_id', 'provider', 'risk', 'effect_class',
  'availability', 'policy_authority_ref', 'execution_authority_ref',
  'verification_authority_ref', 'required_scopes', 'source_revision',
  'observed_at', 'expires_at', 'evidence_refs',
]);

function capabilityRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nullableCapabilityString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string';
}

export function parseTargetCapabilityProjectionWire(
  value: unknown,
): TargetCapabilityProjection | null {
  if (!capabilityRecord(value) || Object.keys(value).some((k) => !capabilityWireKeys.has(k))) {
    return null;
  }
  const x = value;
  const targetId = x.target_id;
  const risk = x.risk;
  const effectClass = x.effect_class;
  if (
    (targetId !== 'MANOJOS3' && targetId !== 'VX13') ||
    typeof x.capability_id !== 'string' || x.capability_id.length === 0 ||
    (risk !== 'R0' && risk !== 'R1' && risk !== 'R2' && risk !== 'R3') ||
    (effectClass !== 'READ_ONLY' && effectClass !== 'EPHEMERAL' &&
      effectClass !== 'MATERIAL' && effectClass !== 'DESTRUCTIVE') ||
    typeof x.availability !== 'string' ||
    typeof x.policy_authority_ref !== 'string' || x.policy_authority_ref.length === 0 ||
    typeof x.source_revision !== 'string' || typeof x.observed_at !== 'string' ||
    !Array.isArray(x.required_scopes) ||
    !x.required_scopes.every((scope: unknown) => typeof scope === 'string') ||
    !Array.isArray(x.evidence_refs) ||
    !x.evidence_refs.every((ref: unknown) => typeof ref === 'string') ||
    !(x.provider === undefined || typeof x.provider === 'string') ||
    !nullableCapabilityString(x.execution_authority_ref) ||
    !nullableCapabilityString(x.verification_authority_ref) ||
    !nullableCapabilityString(x.expires_at)
  ) {
    return null;
  }
  // Explicit null -> absent for optional in-process authority refs (never authority creation).
  // Other wire-only optional data are retained as camelCase properties on the object.
  const projection = {
    targetId: targetId as TargetCapabilityProjection['targetId'],
    capabilityId: x.capability_id,
    ...(x.provider !== undefined && { provider: x.provider }),
    risk: risk as TargetCapabilityProjection['risk'],
    effectClass: effectClass as TargetCapabilityProjection['effectClass'],
    availability: x.availability,
    policyAuthorityRef: x.policy_authority_ref,
    ...(typeof x.execution_authority_ref === 'string' && {
      executionAuthorityRef: x.execution_authority_ref,
    }),
    ...(typeof x.verification_authority_ref === 'string' && {
      verificationAuthorityRef: x.verification_authority_ref,
    }),
    requiredScopes: x.required_scopes as string[],
    sourceRevision: x.source_revision,
    observedAt: x.observed_at,
    ...(x.expires_at !== undefined && { expiresAt: x.expires_at as string | null }),
    evidenceRefs: x.evidence_refs as string[],
  };
  return projection;
}

/** Legacy in-process values are checked against the same wire contract, not trusted blindly. */
function normalizeCapabilityProjection(value: unknown): TargetCapabilityProjection | null {
  if (!capabilityRecord(value)) return null;
  if ('target_id' in value) return parseTargetCapabilityProjectionWire(value);
  const x = value;
  return parseTargetCapabilityProjectionWire({
    target_id: x.targetId,
    capability_id: x.capabilityId,
    ...(x.provider !== undefined && { provider: x.provider }),
    risk: x.risk,
    effect_class: x.effectClass,
    availability: x.availability,
    policy_authority_ref: x.policyAuthorityRef,
    ...(x.executionAuthorityRef !== undefined && {
      execution_authority_ref: x.executionAuthorityRef,
    }),
    ...(x.verificationAuthorityRef !== undefined && {
      verification_authority_ref: x.verificationAuthorityRef,
    }),
    required_scopes: x.requiredScopes,
    source_revision: x.sourceRevision,
    observed_at: x.observedAt,
    ...(x.expiresAt !== undefined && { expires_at: x.expiresAt }),
    evidence_refs: x.evidenceRefs,
  });
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
    return readback.value.flatMap((value) => {
      const projection = normalizeCapabilityProjection(value);
      return projection?.targetId === 'MANOJOS3' ? [projection] : [];
    });
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
