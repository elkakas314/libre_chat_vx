export interface RendererManifest {
  rendererId: string;
  viewKinds: string[];
  allowlisted: boolean;
  remoteModuleCodeAllowed: false;
  fallback: 'GENERIC_READONLY';
}

export function rendererUsable(m: RendererManifest): boolean {
  return m.allowlisted && !m.remoteModuleCodeAllowed;
}
