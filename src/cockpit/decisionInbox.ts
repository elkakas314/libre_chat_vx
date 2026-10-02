export type DecisionState = 'PENDING' | 'EXPIRED' | 'REVOKED' | 'RESOLVED';

export interface DecisionCard {
  decisionRef: string;
  ownerRef: string;
  targetRef: string;
  expiresAtMs: number;
  state: DecisionState;
  authorityRef?: string;
}

export function refreshExpiry(card: DecisionCard, nowMs: number): DecisionCard {
  if (card.state === 'PENDING' && card.expiresAtMs <= nowMs) {
    return { ...card, state:'EXPIRED' };
  }
  return card;
}

// The inbox presents owner-issued decisions; it does not manufacture authorization.
