export interface OraculoProjection {
  authority: false;
  preferredRoute: 'VIA_MANOJOS3';
  directRouteState: 'NOT_ADMITTED' | 'ADMITTED_SEPARATELY';
  inferenceState: 'NO_VERIFICADO' | 'VERIFIED';
}

export const ORACULO_DEFAULT: OraculoProjection = {
  authority:false,
  preferredRoute:'VIA_MANOJOS3',
  directRouteState:'NOT_ADMITTED',
  inferenceState:'NO_VERIFICADO',
};
