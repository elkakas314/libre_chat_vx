import type { ConcreteTargetId } from '../cockpit/systemTarget';

export type MutationFenceStatus =
  | 'PREPARED'
  | 'SUBMITTED'
  | 'UNKNOWN_OUTCOME'
  | 'RECONCILING'
  | 'VERIFIED'
  | 'FAILED'
  | 'CANCELLED';

export interface BackgroundMutationFence {
  operationId: string;
  targetId: ConcreteTargetId;
  capabilityRef: string;
  effectScope: string;
  authorizationRef?: string | null;
  idempotencyKey?: string | null;
  expectedState?: Record<string, unknown> | null;
  fence?: number | null;
  startedAt?: string | null;
  timeoutAt?: string | null;
  status: MutationFenceStatus;
  readbackRequired: true;
}

/**
 * Serialized form of contracts/background-mutation-fence.schema.json.
 * Snake-case only on the existing recovery boundary; never an authority.
 */
export interface BackgroundMutationFenceWire {
  operation_id: string;
  target_id: ConcreteTargetId;
  capability_ref: string;
  effect_scope: string;
  expected_state?: Record<string, unknown> | null;
  idempotency_key?: string | null;
  authority_ref?: string | null;
  fence?: number | null;
  started_at?: string | null;
  timeout_at?: string | null;
  readback_required: true;
  status: MutationFenceStatus;
}

const statuses: readonly MutationFenceStatus[] = [
  'PREPARED', 'SUBMITTED', 'UNKNOWN_OUTCOME', 'RECONCILING',
  'VERIFIED', 'FAILED', 'CANCELLED',
];
const wireKeys = new Set([
  'operation_id', 'target_id', 'capability_ref', 'effect_scope',
  'expected_state', 'idempotency_key', 'authority_ref', 'fence',
  'started_at', 'timeout_at', 'readback_required', 'status',
]);

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string';
}

/** Reject unknown fields or invalid claims instead of fabricating evidence. */
export function parseBackgroundMutationFenceWire(
  candidate: unknown,
): BackgroundMutationFence | null {
  if (!record(candidate) || Object.keys(candidate).some((key) => !wireKeys.has(key))) {
    return null;
  }
  const x = candidate;
  if (
    typeof x.operation_id !== 'string' || x.operation_id.length === 0 ||
    (x.target_id !== 'VX13' && x.target_id !== 'MANOJOS3') ||
    typeof x.capability_ref !== 'string' || x.capability_ref.length === 0 ||
    typeof x.effect_scope !== 'string' || x.effect_scope.length === 0 ||
    !statuses.includes(x.status as MutationFenceStatus) ||
    x.readback_required !== true ||
    !nullableString(x.idempotency_key) ||
    !nullableString(x.authority_ref) ||
    !nullableString(x.started_at) ||
    !nullableString(x.timeout_at) ||
    !(x.fence === undefined || x.fence === null ||
      (typeof x.fence === 'number' && Number.isInteger(x.fence) && x.fence >= 0)) ||
    !(x.expected_state === undefined || x.expected_state === null || record(x.expected_state))
  ) {
    return null;
  }
  return {
    operationId: x.operation_id,
    targetId: x.target_id,
    capabilityRef: x.capability_ref,
    effectScope: x.effect_scope,
    ...(x.idempotency_key !== undefined && { idempotencyKey: x.idempotency_key as string | null }),
    ...(x.authority_ref !== undefined && { authorizationRef: x.authority_ref as string | null }),
    ...(x.expected_state !== undefined && { expectedState: x.expected_state as Record<string, unknown> | null }),
    ...(x.fence !== undefined && { fence: x.fence as number | null }),
    ...(x.started_at !== undefined && { startedAt: x.started_at as string | null }),
    ...(x.timeout_at !== undefined && { timeoutAt: x.timeout_at as string | null }),
    status: x.status as MutationFenceStatus,
    readbackRequired: true,
  };
}

export function serializeBackgroundMutationFence(
  fence: BackgroundMutationFence,
): BackgroundMutationFenceWire {
  const wire: BackgroundMutationFenceWire = {
    operation_id: fence.operationId,
    target_id: fence.targetId,
    capability_ref: fence.capabilityRef,
    effect_scope: fence.effectScope,
    ...(fence.idempotencyKey !== undefined && { idempotency_key: fence.idempotencyKey }),
    ...(fence.authorizationRef !== undefined && { authority_ref: fence.authorizationRef }),
    ...(fence.expectedState !== undefined && { expected_state: fence.expectedState }),
    ...(fence.fence !== undefined && { fence: fence.fence }),
    ...(fence.startedAt !== undefined && { started_at: fence.startedAt }),
    ...(fence.timeoutAt !== undefined && { timeout_at: fence.timeoutAt }),
    status: fence.status,
    readback_required: fence.readbackRequired,
  };
  if (parseBackgroundMutationFenceWire(wire) === null) {
    throw new TypeError('BackgroundMutationFence violates the wire contract');
  }
  return wire;
}

export function mayReplayInBackground(): false {
  return false;
}

export function timeoutAfterPossibleEffect(fence: BackgroundMutationFence): BackgroundMutationFence {
  return { ...fence, status:'UNKNOWN_OUTCOME', readbackRequired:true };
}
