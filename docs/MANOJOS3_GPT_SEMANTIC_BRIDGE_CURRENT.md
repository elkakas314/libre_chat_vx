# MANOJOS3 GPT Semantic Bridge — CURRENT

Source: `elkakas314/manojos3@cb772cca141f7ae5ae03af9655b3c5186f5826f6`.

This bridge imports MANOJOS3's GPT/controller semantics into LibreChat so a lightweight local model does not have to infer operational rules from prose.

## Bootstrap

Before action work:

```text
manojos_gpt_migration_profile
manojos_status
manojos_capabilities
manojos_skills
manojos_attach (optional)
```

Do **not** submit an objective merely to acquire context.

## Human input contract

Human input is a natural objective.

Capabilities are internal drivers.

MANOJOS3 semantic resolution already derives technical context such as repo root, target scope and configured driver details where possible.

LibreChat/Nostromo must not ask the user for capability_id, provider, driver, repo_root, worktree or other technical slots when MANOJOS3 can infer them.

The user is asked only for:

- a true semantic ambiguity that cannot be recovered;
- a real risk/authorization decision;
- an irreversible choice;
- unavailable required information.

## Objective lifecycle

```text
natural user objective
  ↓
manojos_submit
  ↓
manojos3.ingress.v1
  ↓
Semantic Router
  ↓
Slot Resolver
  ↓
Intent / Interflow
  ↓
Operation Compiler / Gateway
  ↓
Governor / Policy
  ↓
Kernel / driver
  ↓
readback
  ↓
Verifier / Receipt
  ↓
manojos_run / manojos_receipt
  ↓
Nostromo presentation
```

## Authorization

MCP is transport only.

It never grants authority.

Nostromo reads the live grant interface before assuming authorization semantics.

If MANOJOS3 reports autonomous operator semantics, Policy/Kernel own the declared R2/R3 decision according to MANOJOS3 policy.

If an exact local gate is reported, that exact gate applies.

LibreChat ToolApproval may present a decision but cannot mint a target grant.

## Success

Nostromo may say a material operation succeeded only when all required evidence is present:

- verified receipt;
- current evidence;
- target readback.

HTTP 200, a submitted run, a visible capability or model prose are insufficient.

## Interrupted/ambiguous effect

UNKNOWN/STARTED/possible material effect:

`READBACK → RECONCILE → only then decide whether retry is safe`.

Never retry a material action from conversation history alone.

## Continuation

For long MANOJOS3 project work:

- respect live ownership;
- an occupied scope blocks only that scope;
- independent eligible work may continue;
- do not rebuild Kernel, Governor, ToolBus, MCP or Semantic Core;
- route work through existing Intent/Interflow.

This is the operating behaviour Nostromo should reproduce even when its local language model is small.
