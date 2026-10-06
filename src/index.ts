export type {
  Risk,
  TruthStatus,
  TargetCapabilityProjection,
  CrossTargetTruthEnvelope,
} from './core/types';

export type {
  TargetId,
  AdvisoryProviderId,
  EndpointId,
  AdapterIdentity,
  ReadRequest,
  ReadResult,
  MutationIntent,
  MutationSubmission,
  VerificationResult,
  TargetAdapter,
} from './adapters/targetAdapter';
export { ReadOnlyTargetAdapter } from './adapters/targetAdapter';

export {
  COMMON_TARGET_GUARANTEES,
  MANOJOS3_PARITY_DESCRIPTOR,
  VX13_PARITY_DESCRIPTOR,
  MANOJOS3_LIBRECHAT_INTEGRATION,
  VX13_LIBRECHAT_INTEGRATION,
  MANOJOS3_PARITY_SOURCE,
  VX13_PARITY_SOURCE,
  reconcileTargetParity,
  parityGuaranteesAligned,
  sourceAlignment,
} from './adapters/targetParity';
export type {
  TargetParityId,
  SourceMaturity,
  AdapterImplementationState,
  BindingState,
  SourceAlignment,
  TargetAuthorityModel,
  TargetParityDescriptor,
  TargetIntegrationState,
  TargetRuntimeObservation,
  TargetParityTruth,
} from './adapters/targetParity';

export { MANOJOS3_FLOW, manojos3Parity } from './adapters/manojos3Contract';
export { VX13_ADAPTER_STATE, VX13_AUTHORITY_CHAIN, vx13Parity } from './adapters/vx13Contract';

export * from './manojos3/interflowProjection';
export * from './manojos3/entrypoints';
export * from './manojos3/submitProjection';
export * from './manojos3/gptSemanticBridge';
export * from './manojos3/hudBridge';

export * from './llm/nostromoHybrid';
export * from './llm/responseContract';
export * from './llm/inferenceGateway';
export * from './llm/cloudflareAiGateway';
export * from './llm/nostromoIdentity';
export * from './llm/structuredOutput';
export * from './llm/providerStatus';

export * from './librechat/nativeSurfaces';
export * from './librechat/nativeSurfaceBinding';
export * from './librechat/panelArbiter';
export * from './librechat/approvalBridge';
export * from './librechat/resumableBoundary';
export * from './librechat/accessComposition';

export * from './mobile/mobileContinuity';
export * from './mobile/mobileRecovery';
export * from './mobile/offlineDraft';
export * from './mobile/pushRefresh';
export * from './mobile/resumeSource';

export { emptyCockpitState } from './runtime/cockpitState';
export type { CockpitState, TargetRuntimeState } from './runtime/cockpitState';
export { CockpitReducer } from './runtime/eventReducer';
export type { CockpitEvent } from './runtime/eventReducer';

export * from './cockpit/windowRouter';
export * from './cockpit/tentacleHud';
export * from './cockpit/controlDeck';
export * from './cockpit/capabilityLens';
export * from './cockpit/targetRun';
export * from './cockpit/shortMemory';
export * from './artifacts/interactiveArtifact';

export * from './operating/types';
export * from './operating/reconcile';
export * from './operating/bootstrap';

export { resolveFocus, participantsForFocus } from './cockpit/currentFocus';
export type {
  CurrentFocus as CockpitCurrentFocus,
  FocusResolution,
  FocusSystemId,
} from './cockpit/currentFocus';

export {
  effectiveReadTarget,
  effectiveReadScope,
  resolvedMutationTarget,
  isConcreteTarget,
  clearOneTurnOverride,
} from './cockpit/systemTarget';
export type {
  ConcreteTargetId,
  TargetScope,
  SystemTarget,
  TargetSelection,
} from './cockpit/systemTarget';

export { resolveUiDegradation } from './cockpit/uiDegradation';
export type { UiDegradationState, UiSignals } from './cockpit/uiDegradation';
export { canCoalesceAttention } from './cockpit/attention';
export { mayReplayInBackground, timeoutAfterPossibleEffect } from './recovery/backgroundMutationFence';
export { postTimeoutOutcome } from './browser/browserView';
export { exposeTool, deferBulkSchemas } from './cockpit/targetToolGate';
export { providerBindingReady, materiallyReady } from './contracts/readinessTruth';
export { combineTargetReads } from './discovery/crossTargetRead';
export { EventDeduper, requiresResync } from './recovery/snapshotResync';
export { rendererMode } from './cockpit/rendererFailureIsolation';
export { canUseResource } from './files/externalResourceRef';
export { safePrivacyMode } from './cockpit/privacyPresentation';
export { validateDraftForApply } from './cockpit/controlDraft';
export { acceptVisualAction } from './security/trustedSurfaceHost';

export * from './ui';
