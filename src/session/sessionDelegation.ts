export interface SessionDelegationInput {
  principalId: string;
  tenantId: string;
  audience: string;
  origin: string;
  csrfVerified: boolean;
  expiresAtMs: number;
}

export type SessionDelegationResult =
  | { ok: true; principalId: string; tenantId: string; audience: string }
  | { ok: false; reason: 'CSRF_INVALID' | 'SESSION_EXPIRED' | 'ORIGIN_INVALID' | 'AUDIENCE_INVALID' };

export function validateDelegatedSession(
  input: SessionDelegationInput,
  allowedOrigins: ReadonlySet<string>,
  expectedAudience: string,
  nowMs: number,
): SessionDelegationResult {
  if (!input.csrfVerified) return { ok: false, reason: 'CSRF_INVALID' };
  if (input.expiresAtMs <= nowMs) return { ok: false, reason: 'SESSION_EXPIRED' };
  if (!allowedOrigins.has(input.origin)) return { ok: false, reason: 'ORIGIN_INVALID' };
  if (input.audience !== expectedAudience) return { ok: false, reason: 'AUDIENCE_INVALID' };
  return { ok: true, principalId: input.principalId, tenantId: input.tenantId, audience: input.audience };
}
