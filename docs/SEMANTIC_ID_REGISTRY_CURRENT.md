# SEMANTIC ID REGISTRY — CURRENT

Fuente primaria: LibreChat/Tentáculo v7, document `10gIRe5KVBE3QLcIJYpPEkvaJQOBUcz0iMCID8flOZ4M`, revision `ANLCKQktb56Sr5XUT1pMUC0gmd7E0KOZLwZLkOjGTZ9JSkPXvv7Pb9uo_rImF8sUveW0xdBwv_zI83hIrVmOl-Q0JlxDfZVSsn5gfiNkvIw`.

Estado: `SOURCE_INDEXED / CODE_SCAFFOLDED / RUNTIME_NOT_VERIFIED`.

## FUNCTION-LC

| ID | Nombre/semántica fuente | Offset fuente | Ubicación canónica |
|---|---|---:|---|
| FUNCTION-LC-001 | AUDIT_LOCAL_CLIENT | 72078 | `docs/BUILD_ORDER_CURRENT.md`; `src/compat/adapterCompatibility.ts` |
| FUNCTION-LC-002 | SESSION_DELEGATION | 72115 | `src/session/sessionDelegation.ts` |
| FUNCTION-LC-003 | CONVERSE_C0 | 72152 | `src/conversation/conversationPlane.ts` |
| FUNCTION-LC-004 | NEGOTIATE_VIEW_AND_RENDER | 72182 | `src/cockpit/rendererManifest.ts`; `src/cockpit/domainViews.ts` |
| FUNCTION-LC-005 | SNAPSHOT_RESYNC | 72226 | `src/recovery/snapshotResync.ts` |
| FUNCTION-LC-006 | FOCUS_AND_EXPLAIN | 72260 | `src/cockpit/currentFocus.ts`; `src/cockpit/readOnlyActions.ts` |
| FUNCTION-LC-007 | DECISION_INBOX_AND_RESPOND | 72296 | `src/cockpit/decisionInbox.ts`; `src/cockpit/actionLifecycle.ts` |
| FUNCTION-LC-008 | PREVIEW_COMMIT_CONTROL | 72341 | `src/cockpit/controlDraft.ts`; `src/cockpit/actionLifecycle.ts` |
| FUNCTION-LC-009 | ARTIFACT_EVIDENCE_VIEW | 72966 | `src/cockpit/artifactDock.ts`; `src/artifacts/artifactRef.ts` |
| FUNCTION-LC-010 | SHUB_AUDIO_VIEW | 73007 | `src/audio/audioPanel.ts` |
| FUNCTION-LC-011 | BROWSER_VIEW | 72382 | `src/browser/browserView.ts` |
| FUNCTION-LC-012 | BUILD_VIEW_EXTERNAL | 72413 | `src/build/buildPanel.ts` |
| FUNCTION-LC-013 | MOBILE_VOICE_CONTINUITY | 72451 | `src/mobile/mobileContinuity.ts`; `src/notifications/pushVoice.ts` |
| FUNCTION-LC-014 | LOGICAL_MCP_AND_TOOL_BRIDGE | 72493 | `src/cockpit/targetToolGate.ts`; `src/adapters/README.md` |
| FUNCTION-LC-015 | FILES_CLOUD_VIEW | 72539 | `src/files/externalResourceRef.ts` |
| FUNCTION-LC-016 | UI_DEGRADE_AND_RECOVER | 72575 | `src/cockpit/uiDegradation.ts`; `src/recovery/snapshotResync.ts`; `src/cockpit/privacyPresentation.ts` |
| FUNCTION-LC-017 | ControlDraftLifecycle | 72616 | `src/cockpit/controlDraft.ts` |
| FUNCTION-LC-018 | ProjectionBackpressure | 72684 | `src/cockpit/projectionBackpressure.ts` |
| FUNCTION-LC-019 | RendererFailureIsolation | 72752 | `src/cockpit/rendererFailureIsolation.ts` |
| FUNCTION-LC-020 | PrivacyPresentation | 72823 | `src/cockpit/privacyPresentation.ts`; `src/security/egressPolicy.ts` |
| FUNCTION-LC-021 | ClientShellUpgradeRollback | 72889 | `src/compat/adapterCompatibility.ts`; `src/cockpit/shellFeatureFlags.ts` |
| FUNCTION-LC-022 | DUAL_TARGET_BINDING | 73041 | `src/cockpit/systemTarget.ts`; `src/discovery/crossTargetRead.ts`; target adapters |
| FUNCTION-LC-023 | TARGET_CAPABILITY_PROJECTION | 73271 | `src/cockpit/targetToolGate.ts`; `contracts/target-capability-projection.schema.json`; `src/contracts/readinessTruth.ts` |
| FUNCTION-LC-024 | SKILL_MIRROR_SYNC | 73480 | `src/contracts/skillMirror.ts` |
| FUNCTION-LC-025 | FREE_COMPONENT_ADMISSION | 73665 | `src/contracts/componentAdmission.ts`; `docs/DEFERRED_COMPONENTS.md` |

