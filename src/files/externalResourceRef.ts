export type ExternalResourceOperation =
  | 'LIST' | 'SEARCH' | 'PREVIEW' | 'DOWNLOAD' | 'IMPORT' | 'EDIT';

export interface ExternalResourceRef {
  provider: string;
  resourceId: string;
  tenantId: string;
  allowedOperations: ExternalResourceOperation[];
}

export function canUseResource(ref: ExternalResourceRef, operation: ExternalResourceOperation): boolean {
  return ref.allowedOperations.includes(operation);
}
