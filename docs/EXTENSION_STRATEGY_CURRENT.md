# LibreChat VX extension strategy — CURRENT

Status: `SOURCE_POLICY / LIVE_NO_VERIFICADO`

## Goal

Keep LibreChat VX extensible without turning it into a monolith or a deep fork.

## Mandatory decision order

Before adding code, attempt these layers in order:

1. **Native LibreChat capability**
2. **`librechat.yaml` / Model Spec / deployment configuration**
3. **Skill**
4. **MCP or OpenAPI Action**
5. **Agent Plugin** when a cohesive optional package truly needs Skills + MCP + hooks
6. **Thin wrapper / adapter / projection**
7. **Custom source code** only when the previous layers cannot express the required behavior

A UI convenience never justifies a new Kernel, Policy engine, ledger, executor, router, database or authority layer.

## Skills

Canonical repository location: `skills/`.

Preferred distribution: GitHub Skill Sync.

Skills are suitable for:
- operating procedures;
- tool-selection policy;
- evidence/readback discipline;
- resource-navigation behavior;
- target-specific cockpit rules;
- repeatable review/research flows.

Skills are not suitable for:
- real target authorization;
- receipts/evidence minting;
- durable target state;
- material execution;
- UI rendering primitives.

## Resource Tree

Use one generic Resource Tree contract for hierarchical resources.

Possible adapters:
- LibreChat files/projects/skills/agents;
- Google Drive;
- OneDrive/SharePoint;
- MANOJOS3 capabilities/runs/flows;
- VX13 modules/domains/runs;
- future providers.

Rules:
- lazy child loading;
- read-only navigation by default;
- provider/target provenance preserved;
- visual renderer may evolve without changing the resource contract;
- do not create a bespoke dashboard just because a resource has a new type.

## Agent Plugins

Agent Plugins are experimental and optional.

Use them only when an extension is cohesive enough to package Skills and MCP/hooks together. Do not make plugin hooks part of the core authority chain.

## Anti-monolith gate

A proposed component is rejected unless it answers all of these:

- Why can native/config not do it?
- Why can a Skill not do it?
- Why can MCP/Action not do it?
- Why can a thin adapter/projection not do it?
- What process/service stays asleep when the feature is unused?
- How is the feature disabled or rolled back?

## Truth boundary

Extension source or configuration does not prove LIVE operation.

`READBACK/LIVE > SOURCE > CURRENT > HANDOFF > DOCUMENTATION > MEMORY > INFERENCE`