## FLOW-LC

| ID | Nombre/semántica fuente | Offset | Ubicación |
|---|---|---:|---|
| FLOW-LC-001 | CHAT C0 NORMAL | 73871 | `src/conversation/conversationPlane.ts` |
| FLOW-LC-002 | INSPECT/EXPLAIN CONTEXT | 73900 | `src/cockpit/currentFocus.ts`; `src/cockpit/readOnlyActions.ts` |
| FLOW-LC-003 | GOVERNED UI EFFECT | 73938 | `src/cockpit/actionLifecycle.ts`; `src/recovery/backgroundMutationFence.ts` |
| FLOW-LC-004 | SHUB PARAMETER | 73971 | `src/audio/audioPanel.ts`; `src/cockpit/actionLifecycle.ts` |
| FLOW-LC-005 | BROWSER EFFECT | 74000 | `src/browser/browserView.ts`; `src/recovery/backgroundMutationFence.ts` |
| FLOW-LC-006 | PC↔MOBILE RECOVERY | 74029 | `src/mobile/mobileContinuity.ts`; `src/recovery/snapshotResync.ts` |
| FLOW-LC-007 | ARTIFACT/FILE ACCESS | 74062 | `src/cockpit/artifactDock.ts`; `src/files/externalResourceRef.ts` |
| FLOW-LC-008 | BUILD EXTERNAL | 74097 | `src/build/buildPanel.ts` |
| FLOW-LC-009 | CLIENT CRASH/RESTART | 74126 | `src/recovery/snapshotResync.ts`; `src/cockpit/rendererFailureIsolation.ts` |
| FLOW-LC-010 | CAPABILITY/RENDERER UPGRADE | 74161 | `src/compat/adapterCompatibility.ts`; `src/cockpit/shellFeatureFlags.ts` |
| FLOW-LC-011 | Preview conflict-safe | 74203 | `src/cockpit/controlDraft.ts`; `src/cockpit/actionLifecycle.ts`; `src/recovery/backgroundMutationFence.ts` |
| FLOW-LC-012 | Stream pressure | 74472 | `src/cockpit/projectionBackpressure.ts`; `src/recovery/snapshotResync.ts` |
| FLOW-LC-013 | Renderer crash | 74739 | `src/cockpit/rendererFailureIsolation.ts` |
| FLOW-LC-014 | Privacy display | 74892 | `src/cockpit/privacyPresentation.ts`; `src/security/egressPolicy.ts` |
| FLOW-LC-015 | Upgrade rollback | 75067 | `src/compat/adapterCompatibility.ts`; `src/cockpit/shellFeatureFlags.ts` |
| FLOW-LC-016 | PC/MÓVIL DUAL-TARGET | 75230 | `src/conversation/conversationPlane.ts`; `src/cockpit/systemTarget.ts`; `src/mobile/mobileContinuity.ts` |
| FLOW-LC-017 | CROSS_TARGET_READ | 75434 | `src/discovery/crossTargetRead.ts`; `src/cockpit/targetToolGate.ts` |
| FLOW-LC-018 | GOVERNED_INTENT MANOJOS3 | 75644 | `src/adapters/manojos3Contract.ts`; `src/cockpit/actionLifecycle.ts` |
| FLOW-LC-019 | FREE COMPONENT LIFECYCLE | 75843 | `src/contracts/componentAdmission.ts`; `docs/DEFERRED_COMPONENTS.md` |

## AUTO-LC

| ID | Semántica | Offset | Ubicación |
|---|---|---:|---|
| AUTO-LC-001 | RECONNECT_RESYNC | 76979 | `src/recovery/snapshotResync.ts`; mobile continuity |
| AUTO-LC-002 | DECISION_EXPIRY_REFRESH | 77010 | `src/cockpit/decisionInbox.ts` |
| AUTO-LC-003 | ATTENTION_AND_NOTIFICATION | 77048 | `src/cockpit/attention.ts`; `src/notifications/pushVoice.ts` |
| AUTO-LC-004 | FOCUS_DERIVATION | 77089 | `src/cockpit/focusPriority.ts`; `src/cockpit/currentFocus.ts` |
| AUTO-LC-005 | CAPABILITY_REFRESH | 77120 | `src/cockpit/targetToolGate.ts`; `src/contracts/readinessTruth.ts` |
| AUTO-LC-006 | VIEW_SUSPEND_BACKPRESSURE | 76062 | `src/cockpit/viewInterest.ts`; `src/resources/uiResourceBudget.ts` |
| AUTO-LC-007 | CACHE_REVOCATION | 77153 | `src/security/clientCachePolicy.ts` |
| AUTO-LC-008 | OPTIONAL_CLIENT_COMPACTION | 77184 | `src/conversation/clientCompaction.ts` |
| AUTO-LC-009 | UiStreamCoalescer | 76102 | `src/cockpit/projectionBackpressure.ts` |
| AUTO-LC-010 | RendererCircuitBreaker | 76354 | `src/cockpit/rendererFailureIsolation.ts` |
| AUTO-LC-011 | PrivacyNoPrefetch | 76542 | `src/cockpit/privacyPresentation.ts`; `src/security/egressPolicy.ts` |
| AUTO-LC-012 | CompatibilityCanary | 76742 | `src/compat/adapterCompatibility.ts` |
| AUTO-LC-013 | SKILL_MIRROR_REFRESH | 77225 | `src/contracts/skillMirror.ts` |
| AUTO-LC-014 | TARGET_CAPABILITY_REFRESH | 77422 | `src/cockpit/targetToolGate.ts`; `src/contracts/readinessTruth.ts` |
| AUTO-LC-015 | DEFERRED_TOOL_COMPACTION | 77609 | `src/cockpit/targetToolGate.ts`; `src/discovery/readDiscovery.ts` |
| AUTO-LC-016 | FREE_COMPONENT_UPDATE_CANARY | 77801 | `src/contracts/componentAdmission.ts`; `docs/DEFERRED_COMPONENTS.md` |

