# IDEA-LC reuse audit — CURRENT

Date: 2026-10-06

Status: `112/112_REVIEWED / SOURCE_ONLY / LIVE_NO_VERIFICADO`

## Result

The canonical Drive matrix now maps every `IDEA-LC-001..112` to one or more consolidated LibreChat VX capabilities and carries the final implementation strategy for each mapping.

Current master capability count: **100**.

Capability-level classification:
- 44 `YA_DESARROLLADO`
- 34 `REUTILIZAR_UPSTREAM`
- 16 `FALTA_DESARROLLAR`
- 6 `DIFERIDO`

IDEA-level resolution:
- 44 remain consolidated LibreChat VX capabilities;
- 33 are mixed reuse + thin wrapper;
- 9 are absorbed by native/config/Skill/MCP paths;
- 18 require bounded custom code;
- 8 remain deferred.

These counts are planning/source classifications, not runtime proof.

## Replacement rule

An IDEA is not deleted when upstream covers it. Its provenance remains, but its implementation is replaced by the lightest supported mechanism.

Typical substitutions:

- decision interaction -> native ToolApproval + target-owned authorization;
- broad tool catalog -> Deferred Tools/Tool Search;
- operational procedures -> Skills;
- shared Skill catalog -> GitHub Skill Sync;
- ORÁCULO advisory -> Agent/Model Spec rather than a new material target;
- cloud/provider tools -> MCP/Actions/adapters;
- model profiles -> Model Specs + Cloudflare dynamic routes;
- multi-user administration -> native ACL/Admin surfaces;
- cloud files -> native Files/SharePoint/MCP plus Resource Tree presentation;
- long tool/research flows -> Subagents/Agent Chains where appropriate;
- resume/reconnect -> native resumable streams plus material replay fence.

## Source of truth

Detailed per-IDEA mapping lives in:

`MATRIZ MAESTRA LIBRECHAT — CAPACIDADES + INTEGRACIÓN — CURRENT.xlsx`

Google Drive canonical folder:
`LibreChat — CURRENT consolidado VX13 + MANOJOS3 + ORACULO`

## No-loss rule

All 112 IDEA identifiers remain traceable even when their implementation is replaced by upstream/configuration.
