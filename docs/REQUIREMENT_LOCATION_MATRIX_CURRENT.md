# REQUIREMENT → LOCATION MATRIX — CURRENT

Estado de esta matriz: `SOURCE_RECONCILED / CODE_SCAFFOLDED / RUNTIME_PENDING`.

Regla: una fila `SCAFFOLDED` significa que existe una ubicación y contrato base en este repo. No significa integración con LibreChat upstream, ejecución en host ni PASS material.

| ID | Fuente canónica | Requisito | Ubicación de implementación | Ubicación de prueba | Estado |
|---|---|---|---|---|---|
| LC-R001 | VX13 C09 / A-46 | LibreChat es Conversation/UI Plane preferente, no autoridad material | `README.md`, `docs/ARCHITECTURE.md` | `tests/REQUIREMENT_TEST_MATRIX.md#lc-r001` | DOCUMENTED |
| LC-R002 | VX13 C02 | Tentáculo Link es único frontdoor VX13 | `docs/ARCHITECTURE.md`, `src/adapters/README.md` | LC-R002 | DOCUMENTED |
| LC-R003 | VX13 causal chain | Madre conserva policy/auth/RunLedger/PowerLease/cierre | `docs/ARCHITECTURE.md` | LC-R003 | DOCUMENTED |
| LC-R004 | VX13 causal chain | Spawner/hijas conservan ejecución material | `docs/ARCHITECTURE.md` | LC-R004 | DOCUMENTED |
| LC-R005 | VX13 P6 EXTERNAL | MANOJOS3/ORÁCULO son targets/sistemas externos, no source vendorizada | `src/adapters/README.md` | LC-R005 | DOCUMENTED |
| LC-R006 | ORÁCULO contract | ORÁCULO mantiene `authority=false` | `config/targets.example.yaml` | LC-R006 | SCAFFOLDED |
| LC-R007 | A-26 shared plane | `SystemTarget={VX13,MANOJOS3,BOTH,AUTO}` como intención de conversación | `src/cockpit/systemTarget.ts` | LC-R007 | SCAFFOLDED |
| LC-R008 | A-26 | Una conversación puede proyectar varios targets sin fusionar autoridad | `src/cockpit/systemTarget.ts`, adapters | LC-R008 | SCAFFOLDED |
| LC-R009 | A-26 | `TargetOverride` READ de un turno no cambia target primario | `src/cockpit/systemTarget.ts` | LC-R009 | SCAFFOLDED |
| LC-R010 | Maestro LibreChat | Ningún click/modelo/MCP/skill/subagent/artifact concede permiso | `docs/SECURITY.md` | LC-R010 | DOCUMENTED |
| LC-R011 | A-26 FUNCTION 002 | Delegar sesión LibreChat → principal/request envelope; origin/CSRF/audience/TTL/tenant | `src/session/sessionDelegation.ts` | LC-R011 | SCAFFOLDED |
| LC-R012 | A-26 FUNCTION 006 | `CurrentFocus` no concede efectos | `src/cockpit/currentFocus.ts` | LC-R012 | SCAFFOLDED |
| LC-R013 | A-26 FUNCTION 006 | Ambigüedad de foco → `NEEDS_INPUT` | `src/cockpit/currentFocus.ts` | LC-R013 | SCAFFOLDED |
| LC-R014 | VX13 A-26 | `ContextRef` acompaña foco sin autoridad | `src/cockpit/currentFocus.ts` | LC-R014 | SCAFFOLDED |
| LC-R015 | VX13 A-26 | Mapa vivo muestra sólo participantes reales del contexto/run | `src/cockpit/currentFocus.ts` | LC-R015 | SCAFFOLDED |
| LC-R016 | VX13 A-26 | Lectura mínima prioriza intención/riesgo/evidencia/capability/UNKNOWN | `src/cockpit/truthLanes.ts` | LC-R016 | SCAFFOLDED |
| LC-R017 | VX13 A-26 | Separar CONNECTION/READINESS/WORK/EVIDENCE | `src/cockpit/truthLanes.ts` | LC-R017 | SCAFFOLDED |
| LC-R018 | VX13 A-26 | Health/socket no implica work state | `src/cockpit/truthLanes.ts` | LC-R018 | SCAFFOLDED |
| LC-R019 | A-26 HIST-LC-D1 | UiDegradationState: INTERACTIVE_FRESH/READONLY_FRESH/READONLY_STALE/CHAT_ONLY/UNAVAILABLE | `src/cockpit/uiDegradation.ts` | LC-R019 | SCAFFOLDED |
| LC-R020 | A-26 HIST-LC-D4 | Errores core se mapean a acciones UX seguras | `src/cockpit/errorPresentation.ts` | LC-R020 | SCAFFOLDED |
| LC-R021 | A-26 FUNCTION 005 | Snapshot + cursor + dedupe event_id + purge por ACL/revisión | `src/recovery/snapshotResync.ts` | LC-R021 | SCAFFOLDED |
| LC-R022 | A-26 FUNCTION 005 | Stream loss ≠ run failed | `src/recovery/snapshotResync.ts` | LC-R022 | SCAFFOLDED |
| LC-R023 | AP-028 / U19 | ProjectionBackpressure: CRITICAL_TRANSITION lossless | `src/cockpit/projectionBackpressure.ts` | LC-R023 | SCAFFOLDED |
| LC-R024 | AP-028 / U19 | STATE_LATEST y TELEMETRY_SAMPLE son coalescibles | `src/cockpit/projectionBackpressure.ts` | LC-R024 | SCAFFOLDED |
| LC-R025 | AP-032 / U23 | ViewInterest es hint efímero | `src/cockpit/viewInterest.ts` | LC-R025 | SCAFFOLDED |
| LC-R026 | AP-032 / U23 | ViewInterest nunca es ACL/PolicyDecision/PowerLease | `src/cockpit/viewInterest.ts` | LC-R026 | SCAFFOLDED |
| LC-R027 | AP-032 / U23 | CORE_MINIMUM conserva freshness/DecisionInbox/followed-run/revocations/mandatory alerts | `src/cockpit/viewInterest.ts` | LC-R027 | SCAFFOLDED |
| LC-R028 | VX13 078 | Polling 30s/2–5min está SUPERADO como baseline | `docs/ARCHITECTURE.md`, `src/resources/uiResourceBudget.ts` | LC-R028 | SCAFFOLDED |
| LC-R029 | VX13 078 | Baseline event-driven + snapshot/resync/backpressure | mismos módulos | LC-R029 | SCAFFOLDED |
| LC-R030 | VX13 078 | Polling sólo fallback bounded POR_MEDIR | `src/resources/uiResourceBudget.ts` | LC-R030 | SCAFFOLDED |
| LC-R031 | AP-027 / U18 | ControlDraft local ligado a observed_revision | `src/cockpit/controlDraft.ts` | LC-R031 | SCAFFOLDED |
| LC-R032 | AP-027 / U18 | STALE_DRAFT/ACL_REVOKED/TARGET_CHANGED bloquean Apply | `src/cockpit/controlDraft.ts` | LC-R032 | SCAFFOLDED |
| LC-R033 | AP-027 / U18 | Preview nunca es autorización | `src/cockpit/controlDraft.ts` | LC-R033 | SCAFFOLDED |
| LC-R034 | AP-027 / U18 | Crash/reload no auto-Apply | `src/cockpit/controlDraft.ts` | LC-R034 | SCAFFOLDED |
| LC-R035 | AP-029 / U20 | Renderer failure cae a generic readonly/circuit breaker local | `src/cockpit/rendererFailureIsolation.ts` | LC-R035 | SCAFFOLDED |
| LC-R036 | AP-029 / U20 | Fallo renderer no marca target físico DOWN | `src/cockpit/rendererFailureIsolation.ts` | LC-R036 | SCAFFOLDED |
| LC-R037 | AP-030 / U21 | PrivacyPresentation NORMAL/REDACT_SENSITIVE/MINIMAL | `src/cockpit/privacyPresentation.ts` | LC-R037 | SCAFFOLDED |
| LC-R038 | AP-030 / U21 | PrivacyPresentation no sustituye ACL | `src/cockpit/privacyPresentation.ts` | LC-R038 | SCAFFOLDED |
| LC-R039 | VX13 070 / U12 | TrustedSurfaceHost separado de Artifacts | `src/security/trustedSurfaceHost.ts` | LC-R039 | SCAFFOLDED |
| LC-R040 | VX13 TrustedSurfaceHost | CSP/DOM/event allowlist + anti-clickjacking + confused-deputy | `src/security/trustedSurfaceHost.ts` | LC-R040 | SCAFFOLDED |
| LC-R041 | VX13 security | Artifact/iframe/SVG/HTML/Browser DOM/Markdown no tienen tokens/event authority | `src/security/trustedSurfaceHost.ts`, `docs/SECURITY.md` | LC-R041 | SCAFFOLDED |
| LC-R042 | VX13 055 | ArtifactRef/EvidenceRef con ACL/hash/provenance/retention | `src/artifacts/artifactRef.ts` | LC-R042 | SCAFFOLDED |
| LC-R043 | VX13 033 | FilesView usa ExternalResourceRef + ACL/grant; list/search/preview/download/import/edit separados | `src/files/externalResourceRef.ts` | LC-R043 | SCAFFOLDED |
| LC-R044 | VX13 FUNCTION 011 | Browser remote DOM se trata como no confiable | `src/browser/browserView.ts` | LC-R044 | SCAFFOLDED |
| LC-R045 | VX13 FUNCTION 011 | POST timeout tras posible efecto → UNKNOWN_OUTCOME | `src/browser/browserView.ts`, recovery | LC-R045 | SCAFFOLDED |
| LC-R046 | AP-031 / U22 | PWA/SW/background nunca auto-replay MUTATE/AUTH | `src/recovery/backgroundMutationFence.ts` | LC-R046 | SCAFFOLDED |
| LC-R047 | AP-031 / U22 | Offline sólo draft local minimizado | `src/recovery/backgroundMutationFence.ts` | LC-R047 | SCAFFOLDED |
| LC-R048 | AP-031 / U22 | Reconnect exige session/ACL/target/preimage/gesture frescos | `src/recovery/backgroundMutationFence.ts` | LC-R048 | SCAFFOLDED |
| LC-R049 | VX13 security | Timeout material/possible effect → UNKNOWN_OUTCOME + readback; nunca blind retry | `src/recovery/backgroundMutationFence.ts` | LC-R049 | SCAFFOLDED |
| LC-R050 | VX13 034 | PC/móvil comparten backend/historial lógico | `src/mobile/mobileContinuity.ts` | LC-R050 | SCAFFOLDED |
| LC-R051 | VX13 035 | Remoto móvil por red privada/HTTPS fuerte; no Wi‑Fi obligatorio | `src/mobile/mobileContinuity.ts` | LC-R051 | SCAFFOLDED |
| LC-R052 | VX13 036 | Offline = STALE/read-only; no approve/mutate/falso final | `src/mobile/mobileContinuity.ts` | LC-R052 | SCAFFOLDED |
| LC-R053 | VX13 064 | Backend LibreChat PC off → móvil unavailable aunque run remoto siga | `src/mobile/mobileContinuity.ts` | LC-R053 | SCAFFOLDED |
| LC-R054 | VX13 037 | Push opaco + fresh fetch; lockscreen no autoriza | `src/notifications/pushVoice.ts` | LC-R054 | SCAFFOLDED |
| LC-R055 | VX13 038 | Voz privada: aviso mínimo; no leer secretos/proyecto por defecto | `src/notifications/pushVoice.ts` | LC-R055 | SCAFFOLDED |
| LC-R056 | VX13 039 | Voice approval DIFERIDA hasta identity/challenge anti-replay/tests | `src/notifications/pushVoice.ts` | LC-R056 | SCAFFOLDED/DEFERRED |
| LC-R057 | VX13 040 | Superficie lógica MCP “VX13” sólo con protocolo MCP real | `src/adapters/README.md` | LC-R057 | DOCUMENTED |
| LC-R058 | VX13 041 | Tool intents/inspect/work/evidence/artifact/auth vuelven por Link | `src/adapters/README.md` | LC-R058 | DOCUMENTED |
| LC-R059 | VX13 042 | ToolSearch/Skills/File/Web/HITL/sandbox/subagents son opcionales y no autoridad | `docs/SECURITY.md` | LC-R059 | DOCUMENTED |
| LC-R060 | VX13 043 | Subagents cognitivos ≠ Spawner/hijas; Agent Activity ≠ estado material | `docs/SECURITY.md` | LC-R060 | DOCUMENTED |
| LC-R061 | VX13 047 | Madre view muestra policy no secreta/plan/auth/ledger/evidence; sin writer UI | `src/cockpit/domainViews.ts` | LC-R061 | SCAFFOLDED |
| LC-R062 | VX13 048 | Switch view muestra intent/ruta/familia/readiness; sin permiso | `src/cockpit/domainViews.ts` | LC-R062 | SCAFFOLDED |
| LC-R063 | VX13 A-26 | ModuleIndex/PlanGraph/Manojos3Run/VX13DomainLenses/Audio/Browser/Build/FilesView son lazy/allowlisted | `src/cockpit/domainViews.ts` | LC-R063 | SCAFFOLDED |
| LC-R064 | VX13 061 | UI low-consumption: lazy views + batch/backpressure + no servicios vivos por UI | `src/resources/uiResourceBudget.ts` | LC-R064 | SCAFFOLDED |
| LC-R065 | VX13 073 | hidden/background suspende render/telemetry opcional, no run/service | `src/resources/uiResourceBudget.ts` | LC-R065 | SCAFFOLDED |
| LC-R066 | VX13 062 | Accesibilidad: teclado/lector/texto+color/reduced motion/touch targets | `src/cockpit/accessibility.ts` | LC-R066 | SCAFFOLDED |
| LC-R067 | VX13 A-26 | aria-live no invasivo y foco no robado | `src/cockpit/accessibility.ts` | LC-R067 | SCAFFOLDED |
| LC-R068 | VX13 HIST-LC-D3 | Atención coalescida nunca oculta DECISION_PENDING/CRITICAL/ACL_REVOKED/UNKNOWN_OUTCOME | `src/cockpit/attention.ts` | LC-R068 | SCAFFOLDED |
| LC-R069 | A-26 FUNCTION 001 | AUDIT_LOCAL_CLIENT: versión/commit/lockfiles/auth/CSP/Artifacts/voice/MCP/storage/mobile/PWA | `docs/BUILD_ORDER_CURRENT.md` | `tests/REQUIREMENT_TEST_MATRIX.md#lc-r069` | RUNTIME_PENDING |
| LC-R070 | VX13 057 | No deep fork sin inspección; preferir official slot/plugin/sidecar/patch mínimo | `docs/BUILD_ORDER_CURRENT.md` | LC-R070 | DOCUMENTED |
| LC-R071 | A-26 ClientCompatibilityInventory | Inventariar version/hooks/CSP/renderers/mobile/voice/MCP/patches/tests | `docs/BUILD_ORDER_CURRENT.md` | LC-R071 | RUNTIME_PENDING |
| LC-R072 | Maestro LibreChat | MANOJOS3 R0 antes de mutaciones | `docs/ROADMAP.md`, adapters | LC-R072 | RUNTIME_PENDING |
| LC-R073 | Maestro LibreChat | ORÁCULO R0 preferentemente mediado por MANOJOS3 | `docs/ROADMAP.md`, config | LC-R073 | RUNTIME_PENDING |
| LC-R074 | VX13 current | VX13Adapter sólo cuando exista runtime VX13 real | `src/adapters/README.md` | LC-R074 | DESIGN_ONLY |
| LC-R075 | VX13 A-26 | Una sola voz/cabina Nostromo; no selector de “operador/modo” que cambie autoridad | `src/cockpit/domainViews.ts` | LC-R075 | SCAFFOLDED |
| LC-R076 | VX13 A-26 | Dashboard↔LibreChat bidireccional mediante ContextRef/evidence, no truth propia | `src/cockpit/currentFocus.ts` | LC-R076 | SCAFFOLDED |
| LC-R077 | VX13 A-26 | Panel abierto es demand hint, nunca PowerLease/start/stop | `src/cockpit/viewInterest.ts` | LC-R077 | SCAFFOLDED |
| LC-R078 | VX13 A-26 | Cache/SW/IndexedDB son data surfaces auditables; purge en logout/tenant/ACL/revoke | `src/security/clientCachePolicy.ts` | LC-R078 | SCAFFOLDED |
| LC-R079 | VX13 A-26 | Cross-tenant refs/cursors/errors no revelan existencia | `src/security/clientCachePolicy.ts` | LC-R079 | SCAFFOLDED |
| LC-R080 | VX13 A-26 | Prioridad UI: chat/DecisionInbox/connection > evidence > timeline > media > animation | `src/resources/uiResourceBudget.ts` | LC-R080 | SCAFFOLDED |

