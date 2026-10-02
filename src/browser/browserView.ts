export interface BrowserView {
  origin: string;
  url: string;
  screenshotRef?: string;
  formSummary?: string;
  remoteDomTrusted: false;
}

export type BrowserPostOutcome = 'VERIFIED' | 'FAILED' | 'UNKNOWN_OUTCOME';

export function postTimeoutOutcome(possibleEffect: boolean): BrowserPostOutcome {
  return possibleEffect ? 'UNKNOWN_OUTCOME' : 'FAILED';
}
