export interface AccessibilityContract {
  keyboard: true;
  screenReader: true;
  textPlusColor: true;
  reducedMotion: true;
  touchTargets: true;
  ariaLive: 'POLITE_NON_INVASIVE';
  stealFocus: false;
}

export const ACCESSIBILITY_CONTRACT: AccessibilityContract = {
  keyboard:true,
  screenReader:true,
  textPlusColor:true,
  reducedMotion:true,
  touchTargets:true,
  ariaLive:'POLITE_NON_INVASIVE',
  stealFocus:false,
};
