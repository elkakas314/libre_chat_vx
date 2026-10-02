# Security invariants

1. Secrets never enter repository files, UI state, receipts or logs.
2. A model, skill, tool, MCP server, UI control, color or animation never grants authority.
3. Artifacts are presentation sandbox. TrustedSurfaceHost is a separate controlled surface.
4. TrustedSurfaceHost requires schema validation, provenance, CSP/DOM/event allowlists, anti-clickjacking and confused-deputy protections.
5. Target scopes and permissions are projected from the target; LibreChat never invents them.
6. One mutating lane per target operation.
7. Timeout after a possible effect becomes UNKNOWN_OUTCOME; readback/reconcile precedes retry.
8. PWA/Service Worker/Background Sync never auto-replays UiAction, AuthorizationDecision or material mutation. Only minimized local drafts may survive offline.
9. Reconnect requires fresh identity/session/ACL/target/context/preimage/revision and a new gesture where applicable.
10. PrivacyPresentationMode (NORMAL, REDACT_SENSITIVE, MINIMAL) is display behavior, not ACL.
11. Voice and push are input/presentation only. Voice authorization remains disabled until anti-replay identity/challenge is proven.
12. Subagents and Agent Activity are cognitive/client activity, not Spawner/hijas or material execution state.
