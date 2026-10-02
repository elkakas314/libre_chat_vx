export interface AuthorizationCard {
  actorRef: string;
  targetRef: string;
  planHash: string;
  expiresAt: string;
  expectedStateRef?: string;
  authorityOwner: string;
}

export function cardIsAuthority(_card: AuthorizationCard): false {
  return false;
}

// Card renders an authority decision owned elsewhere; it does not create one.
