export interface SkillMirrorManifest {
  repository: string;
  ref: string;
  contentHash: string;
  mode: 'READ_ONLY' | 'MIRRORED';
  provenance: string[];
  lastKnownGoodHash?: string;
  authority: false;
}