## DATA-LC

La v7 referencia DATA-LC-005…008 dentro de AP/flows; no contiene encabezado standalone equivalente al de FUNCTION/FLOW/AUTO.

| ID | Resolución | Ubicación |
|---|---|---|
| DATA-LC-005 | UiDraft efímero ligado a revision | `src/cockpit/controlDraft.ts` |
| DATA-LC-006 | estado local de renderer/breaker | `src/cockpit/rendererFailureIsolation.ts` |
| DATA-LC-007 | estado de PrivacyPresentation | `src/cockpit/privacyPresentation.ts` |
| DATA-LC-008 | quality/resource budget medido | `src/resources/uiResourceBudget.ts`; observabilidad |

## U0–U23

| U | Familia | Ubicación principal |
|---|---|---|
| U0 | chat base | `src/conversation/conversationPlane.ts` |
| U1 | Artifact/ACL | `src/cockpit/artifactDock.ts`; `src/artifacts/artifactRef.ts` |
| U2 | snapshot/cursor/resync | `src/recovery/snapshotResync.ts` |
| U3 | auth/idempotency | session + action lifecycle + mutation fence |
| U4 | SHUB preview/readback | `src/audio/audioPanel.ts` |
| U5 | browser/UNKNOWN_OUTCOME | browser + mutation fence |
| U6 | Tentáculo/focus/accessibility | tentacle/currentFocus/accessibility |
| U7 | renderer/capability | renderer manifest + target tool gate |
| U8 | domain/high-rate projection | domain views + projection backpressure |
| U9 | mobile/remote | `src/mobile/mobileContinuity.ts` |
| U10 | Build | `src/build/buildPanel.ts` |
| U11 | cache revoke | `src/security/clientCachePolicy.ts` |
| U12 | TrustedSurfaceHost | `src/security/trustedSurfaceHost.ts` |
| U13 | client compatibility | `src/compat/adapterCompatibility.ts` |
| U14 | telemetry privacy | `src/observability/clientTelemetry.ts`; egress policy |
| U15 | resource budget/suspend | `src/resources/uiResourceBudget.ts` |
| U16 | Nostromo/windows | layout/domain views/shell flags |
| U17 | referent/context | referential continuity/currentFocus |
| U18 | ControlDraft | `src/cockpit/controlDraft.ts` |
| U19 | ProjectionBackpressure | `src/cockpit/projectionBackpressure.ts` |
| U20 | RendererFailureIsolation | `src/cockpit/rendererFailureIsolation.ts` |
| U21 | PrivacyPresentation | `src/cockpit/privacyPresentation.ts` |
| U22 | BackgroundMutationFence | `src/recovery/backgroundMutationFence.ts` |
| U23 | ViewInterestNegotiation | `src/cockpit/viewInterest.ts` |

## Named contract surfaces

- UiCapabilityProjection → target capability schema + targetToolGate.
- CurrentFocus / ContextRef → currentFocus + referentialContinuity.
- UiProjection → snapshot/resync + renderer manifest.
- UiAction → ui-action schema + actionLifecycle.
- Authorization / AuthorizationCard → authorizationCard; authority stays target-owned.
- ExecutionReceipt / VerificationResult → ArtifactDock evidence typing; target adapter.
- TargetBindingRef → SystemTarget + target adapters.
- ToolCapabilityProjection → targetToolGate.
- CrossTargetTruthEnvelope → cross-target truth schema + crossTargetRead.
- SkillMirrorManifest → skillMirror.
- FreeComponentAdmission → componentAdmission.
- BackgroundMutationFence → backgroundMutationFence.
- ViewInterestProjection → viewInterest.
- ClientPrincipal / UiSnapshot → session delegation + snapshot.
- ArtifactRef / EvidenceRef → artifactRef + ArtifactDock.
- ExternalResourceRef / CloudGrantBinding → externalResourceRef.
- BrowserObservation → browserView.
- AudioObservation → audioPanel.
- BuilderSpec / ExternalArtifactRef → buildPanel.
- AdapterCompatibilityReport → adapterCompatibility.
- ModuleVisualCard → moduleVisualCard.
