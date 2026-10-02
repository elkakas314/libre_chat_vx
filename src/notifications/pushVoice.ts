export interface PushNotification {
  opaqueRef: string;
  requiresFreshFetch: true;
  authorizes: false;
}

export interface VoicePolicy {
  privateModeDefault: true;
  readSecretsByDefault: false;
  ambientAffirmationAuthorizes: false;
  approvalCapabilityEnabled: false;
}

export const VOICE_POLICY: VoicePolicy = {
  privateModeDefault:true,
  readSecretsByDefault:false,
  ambientAffirmationAuthorizes:false,
  approvalCapabilityEnabled:false,
};
