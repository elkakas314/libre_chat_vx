export type SharedPanelKind = 'NONE' | 'ARTIFACT' | 'SUBAGENT' | 'NOSTROMO';

export interface SharedPanelSignals {
  artifactActive: boolean;
  subagentActive: boolean;
  nostromoRequested: boolean;
}

export interface SharedPanelDecision {
  panel: SharedPanelKind;
  nostromoDeferred: boolean;
  reason: string;
}

/**
 * Preserves pinned upstream Presentation semantics:
 * artifact panel currently wins over subagent panel.
 * Nostromo is a third claimant and never steals either native active panel.
 */
export function chooseSharedPanel(signals: SharedPanelSignals): SharedPanelDecision {
  if (signals.artifactActive) {
    return {
      panel:'ARTIFACT',
      nostromoDeferred:signals.nostromoRequested,
      reason:'NATIVE_ARTIFACT_ACTIVE',
    };
  }
  if (signals.subagentActive) {
    return {
      panel:'SUBAGENT',
      nostromoDeferred:signals.nostromoRequested,
      reason:'NATIVE_SUBAGENT_ACTIVE',
    };
  }
  if (signals.nostromoRequested) {
    return {
      panel:'NOSTROMO',
      nostromoDeferred:false,
      reason:'NOSTROMO_REQUESTED_AND_NATIVE_PANEL_FREE',
    };
  }
  return { panel:'NONE', nostromoDeferred:false, reason:'NO_PANEL_REQUEST' };
}
