# BACKLOG CRIBA — CURRENT

Status: SOURCE_REVIEW
Purpose: keep the LibreChat/NOSTROMO backlog small, separated by lifecycle and free of duplicated design work.

## Result

The runtime/core is not currently the main source of complexity. The largest complexity risks are:
1. stale operating read-models;
2. CLOSED SOURCE items still presented as gaps;
3. external MANOJOS3/VX13 work mixed into the LibreChat critical path;
4. optional components listed next to required work;
5. repeated design text across 00/10/20/30/40;
6. small overlapping Skills that can be absorbed.

## Backlog classes

### ACTIVE_LIVE — current critical path
- Cloudflare AI Gateway authenticated LIVE binding.
- zero-cost provider/account probes and 7 semantic Dynamic Route canaries.
- rollback/readback for inference routes.
- GitHub Skill Sync LIVE.
- Tailscale Serve private route + mobile/reconnect/revoke/rollback.
- native Web Research canary.
- Agent Events + Tentáculo triage + mobile notification canary.
- out-of-band recovery path.
- Lenovo low-power/resource measurement.

### TARGET_LATER — real but not current LibreChat critical path
- MANOJOS3 R0 binding/readback/receipt, only after parallel LibreChat stack is frozen.
- first governed material canary after R0.
- VX13 binding only after canonical frontdoor/runtime exists.
- ORÁCULO advisory LIVE path when admitted.

### DEFERRED_EXTERNAL — do not keep in active backlog
- MANOJOS3 transport documentation/live-profile reconciliation.
- MANOJOS3 internal LiteLLM consumer readback.
- future MANOJOS3 transport convergence.
These remain external/deferred and must not drive LibreChat SOURCE expansion.

### OPTIONAL_REENTRY — only with measured reason
- Router Steward.
- Tailscale Services.
- Cloudflare Tunnel + Access public route.
- AI Gateway behind Access/custom domain.
- SearXNG.
- Firecrawl.
- reranker.
- local Whisper.
- llama.cpp.
- LocalAI bridge.
- secondary notifier.
- continuous audio microauthorization.
- voice authorization.
- event-normalizer Worker.

Each optional item requires a re-entry condition and rollback. Absence is not a gap.

### CLOSED_SOURCE — remove from active backlog views
Examples already closed in source/CI:
- native LibreChat surface reuse;
- Intent/Interflow projection;
- NOSTROMO hybrid source architecture;
- MANOJOS3 semantic/entrypoint source contracts;
- mobile/recovery source semantics;
- provider HUD bridge;
- NostromoTargetGateway;
- MANOJOS3 TargetAdapter source;
- AdapterCompatibilityReport;
- Resource Tree;
- source suite and upstream overlay validation;
- transport/mobile/extension canon.

Closed items belong in CURRENT/HANDOFF/evidence, not in the active backlog.

### HISTORICAL_OR_SUPERSEDED
- ReverseLibreChatAdapterContract is a candidate to mark FUSIONADA/SUPERADA by the current TargetGateway + adapter architecture, but the old source does not explicitly prove equivalence. Keep provenance and require one mapping decision before retiring the name.
- SkillMirrorManifest, TargetCapabilityProjection and CrossTargetTruthEnvelope are internal contracts, not top-level backlog items.
- old SOURCE proofs/runs remain evidence history and must not be presented as current work.

## Missing-but-external concerns

### Xubuntu cleanup/optimization
Not a LibreChat core feature. MANOJOS3 projection already exposes a cleanup/HOST domain.
Represent in LibreChat as an external target capability/lens, not a new LibreChat worker, daemon or host manager.

### Local network administration/audit
No explicit LibreChat backlog item was found.
Add only as an external target capability/lens when a governed target can perform it.
LibreChat may interpret, visualize and request the audit; it must not become a network scanner or network authority.

## Documentation ownership rule

One fact, one canonical owner:

- current state/order -> root CURRENT.json + root HANDOFF_CURRENT.md;
- design/invariants -> 10 Design;
- procedures -> 20 Operations;
- open gates/evidence/closeout -> 30 Closeout;
- topology/coverage -> 40 Map;
- machine transport counts -> config/parallel_transport.current.json;
- Skills catalog -> config/skills.current.json;
- detailed source paths -> docs/REPO_LOCATION_INDEX_CURRENT.md;
- provenance/history -> source/provenance matrices.

00 must stay compact and point to owners instead of repeating their full content.

## Anti-monster acceptance test

A new backlog item does not become custom source unless all are answered:
1. Why native LibreChat cannot do it.
2. Why config cannot do it.
3. Why an existing Skill cannot do it.
4. Why MCP/Action cannot do it.
5. Why an existing adapter/projection cannot do it.
6. What component stays asleep when unused.
7. How it is disabled/rolled back.
8. Whether it belongs to LibreChat or an external target.
9. Whether an existing item already covers the same intent.
10. What exact LIVE evidence would justify promotion.

If these are not answered, classify as FUSIONAR, DEFERIR, EXTERNAL or RECHAZAR instead of building.
