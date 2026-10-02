export type {
  Risk,
  TruthStatus,
  TargetCapabilityProjection,
  CrossTargetTruthEnvelope,
} from './core/types';

export type {
  TargetId,
  AdapterIdentity,
  ReadRequest,
  ReadResult,
  MutationIntent,
  MutationSubmission,
  VerificationResult,
  TargetAdapter,
} from './adapters/targetAdapter';
export { ReadOnlyTargetAdapter } from './adapters/targetAdapter';

export { emptyCockpitState } from './runtime/cockpitState';
export type { CockpitState, TargetRuntimeState } from './runtime/cockpitState';
export { CockpitReducer } from './runtime/eventReducer';
export type { CockpitEvent } from './runtime/eventReducer';

export { resolveFocus, participantsForFocus } from './cockpit/currentFocus';
export type { CurrentFocus as CockpitCurrentFocus, FocusResolution } from './cockpit/currentFocus';
export { effectiveReadTarget, clearOneTurnOverride } from './cockpit/systemTarget';
export type { SystemTarget, TargetSelection } from './cockpit/systemTarget';
export { resolveUiDegradation } from './cockpit/uiDegradation';
export type { UiDegradationState, UiSignals } from './cockpit/uiDegradation';
export { canCoalesceAttention } from './cockpit/attention';
export { mayReplayInBackground, timeoutAfterPossibleEffect } from './recovery/backgroundMutationFence';
export { postTimeoutOutcome } from './browser/browserView';
export { exposeTool, deferBulkSchemas } from './cockpit/targetToolGate';
export { materiallyReady } from './contracts/readinessTruth';
export { combineTargetReads } from './discovery/crossTargetRead';
export { EventDeduper, requiresResync } from './recovery/snapshotResync';
export { rendererMode } from './cockpit/rendererFailureIsolation';
export { canUseResource } from './files/externalResourceRef';
export { mobileLibreChatState } from './mobile/mobileContinuity';
export { safePrivacyMode } from './cockpit/privacyPresentation';
export { validateDraftForApply } from './cockpit/controlDraft';
export { acceptVisualAction } from './security/trustedSurfaceHost';
