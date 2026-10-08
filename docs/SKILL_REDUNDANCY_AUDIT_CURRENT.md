# SKILL REDUNDANCY AUDIT — CURRENT

Status: SOURCE_CONSOLIDATED / LEGACY_ALIASES_RETAINED_PENDING_LIVE_SYNC
Originally inspected: 11 Skills. Current SOURCE: 10 active catalog entries + 2 compatibility aliases on disk (12 folders).

## Keep as distinct Skills

### nostromo-core
Keep as the default dispatcher/cockpit identity, but make it smaller and more canonical.

### nostromo-visualization
Distinct information-shape policy. Good Skill boundary.

### nostromo-research
Distinct public-research procedure. Keep.

### nostromo-event-triage
Distinct authenticated-event handling. Keep.

### nostromo-evidence-first
Distinct truth/readback discipline. Keep separate because it is useful selectively for status, errors, receipts and completion claims.

### nostromo-resource-navigation
Distinct lazy resource-navigation grammar. Keep.

### manojos3-nostromo
Target-specific cockpit semantics. Keep.

### vx13-nostromo
Target-specific cockpit semantics. Keep while VX13 remains a supported future target.

### cross-target-read
Distinct multi-target READ-only comparison behavior. Keep.

## Absorbed into nostromo-core in SOURCE; compatibility aliases remain

### nostromo-intent-translation -> absorbed into nostromo-core
Reason:
- every ordinary NOSTROMO turn already needs intent/referent resolution;
- nostromo-core already repeats most of the same decision logic;
- keeping two selection layers increases routing ambiguity without adding authority or capability.

Retirement gate:
- copy the unique target-command success-criteria guidance into nostromo-core;
- GitHub Skill Sync compatibility canary;
- then mark old Skill SUPERSEDED before deleting.

### nostromo-tool-budget -> absorbed into nostromo-core
Reason:
- the core already says prefer native/lightweight paths;
- tool-budget is a global operating heuristic, not a separate user-facing capability;
- keeping it separate makes the model decide whether to load a Skill in order to learn that it should load fewer Skills/tools.

Retirement gate:
- preserve targeted-read, File Search-before-long-context, Web Search-before-browser, lazy-tool and optional-local-component rules in core;
- run Skill Sync canary;
- then mark old Skill SUPERSEDED before deleting.

## New on-demand Skill implemented in SOURCE

### nostromo-extension-review — implemented
Purpose: run the anti-monolith/backlog criba whenever a new feature, plugin, Worker, tunnel, adapter or custom module is proposed.

It should:
- apply Native -> Config -> existing Skill -> MCP/Action -> Agent Plugin -> adapter/projection -> custom source;
- detect duplicate responsibility;
- classify ACTIVE / TARGET_LATER / DEFERRED / OPTIONAL / EXTERNAL / SUPERSEDED;
- demand owner, sleep behavior, rollback and evidence gate;
- never authorize or execute material work.

This is a good Skill because it is a repeatable reasoning/review procedure, not runtime authority.

Result: 10 active canonical Skills in `config/skills.current.json`. Two deprecated aliases remain in the filesystem until real GitHub Skill Sync canary validates compatibility; the sync path may still discover 12 physical folders. This is explicitly **not** a 10-Skill LIVE proof.

## Do not turn into Skills

Keep as hard contracts/code, not instruction-only Skills:
- material no-replay / UNKNOWN_OUTCOME;
- ACL/authentication;
- target authorization;
- receipts/evidence;
- route/tunnel security;
- provider admission enforcement;
- idempotency;
- mobile mutation fence;
- target adapter wire contracts.

## Host/network concerns

Do not create separate LibreChat Skills for Xubuntu cleanup or LAN administration yet.
Use MANOJOS3/external-target cockpit semantics first.
Only add a host-ops Skill if repeated conversational interpretation proves that manojos3-nostromo cannot express the host lens cleanly.

## Added semantic review

`LC-NOSTROMO-SEMANTIC-BRIDGE` is HIGH-priority design review, not a new Skill yet. Compare existing Intent Interpreter/native capabilities, a thin TargetGateway semantic crosswalk, and a read-only vocabulary registry. Avoid a second semantic runtime or duplicate MANOJOS3 flows.
