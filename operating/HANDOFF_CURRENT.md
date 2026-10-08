# Operating Handoff — LibreChat VX v8

**Mode:** SOURCE_ONLY / LIVE_NO_VERIFICADO / MATERIAL_VERIFIED=false.  
**Authority:** false.  
**Baseline source evidence cutoff:** `77ceb1a9fe72dd70db9f968b28b0370c831115ff`, GitHub Actions run `37706857454` SUCCESS.  
**Latest exact source proof:** `874d7e0a49def329973a30416160f076dcf2fc05` · run `37724142946` SUCCESS (build-test 110 PASS, overlay-smoke SUCCESS). Historical baseline above retained. LIVE_NO_VERIFICADO; MATERIAL_VERIFIED=false.

## First read and precedence

Root `CURRENT.json` → root `HANDOFF_CURRENT.md` → `operating/TARGET_CANON.json` (desired v8) → `operating/GAPS_CURRENT.json` (active vs deferred classes) → `operating/BOOTSTRAP_CURRENT.json` (derived) → relevant focused docs.

Drive 00 is entry; 10 Design, 20 Operations, 30 Closeout/Pending, 40 Map each owns one responsibility. Proof and source readbacks beat copied historical statements.

## Current operating choices

- NOSTROMO: natural-language intent interpreter, contextual companion, research and visual cockpit; not a coding worker.
- LLM: 1 Cloudflare AI Gateway, 7 semantic routes RAPIDO/NORMAL/PENSAR/INVESTIGAR/VISUALIZAR/CONTEXTO_LARGO/VISION, no paid fallback.
- Transport: localhost:3080; one Tailscale Serve route baseline for private mobile; 1 optional Cloudflare Tunnel+Access, 0 required Workers, 0 Funnel.
- Skills: 10 active catalog entries (including on-demand `nostromo-extension-review`); 2 old alias files remain physically present until LIVE GitHub Skill Sync compatibility readback.
- TargetGateway remains in-process, authority=false; MANOJOS3 production binding OFF; VX13 external frontdoor GATED; ORÁCULO advisory.
- Everything LIVE remains NO_VERIFICADO or NOT_DEPLOYED until real service canaries.

## Backlog and criba

Active LIVE: Cloudflare AI Gateway provider/routing canary → Skill Sync → Tailscale/móvil → Web Research → Agent Events → out-of-band recovery; host low-power measurement is a human gate.

TARGET_LATER: MANOJOS3 R0, ORÁCULO advisory, VX13 frontdoor, first material canary.
DEFERRED_EXTERNAL: MANOJOS3 transport/drift/LiteLLM internals and future transport migration.
OPTIONAL_REENTRY: SearXNG, Firecrawl, Router Steward, local models, public Cloudflare access, Tailscale Services, etc.
CLOSED_SOURCE: only historical evidence, not actionable gaps.

High-priority design-review idea `LC-NOSTROMO-SEMANTIC-BRIDGE`: map NOSTROMO-owned semantic intents/capabilities and safe contracts into MANOJOS3 Intent Flows/Interflows/drivers without creating a second MANOJOS3 semantic engine. Existing `src/intent/intentInterpreter.ts` already classifies CONVERSATION/RESEARCH/VISUALIZE/EXPLAIN/TARGET_READ/TARGET_COMMAND/CLARIFY. Coverage and vocabulary are to be audited, not assumed absent. No MANOJOS3 mutation.

## Safety

No MANOJOS3/VX13 repo or transport edits. Technical slots inferred internally; clarification only for real semantic ambiguity or human risk choice. No UI/Skill/LLM authorization, no automatic material replay on reconnect/failover, and UNKNOWN_OUTCOME requires readback. No branch/commit implies live ownership: UNOBSERVED stays UNOBSERVED.

## Exact continuity files

- `config/skills.current.json` active catalog and compatibility aliases.
- `docs/BACKLOG_CRIBA_CURRENT.md` anti-monolith classes.
- `docs/SKILL_REDUNDANCY_AUDIT_CURRENT.md` Skill fusion.
- `operating/CURRENT_SOURCE_SNAPSHOT.json` evidence cutoff and runtime truth.
- `operating/PROOFS_CURRENT.json` dependency-based evidence history.
- `operating/DRIVE_REFS_CURRENT.json` living docs.
