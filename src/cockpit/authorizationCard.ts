import type { ConcreteTargetId } from './systemTarget';

export interface AuthorizationCard {
  decisionRef: string;
  actorRef: string;
  targetId: ConcreteTargetId;
  capabilityRef: string;
  planHash: string;
  expiresAt: string;
  expectedStateRef?: string;
  authorizationAuthorityRef: string;
  challengeRef?: string;
  authorizationRef?: string;
}

export function cardIsAuthority(_card: AuthorizationCard): false {
  return false;
}

// Card renders an authority-owner decision/challenge.
// The card itself is never the authorization authority.
