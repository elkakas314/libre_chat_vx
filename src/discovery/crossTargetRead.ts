import type { CrossTargetTruthEnvelope } from '../core/types';

export interface TargetReadResult<T=unknown> {
  targetId: string;
  status: 'OK' | 'TIMEOUT' | 'OFFLINE' | 'STALE' | 'ERROR';
  value?: T;
  provenance: string[];
}

export interface CrossTargetReadResult<T=unknown> {
  partial: boolean;
  results: TargetReadResult<T>[];
}

export function combineTargetReads<T>(results: TargetReadResult<T>[]): CrossTargetReadResult<T> {
  return { partial: results.some(r=>r.status!=='OK'), results };
}

/**
 * Contract 8: wire (snake_case) -> in-process (camelCase).
 * Representation at the existing cross-target read boundary, never a truth
 * promotion: LIVE/SOURCE and evidence status are preserved exactly.
 */
export interface CrossTargetTruthWire {
  target_id: 'VX13' | 'MANOJOS3';
  truth_class: CrossTargetTruthEnvelope['truthClass'];
  status: CrossTargetTruthEnvelope['status'];
  source_ref?: string | null;
  observed_revision?: string | null;
  observed_at: string;
  fresh_until?: string | null;
  evidence_refs: string[];
  receipt_ref?: string | null;
  verification_ref?: string | null;
  uncertainty_reason?: string | null;
}

export type NormalizedCrossTargetTruthEnvelope = CrossTargetTruthEnvelope & {
  sourceRef?: string | null;
  freshUntil?: string | null;
};

const truthWireKeys = new Set([
  'target_id', 'truth_class', 'status', 'source_ref', 'observed_revision',
  'observed_at', 'fresh_until', 'evidence_refs', 'receipt_ref',
  'verification_ref', 'uncertainty_reason',
]);
function truthRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function truthNullableString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'string';
}

/** Invalid or incomplete envelopes never acquire verified status or fabricated refs. */
export function parseCrossTargetTruthWire(value: unknown): NormalizedCrossTargetTruthEnvelope | null {
  if (!truthRecord(value) || Object.keys(value).some((k) => !truthWireKeys.has(k))) {
    return null;
  }
  const x = value;
  const targetId = x.target_id, truthClass = x.truth_class, status = x.status;
  if (
    (targetId !== 'VX13' && targetId !== 'MANOJOS3') ||
    (truthClass !== 'SOURCE' && truthClass !== 'LIVE' &&
      truthClass !== 'VERIFIED' && truthClass !== 'EXTERNAL') ||
    (status !== 'VERIFIED' && status !== 'STALE' && status !== 'NO_VERIFICADO' &&
      status !== 'UNKNOWN_OUTCOME' && status !== 'RESYNC_REQUIRED') ||
    typeof x.observed_at !== 'string' ||
    !Array.isArray(x.evidence_refs) ||
    !x.evidence_refs.every((ref: unknown) => typeof ref === 'string') ||
    !truthNullableString(x.source_ref) ||
    !truthNullableString(x.fresh_until) ||
    !truthNullableString(x.observed_revision) ||
    !truthNullableString(x.receipt_ref) ||
    !truthNullableString(x.verification_ref) ||
    !truthNullableString(x.uncertainty_reason)
  ) return null;
  // Explicit null -> absent for TS optional string refs; never interpreted as evidence.
  // Wire-only source/freshness refs are preserved, including explicit null.
  return {
    targetId, truthClass, status, observedAt: x.observed_at,
    evidenceRefs: x.evidence_refs as string[],
    ...(x.source_ref !== undefined && { sourceRef: x.source_ref as string | null }),
    ...(x.fresh_until !== undefined && { freshUntil: x.fresh_until as string | null }),
    ...(typeof x.observed_revision === 'string' && { observedRevision: x.observed_revision }),
    ...(typeof x.receipt_ref === 'string' && { receiptRef: x.receipt_ref }),
    ...(typeof x.verification_ref === 'string' && { verificationRef: x.verification_ref }),
    ...(typeof x.uncertainty_reason === 'string' && { uncertaintyReason: x.uncertainty_reason }),
  };
}

/** Serialize actual producer/consumer truth, rejecting absent evidenceRefs. */
export function serializeCrossTargetTruthWire(
  value: NormalizedCrossTargetTruthEnvelope,
): CrossTargetTruthWire {
  const wire: CrossTargetTruthWire = {
    target_id: value.targetId,
    truth_class: value.truthClass,
    status: value.status,
    observed_at: value.observedAt,
    evidence_refs: value.evidenceRefs,
    ...(value.sourceRef !== undefined && { source_ref: value.sourceRef }),
    ...(value.freshUntil !== undefined && { fresh_until: value.freshUntil }),
    ...(value.observedRevision !== undefined && { observed_revision: value.observedRevision }),
    ...(value.receiptRef !== undefined && { receipt_ref: value.receiptRef }),
    ...(value.verificationRef !== undefined && { verification_ref: value.verificationRef }),
    ...(value.uncertaintyReason !== undefined && { uncertainty_reason: value.uncertaintyReason }),
  };
  if (parseCrossTargetTruthWire(wire) === null) {
    throw new TypeError('CrossTargetTruthEnvelope violates the wire contract');
  }
  return wire;
}
