# BUILD ORDER — CURRENT

## Regla
No saltar de diseño a materialidad. Cada bloque termina en CHANGE → TEST → READBACK → VERIFY.

## M0 — AUDIT_LOCAL_CLIENT
Ubicación objetivo conocida documentalmente: `/home/elkakas314/librechat`, pero el host debe demostrarla antes de usarla.

Inventariar:
- upstream/revision/lockfiles;
- docker/compose/systemd/proceso real;
- auth/OAuth/session/CSRF;
- CSP/sandbox/TrustedSurfaceHost hooks;
- Artifacts y renderers;
- MCP/tool hooks;
- storage/cache/IndexedDB/Service Worker/PWA;
- mobile/voice/push;
- custom patches/theme;
- CPU/RAM/red/disco idle y bajo uso.

Salida: `AdapterCompatibilityReport`.

## M1 — Overlay upstream
Usar el pin de `UPSTREAM.json`. Preferencia:
1. official extension/plugin slot;
2. sidecar;
3. patch mínimo y acotado;
4. deep fork sólo si evidencia demuestra necesidad.

## M2 — Session + Context
Implementar SessionDelegation, RequestEnvelope/ContextRef, TargetScope, CurrentFocus y TargetOverride READ.
AUTO/BOTH son scope de lectura/vista; una mutación exige ConcreteTargetId.

## M3 — Projection + Recovery
Snapshot/cursor/resync, truth lanes, UiDegradationState, ProjectionBackpressure, ViewInterest y UNKNOWN_OUTCOME.

## M4 — Trusted UI
ControlDraft, RendererFailureIsolation, PrivacyPresentation, TrustedSurfaceHost, ArtifactRef/EvidenceRef, FilesView y BrowserView.
Artifact/ToolApproval/MCP UI son superficies; no autoridad.

## M5 — MANOJOS3 R0
Read-only:
health/readiness/self/capability projection → one real read → readback → evidence.

No R2 antes de cerrar este bloque.

## M6 — ORÁCULO R0
Ruta preferente LibreChat → MANOJOS3 → ORÁCULO.
ORÁCULO es advisory provider, no peer material target.
Confirmar authority=false y canary fresco.

## M7 — Cockpit
StatusRail, DecisionInbox, ActiveFlow, ModuleIndex, PlanGraph, TargetRun, VX13/MANOJOS3 lenses, AudioPanel, BrowserPanel, BuildPanel, FilesView, Inspector, EvidenceViewer, ArtifactDock.

## M8 — Mobile / Voice / Push
PC/móvil mismo backend; offline stale/read-only; backend-off explicit unavailable; push opaco+fresh fetch; voice authorization sigue deshabilitado.

## M9 — Primera mutación gobernada
Una sola acción R2 mínima sobre un ConcreteTargetId.
Exigir authorization_ref + capability_ref + expected_state + idempotency/fence + readback + verifier + receipt.

## M10 — Low-power y recovery
Medir Lenovo. No declarar bajo consumo por diseño: medir idle, vista activa, stream, reconnect y operación R0/R2.
