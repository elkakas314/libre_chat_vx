import type { ConcreteTargetId } from './systemTarget';

export type DecisionState = 'PENDING' | 'EXPIRED' | 'REVOKED' | 'RESOLVED';

export interface DecisionCard {
  decisionRef: string;
  authorizationAuthorityRef: string;
  targetId: ConcreteTargetId;
  capabilityRef?: string;
  expiresAtMs: number;
  state: DecisionState;
  authorizationRef?: string;
}

export function refreshExpiry(card: DecisionCard, nowMs: number): DecisionCard {
  if (card.state === 'PENDING' && card.expiresAtMs <= nowMs) {
    return { ...card, state:'EXPIRED' };
  }
  return card;
}

// DecisionInbox presents target-owner decisions.
// A rendered card is not authorization; authorizationRef only points to owner-issued state.
