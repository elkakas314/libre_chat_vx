export type PurgeReason = 'LOGOUT' | 'TENANT_CHANGED' | 'ACL_REVOKED' | 'RETENTION_EXPIRED';

export interface ClientCachePolicy {
  protectedOfflinePersistence: false;
  crossTenantEnumeration: false;
  purgeOn: ReadonlySet<PurgeReason>;
}

export const CLIENT_CACHE_POLICY: ClientCachePolicy = {
  protectedOfflinePersistence:false,
  crossTenantEnumeration:false,
  purgeOn:new Set(['LOGOUT','TENANT_CHANGED','ACL_REVOKED','RETENTION_EXPIRED']),
};
