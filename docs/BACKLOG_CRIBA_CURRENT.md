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

## New user idea — NOSTROMO semantic layer and MANOJOS3 crosswalk (2026-10-08)

**ID:** LC-NOSTROMO-SEMANTIC-BRIDGE  
**State:** DESIGN_REVIEW_PENDING · HIGH · no implementation authorization.

Assess whether LibreChat/NOSTROMO needs an explicit domain vocabulary/semantic registry for its own capabilities (conversation, presentation, research, Resources, Events, Skills/plugins, target reads and intents). Compare it with existing Intent Interpreter, semantic contracts, and MANOJOS3 semantic projection. Prefer a **thin semantic crosswalk** linking NOSTROMO intent -> target semantic Intent Flow/Interflow/driver/capability, with ownership on each side. The user speaks naturally; no duplicated MANOJOS3 semantic engine and no copied authority/executor.

**Acceptance:** inventory existing semantics; spot actual gaps; propose canonical Intent/Capability mappings; test colloquial/referential phrases and ambiguous target selection; prove never converts read -> material submit and never treats a semantic match as authorization; route to existing Skills/native config where possible. Only develop missing SOURCE after design/reuse audit.

**Boundaries:** This is a LibreChat backlog idea only; do not edit MANOJOS3. Review early, but do not derail the already-active Operating Canon + Skill consolidation.

### Feasibility alternatives and choice gate — LC-NOSTROMO-SEMANTIC-BRIDGE

Compare these options **before authorizing implementation**:

1. **Reuse native LibreChat Agent/Skill/Model Specs + existing Intent Interpreter**: add a lightweight, versioned NOSTROMO capability vocabulary and decision tests only if the existing configuration lacks explicit coverage.
2. **Typed semantic crosswalk at TargetGateway/adapters (preferred hypothesis)**: translate a user-facing NOSTROMO Intent into a target-neutral, authority=false intent envelope and then a target-owned intent-flow/capability reference. Read MANOJOS3 descriptors through R0 when LIVE, never clone or independently execute its flows.
3. **A read-only declarative intent/capability registry**: allow controlled additions for LibreChat surfaces, with provenance, owner, allowed presentation/READ semantics and test fixtures; use the current semantic model and provenance matrix rather than a new semantic engine or database.
4. **Separate semantic engine / LLM-first self-routing**: reject by default; would duplicate MANOJOS3, risk drift and confuse semantic selection with authorization.

**Decision rule:** choose the smallest of (1)–(3) that passes coverage tests. Investigate natural language, implicit referents, colloquial ambiguity, own LibreChat features, multi-target requests, negative cases (read != submit; semantic match != grant), versioning and rollback. Prefer a focused Skill for conversation/application guidance; keep wire contract, ACL, target selection and material fences in typed code. Any M3 mapping is advisory/R0 until actual target readback validates it.

**Acceptance evidence:** comparison matrix, gaps against existing `src/intent`, `src/manojos3`, `config/skills.current.json` and canonical target contracts; proposed semantic IDs/flows; tests showing how phrases map to intents without authority; explicit source vs LIVE separation. **Status remains queued and not yet developed.**

### Existing-semantic-source evidence (review, not implementation)

Inspected source: `src/intent/intentInterpreter.ts` already classifies CONVERSATION/RESEARCH/VISUALIZE/EXPLAIN/TARGET_READ/TARGET_COMMAND/CLARIFY; `docs/SEMANTIC_MODEL_CURRENT.md` already defines product/scope/target/research/event/truth semantics; `src/manojos3/gptSemanticBridge.ts` already defines TECHNICAL_MISSING_SLOT, SEMANTIC_MISSING_SLOT, RISK_CONFIRMATION and prohibits context-only submit; `src/targets/targetGateway.ts` already delegates with no authority or material retry.

**Preferred minimal design hypothesis:** extend existing typed interpreter with a small SOURCE-versioned NOSTROMO capability vocabulary **only for uncovered application functions**, and a read-only TargetGateway/adapter semantic crosswalk to target-owned Intent Flows/Interflows. Do not copy MANOJOS3 flow tables into an authoritative LibreChat runtime. Preserve provenance and freshness. A Skill may teach natural-language clarification and correct view selection, but not enforce grants or run mutation.

**Critical feasibility tests:** colloquial paraphrases and coreference; own feature commands vs target read/target change; two plausible targets; read-only AUTO/BOTH; model/provider failover; and target-descriptor drift. Crosswalk returns candidate mapping and confidence/provenance, never authorization. If native vocabulary/Skill guidance already passes the test, cancel new registry/adapter work.

State remains `DESIGN_REVIEW_PENDING` (not SOURCE-developed). 
