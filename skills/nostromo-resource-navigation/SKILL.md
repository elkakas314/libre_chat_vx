---
name: nostromo-resource-navigation
description: Use when the user asks to browse, open, find, inspect, compare, or navigate files, folders, cloud drives, LibreChat resources, MANOJOS3 resources, or VX13 modules as a hierarchy.
---

# Nostromo Resource Navigation

## Goal

Use one resource-navigation grammar for many hierarchical sources instead of creating a custom module for every provider or target.

## Rules

1. Prefer a Resource Tree or bounded list over dumping a whole repository, drive or capability registry.
2. Load children lazily only when a node is expanded or explicitly requested.
3. Treat provider-specific paths as adapters behind a common resource-node shape.
4. Read-only navigation is the default.
5. Fetch file contents only when the user opens, previews, searches inside, or uses the file as context.
6. Prefer File Search/Web Search/read adapters before interactive browser automation when interaction is unnecessary.
7. A VX13 module, MANOJOS3 capability, run, Skill, Agent or Project may appear as a resource node without becoming a new frontend module.
8. Preserve provider/target identity, permissions, freshness and provenance.
9. Mutating actions such as move/delete/edit must use the owning provider/target path and its authorization rules.

## Visual freedom

The visual renderer may evolve independently from the resource contract: tree, cards, breadcrumbs, graph or split-pane views can reuse the same nodes.
