export type ResearchPath =
  | 'TARGET_READ'
  | 'FILE_SEARCH'
  | 'WEB_SEARCH'
  | 'BROWSER_INTERACTION'
  | 'NONE';

export interface ResearchSignals {
  asksOperationalTruth?: boolean;
  asksUserDocuments?: boolean;
  asksPublicInternet?: boolean;
  interactionRequired?: boolean;
}

export function chooseResearchPath(signals:ResearchSignals):ResearchPath {
  if (signals.asksOperationalTruth) return 'TARGET_READ';
  if (signals.asksUserDocuments) return 'FILE_SEARCH';
  if (signals.asksPublicInternet && !signals.interactionRequired) return 'WEB_SEARCH';
  if (signals.asksPublicInternet && signals.interactionRequired) return 'BROWSER_INTERACTION';
  return 'NONE';
}
