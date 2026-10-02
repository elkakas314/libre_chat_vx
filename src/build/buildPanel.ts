export type BuildEvidenceLevel =
  | 'PLAN'
  | 'EXTERNAL_PACKAGE'
  | 'ARTIFACT'
  | 'TEST_DECLARED'
  | 'TEST_REPRODUCED'
  | 'MATERIAL_INTEGRATION';

export interface BuildPanelItem {
  ref: string;
  level: BuildEvidenceLevel;
  externalSystem?: 'MANOJOS3';
}

export function isInternalVx13Run(item: BuildPanelItem): boolean {
  return item.externalSystem !== 'MANOJOS3';
}