| LC-R081 | IDEA-LC-004 / AP-011 | Shell/HUD reversible; feature flag OFF devuelve chat normal | `src/cockpit/shellFeatureFlags.ts` | LC-R081 | SCAFFOLDED |
| LC-R082 | IDEA-LC-005 / AP-011 | StatusRail muestra conexión/frescura/perfil observado sin inferir ejecución | `src/cockpit/statusRail.ts` | LC-R082 | SCAFFOLDED |
| LC-R083 | IDEA-LC-007/008 / AP-012 | Tentáculo IDLE/OBSERVING/WORKING/ATTENTION/BLOCKED/DONE/UNKNOWN es sólo presentación | `src/cockpit/tentaclePresentation.ts` | LC-R083 | SCAFFOLDED |
| LC-R084 | IDEA-LC-009 | Prioridad de foco: user pin > alerta crítica no invasiva > autorización > tarea > contexto > overview | `src/cockpit/focusPriority.ts` | LC-R084 | SCAFFOLDED |
| LC-R085 | IDEA-LC-011 | “Explicar” vuelve al chat con entity/evidence refs; mascota no tiene voz autónoma | `src/cockpit/readOnlyActions.ts` | LC-R085 | SCAFFOLDED |
| LC-R086 | IDEA-LC-012 | DecisionInbox accesible aunque HUD/mascota esté oculta | `src/cockpit/statusRail.ts` | LC-R086 | SCAFFOLDED |
| LC-R087 | IDEA-LC-014 | ArtifactDock: abrir/fijar/comparar/timeline/export bajo ACL | `src/cockpit/artifactDock.ts` | LC-R087 | SCAFFOLDED |
| LC-R088 | IDEA-LC-015 | UI manifest-driven con view_kinds y renderers allowlisted; no JS arbitrario de módulo | `src/cockpit/rendererManifest.ts` | LC-R088 | SCAFFOLDED |
| LC-R089 | IDEA-LC-021 | UiAction es intención; actor/scopes/risk/verification vienen del backend/owner | `src/cockpit/actionLifecycle.ts` | LC-R089 | SCAFFOLDED |
| LC-R090 | IDEA-LC-024 | Ciclo visual decisión→queue→run→receipt→verify; click nunca equivale a DONE | `src/cockpit/actionLifecycle.ts` | LC-R090 | SCAFFOLDED |
| LC-R091 | IDEA-LC-025 | Slider/knob PREVIEW local; “Aplicar” crea request gobernada | `src/cockpit/actionLifecycle.ts` | LC-R091 | SCAFFOLDED |
| LC-R092 | IDEA-LC-026 | Microautorización continua rango/rate/TTL/revocación queda DIFERIDA | `src/audio/audioPanel.ts` | LC-R092 | DEFERRED |
| LC-R093 | IDEA-LC-027 | SHUB AudioPanel proyecta proyecto/pista/plugin/parámetro/version/unidad/readback/A-B | `src/audio/audioPanel.ts` | LC-R093 | SCAFFOLDED |
| LC-R094 | IDEA-LC-031 | BuildPanel distingue plan/package externo/artifact/tests declarados vs reproducidos/integración material | `src/build/buildPanel.ts` | LC-R094 | SCAFFOLDED |
| LC-R095 | IDEA-LC-032 | MANOJOS3 externo nunca aparece como hija ni run interno VX13 | `src/build/buildPanel.ts` | LC-R095 | SCAFFOLDED |
| LC-R096 | IDEA-LC-067 | Dismiss local no resuelve incidente, cancela run ni rechaza autorización | `src/cockpit/readOnlyActions.ts` | LC-R096 | SCAFFOLDED |
| LC-R097 | IDEA-LC-068 | Foco/visualización no envía conversación/Artifacts a modelos/proveedores por sí sola | `src/security/egressPolicy.ts` | LC-R097 | SCAFFOLDED |
| LC-R098 | IDEA-LC-080 / AP-026 | Continuidad referencial “eso” = última entidad/ref enfocada con TTL/ACL/provenance y desambiguación | `src/cockpit/referentialContinuity.ts` | LC-R098 | SCAFFOLDED |
| LC-R099 | IDEA-LC-081 / AP-026 | Readonly actions: Explicar/Abrir evidencia/Leer último gap/Copiar contexto/Preparar auditoría | `src/cockpit/readOnlyActions.ts` | LC-R099 | SCAFFOLDED |
| LC-R100 | IDEA-LC-089 / AP-030 | Privacy redacted debe evitar fetch/prefetch cuando sea posible, no sólo ocultar CSS | `src/security/egressPolicy.ts` | LC-R100 | SCAFFOLDED |
| LC-R101 | unified-004 | SkillMirrorManifest: repo/ref/hash/mode/provenance/last-known-good; skill no concede authority | `src/contracts/skillMirror.ts` | LC-R101 | SCAFFOLDED |
| LC-R102 | unified-009 | LibreChatReadinessTruth separa configured/channel_enabled, binding_ready/callable+probe y provider_available | `src/contracts/readinessTruth.ts` | LC-R102 | SCAFFOLDED |
| LC-R103 | unified-010 | ReverseLibreChatAdapter queda DIFERIDA hasta AUDIT_LOCAL_CLIENT/API real | `src/adapters/README.md`, `docs/BUILD_ORDER_CURRENT.md` | LC-R103 | DEFERRED |
| LC-R104 | unified-012 | Browser STT/TTS primero si soporte/privacidad verificados; voice auth separada | `src/notifications/pushVoice.ts` | LC-R104 | SCAFFOLDED/DEFERRED |
| LC-R105 | ModuleVisualCard candidate | Card proyecta owner/state/code/installed/live/material/freshness/evidence/actions; nombres UI no son wire congelado | `src/cockpit/moduleVisualCard.ts` | LC-R105 | SCAFFOLDED |
| LC-R106 | §22.15 READ DISCOVERY | handshake+auth→health/readiness→catalogue filtered→compatibility→source-vs-live→UiProjection→Session/ContextRef | `src/discovery/readDiscovery.ts` | LC-R106 | SCAFFOLDED |
| LC-R107 | §22.15 CROSS-TARGET | Fanout READ explícito con timeout individual, provenance separada y resultado parcial etiquetado | `src/discovery/crossTargetRead.ts` | LC-R107 | SCAFFOLDED |
| LC-R108 | capability DISCOVERY | MANOJOS3 index/skills; VX13 futura manifest; ORÁCULO mediado; UI muestra source-vs-live | `src/discovery/readDiscovery.ts` | LC-R108 | SCAFFOLDED |
| LC-R109 | capability CONTINUITY | conversation_id LibreChat ≠ target session/controller IDs | `src/cockpit/referentialContinuity.ts` | LC-R109 | SCAFFOLDED |
| LC-R110 | capability PLAN | PlanGraph distingue PLAN_CREATED/EXECUTION_SCHEDULED/MATERIAL_VERIFIED | `src/cockpit/planGraph.ts` | LC-R110 | SCAFFOLDED |
| LC-R111 | capability PROOF | UI distingue EvidenceRef vs Receipt vs input no verificado | `src/cockpit/artifactDock.ts` | LC-R111 | SCAFFOLDED |
| LC-R112 | M3 parity | Construction/Browser/ToolBus/Repo/Host/Threads/Connectors/Model panels sólo con adapter/registry/ACL real | `src/cockpit/manojosPanels.ts` | LC-R112 | SCAFFOLDED |
| LC-R113 | ÚNICA CABINA | ActiveFlow dibuja sólo edges realmente ejecutadas, nunca blueprint/plan | `src/cockpit/activeFlow.ts` | LC-R113 | SCAFFOLDED |
| LC-R114 | Layout desktop | Chat + grafo/visor + split inspector | `src/cockpit/layoutContract.ts` | LC-R114 | SCAFFOLDED |
| LC-R115 | Layout mobile | Chat-first + status/inbox + bottom sheet por dominio; historial único y viewport privado | `src/cockpit/layoutContract.ts` | LC-R115 | SCAFFOLDED |
| LC-R116 | IDEA-LC-004 | HUD deshabilitado debe dejar conversación upstream funcional | `src/cockpit/shellFeatureFlags.ts` | LC-R116 | SCAFFOLDED |
| LC-R117 | StatusRail current | Mostrar SourceOnly vs LIVE además de connection/readiness | `src/cockpit/statusRail.ts` | LC-R117 | SCAFFOLDED |
| LC-R118 | CurrentFocus current | USER_PIN/USER_OPEN prevalecen sobre autofocus | `src/cockpit/focusPriority.ts` | LC-R118 | SCAFFOLDED |
| LC-R119 | Tool budget | Discovery diferido/filtrado; no cargar cientos de schemas MCP en prompt | `src/discovery/readDiscovery.ts` | LC-R119 | SCAFFOLDED |
| LC-R120 | A-26 security | Datos externos no confiables; Agent/Artifact/Skill/documento no emiten grants | `src/security/egressPolicy.ts`, `docs/SECURITY.md` | LC-R120 | SCAFFOLDED |
