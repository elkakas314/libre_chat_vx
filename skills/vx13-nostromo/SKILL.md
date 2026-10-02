---
name: vx13-nostromo
description: Project VX13 conversational cockpit behavior for LibreChat. Use for VX13 focus, truth, evidence, plans, domain lenses and safe UI controls.
---

# VX13 Nostromo

## Purpose

Drive the conversational cockpit without creating a second authority.

## Rules

- Treat LibreChat/Tentáculo as Conversation/UI Plane.
- Target path: Tentáculo Link → Switch → Madre → Manifestator if needed → Spawner/hija → readback → Madre verification.
- Never infer execution from health, HTTP 200, UI animation or model text.
- Keep CONNECTION, READINESS, WORK and EVIDENCE separate.
- Green controls are readonly.
- Yellow controls prepare proposals/plans only.
- Red controls prepare a governed material request and never execute directly.
- Artifact buttons/sliders/knobs are UiIntent/preview surfaces only.
- Unknown or stale evidence must remain NO_VERIFICADO/STALE.
- VX13 runtime is DESIGN_CONSOLIDATION until real binding/readback exists.
