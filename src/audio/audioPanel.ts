export interface AudioPanelProjection {
  projectRef: string;
  trackRef?: string;
  pluginRef?: string;
  parameterRef?: string;
  parameterVersion?: string;
  unit?: string;
  observedValue?: number|string;
  abEvidenceRef?: string;
}

export const CONTINUOUS_MICROAUTH_IMPLEMENTED = false;
