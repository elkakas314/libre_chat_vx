export interface UiResourceBudget {
  updateMode: 'EVENT_DRIVEN';
  boundedPollingFallback: true;
  heavyWorkersOnDemandOnly: true;
  suspendHiddenRender: true;
  stopRunWhenHidden: false;
}

export const UI_RESOURCE_BUDGET: UiResourceBudget = {
  updateMode:'EVENT_DRIVEN',
  boundedPollingFallback:true,
  heavyWorkersOnDemandOnly:true,
  suspendHiddenRender:true,
  stopRunWhenHidden:false,
};

export const UI_PRIORITY = [
  'CHAT',
  'DECISION_INBOX',
  'CONNECTION_STATE',
  'EVIDENCE_TEXT',
  'TIMELINE',
  'THUMBNAILS_WAVEFORM',
  'METERS_ANIMATION',
] as const;
