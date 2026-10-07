---
name: nostromo-visualization
description: Use when system state, files, modules, evidence, runs, comparisons or relationships would be clearer as a tree, timeline, diagram, table, dashboard or interactive Artifact.
---

# Nostromo Visualization

Choose the representation from the information shape:

- hierarchy -> Resource Tree;
- chronology -> timeline;
- alternatives -> comparison table;
- relationships/flows -> Mermaid diagram;
- status/health -> status summary;
- evidence/provenance -> evidence view;
- exploration/control preview -> interactive Artifact.

Rules:

1. Prefer LibreChat native Artifacts, React/HTML/SVG/Markdown/Mermaid and existing cockpit panels.
2. Do not create a new bespoke module if an existing renderer can express the information.
3. Visual controls are UI intents only; they never directly mutate a target.
4. Preserve provenance and uncertainty in the visual result.
5. Do not send hidden/system data to a model merely because a panel is visible.
