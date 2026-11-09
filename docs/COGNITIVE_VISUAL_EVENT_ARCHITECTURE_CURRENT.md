# NOSTROMO — Cognitive, Visual and Event Architecture CURRENT

Date: 2026-10-07
Status: SOURCE_IMPLEMENTED / LIVE_NOT_VERIFIED
Authority: false

## Main flow

```text
USER
  |
  v
NOSTROMO / LibreChat
  |
  +-- Intent Interpreter
  |     +-- conversation
  |     +-- research
  |     +-- visualization
  |     +-- target read
  |     +-- target command
  |     \-- clarification
  |
  +-- Research Policy
  |     +-- target readback for operational truth
  |     +-- file search/context for user documents
  |     +-- web search/scrape for public internet
  |     \-- browser only when interaction is required
  |
  +-- Presentation Planner
  |     +-- tree
  |     +-- timeline
  |     +-- comparison
  |     +-- Mermaid
  |     +-- evidence/status
  |     \-- interactive Artifact
  |
  +-- Tentáculo Companion (cognitive, authority=false)
  |
  \-- TargetGateway
        +-- MANOJOS3 later
        +-- VX13 later
        \-- ORACULO advisory path as configured
```

## Inbound events

External systems can notify LibreChat through the native Agents API event surface:

```text
MANOJOS3 / VX13 / ORACULO
       |
       v
authenticated source adapter
       |
       v
POST /api/agents/v1/events
       |
       v
Tentáculo event triage
       |
       v
user notification / visual update / fresh read
```

The source adapter must authenticate its native source, sanitize payloads and send references rather than secrets.

LibreChat event delivery is not proof that target work succeeded. If current state matters, fetch fresh target evidence.

## Outbound actions

```text
User -> NOSTROMO intent -> TargetGateway -> target authority chain
```

The conversational model never becomes material authority.

## Skills

GitHub Skill Sync is the canonical distribution path:

```text
elkakas314/libre_chat_vx/skills
        |
        v
GitHub Skill Sync
        |
        v
LibreChat Skills
```

No Worker or MANOJOS3 hop is required merely to update/read these Skills.

A future self-improvement flow may propose repository changes, but repository mutation remains a separate governed/CI-verified action.
