# REQUIREMENT TEST MATRIX

Todos estos tests están `NOT_RUN` hasta ejecutarse en entorno real o runner configurado.

## LC-R001–R010 Authority
- confirmar que UI/tool/model nunca produce autoridad por sí solo;
- VX13 actions efectivas sólo Link→Madre;
- ORÁCULO proyectado con authority=false.

## LC-R011–R020 Session/Focus/Truth
- sesión expirada/tenant mismatch/CSRF fail-close;
- focus ambiguo → NEEDS_INPUT;
- TargetOverride READ no persiste;
- connection/readiness/work/evidence divergen correctamente;
- error mapping no sugiere retry material ciego.

## LC-R021–R030 Projection/Recovery
- duplicate event_id dedupe;
- cursor gap → RESYNC_REQUIRED;
- CRITICAL_TRANSITION nunca coalescida;
- telemetry sí coalescida;
- view closed conserva CORE_MINIMUM;
- fallback polling no despierta heavy worker.

## LC-R031–R041 Trusted UI
- stale draft no Apply;
- ACL revoke no Apply;
- renderer exception no derriba chat/DecisionInbox;
- privacy minimal no filtra datos sensibles;
- artifact/iframe no emite UiAction;
- TrustedSurfaceHost rechaza origin/action no allowlisted.

## LC-R042–R049 Artifacts/Files/Browser/Mutation fence
- artifact access revalida ACL/version/retention;
- ExternalResourceRef separa list/preview/download/edit;
- browser remote DOM untrusted;
- POST timeout material → UNKNOWN_OUTCOME;
- reconnect no reenvía mutación.

## LC-R050–R060 Mobile/Voice/Tools
- móvil offline = STALE/read-only;
- backend PC off = LibreChat unavailable;
- push no autoriza;
- voz no expone secretos;
- ambient “sí” no autoriza;
- cognitive subagent no aparece como material executor.

## LC-R061–R068 Views/Resources/Accessibility
- domain views no poseen writer;
- panel open no crea PowerLease;
- hidden/background reduce render, no cancela run;
- teclado/screen reader/text+color/reduced motion;
- critical attention no se coalescea.

## LC-R069–R080 Build/Deployment
- AdapterCompatibilityReport completo;
- no deep fork sin justificación;
- M3 R0 PASS antes de R2;
- ORÁCULO canary fresco;
- VX13 adapter permanece DESIGN_ONLY sin runtime;
- cache purge en logout/tenant/ACL revoke;
- cross-tenant non-enumerability;
- UI priority budget respetado.
