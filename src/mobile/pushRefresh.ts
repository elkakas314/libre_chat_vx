export interface OpaquePushReference {
  opaqueRef: string;
  containsSensitivePayload: false;
  authorizes: false;
  requiresFreshFetch: true;
}

export function pushCanCarryAuthorization(): false {
  return false;
}

export function pushCanDeclareMaterialCompletion(): false {
  return false;
}

// Push tells the client that fresh state exists.
// The client fetches current authenticated/ACL-governed state before presenting details.
