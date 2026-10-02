export type PrivacyPresentationMode = 'NORMAL' | 'REDACT_SENSITIVE' | 'MINIMAL';

export function safePrivacyMode(
  requested: PrivacyPresentationMode,
  classificationKnown: boolean,
): PrivacyPresentationMode {
  return classificationKnown ? requested : 'MINIMAL';
}

// Presentation mode never grants or replaces ACL.
