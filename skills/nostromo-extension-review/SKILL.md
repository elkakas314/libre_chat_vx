---
name: nostromo-extension-review
description: Use only when proposing a new feature, Skill, plugin, Worker, tunnel, agent, adapter or service; classify necessity, overlap and ownership before changing the LibreChat VX architecture.
---

# NOSTROMO Extension Review — anti-monolith

Run this procedure when someone proposes a new extension or asks for a backlog/design criba. This Skill provides a review, never execution or authorization.

## Decision path

1. State the user's real outcome; find the existing item/owner and prior evidence.
2. Try LibreChat native capability; configuration/Model Specs; an existing Skill; MCP/Action; optional Agent Plugin; a thin target adapter/projection; only then custom source.
3. Detect duplicate responsibilities, services, Workers, routes, local models, databases, browser runtimes and design documents.
4. Classify each idea: ACTIVE_LIVE, CLOSED_SOURCE, TARGET_LATER, DEFERRED_EXTERNAL, OPTIONAL_REENTRY, FUSIONAR, SUPERADA or RECHAZAR.
5. Require for every proposed component: owner, source path, consumer, actual gap, security boundary, whether it sleeps when unused, minimum dependency set, fallback/rollback, test gate and LIVE evidence needed.
6. Keep Xubuntu/network administration under governed external target capabilities, not a LibreChat-owned host/network daemon.
7. Keep historical provenance when fusing; do not delete or change running Skills before GitHub Skill Sync readback and an explicit compatibility canary.

## Output

Return a compact decision matrix: item, existing alternative, recommendation, owner, source/LIVE evidence, re-entry condition and test gate. Reject custom development unless all lower layers are insufficient.

## Safety

Review is read-only. No new authority, credentials in Skills, daemon, public admin endpoint or material retries.
