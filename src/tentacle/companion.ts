export type TentacleCompanionCapability =
  | 'INTENT_INTERPRETATION'
  | 'READ_ONLY_SYSTEM_OBSERVATION'
  | 'PUBLIC_RESEARCH'
  | 'RESOURCE_NAVIGATION'
  | 'VISUAL_COMPOSITION'
  | 'ARTIFACT_COMPOSITION'
  | 'EVENT_TRIAGE';

export type TentacleCompanionForbidden =
  | 'MATERIAL_EXECUTION'
  | 'AUTHORIZATION_MINTING'
  | 'RECEIPT_MINTING'
  | 'ARBITRARY_NETWORK_SCAN'
  | 'SECRET_READ'
  | 'AUTOMATIC_MATERIAL_RETRY';

export interface TentacleCompanionDescriptor {
  id: 'TENTACULO_COMPANION';
  role: 'LIGHTWEIGHT_COGNITIVE_COMPANION';
  capabilities: readonly TentacleCompanionCapability[];
  forbidden: readonly TentacleCompanionForbidden[];
  mobileReachableThroughLibreChat: true;
  authority: false;
}

export const TENTACULO_COMPANION: TentacleCompanionDescriptor = {
  id:'TENTACULO_COMPANION',
  role:'LIGHTWEIGHT_COGNITIVE_COMPANION',
  capabilities:[
    'INTENT_INTERPRETATION',
    'READ_ONLY_SYSTEM_OBSERVATION',
    'PUBLIC_RESEARCH',
    'RESOURCE_NAVIGATION',
    'VISUAL_COMPOSITION',
    'ARTIFACT_COMPOSITION',
    'EVENT_TRIAGE',
  ],
  forbidden:[
    'MATERIAL_EXECUTION',
    'AUTHORIZATION_MINTING',
    'RECEIPT_MINTING',
    'ARBITRARY_NETWORK_SCAN',
    'SECRET_READ',
    'AUTOMATIC_MATERIAL_RETRY',
  ],
  mobileReachableThroughLibreChat:true,
  authority:false,
};
