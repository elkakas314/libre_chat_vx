# NOSTROMO HYBRID — CURRENT

This is the only active LLM architecture for LibreChat VX.

## Architecture

```text
User
  ↓
LibreChat
  ↓
NOSTROMO_CONVERSATION_CORE
  ├─ local voice model (~1–2 GB)
  │    personality / natural Spanish / short continuity / final rendering
  │
  ├─ MANOJOS3 LiteLLM
  │    free general / reasoning / coding / fast / long-context advisors
  │
  └─ MANOJOS3 MCP
       objective → Semantic/Intent/Interflow → Governor/Policy → Kernel
       → driver → readback → Verifier/Receipt
```

There are no five selectable architectures in CURRENT.

The previous topology catalogue is historical only.

## Local voice role

The local model is deliberately small and replaceable.

It does not need to know the whole MANOJOS3 architecture from its weights.

The deterministic VX module supplies:

- MANOJOS3 GPT controller semantics;
- target truth;
- Interflow/domain catalogue;
- focus;
- run state;
- receipt/evidence;
- routing rules.

The local model concentrates on:

- stable personality;
- natural Spanish;
- conversational continuity;
- referential language such as "eso", "sigue", "lo anterior";
- lightweight classification;
- final answer rendering.

It must not alter facts, uncertainty or receipt/readback references received from a stronger model or MANOJOS3.

## Free reasoning

Hard questions are delegated to the MANOJOS3-managed LiteLLM pool.

Stable aliases:

- manojos-general-free
- manojos-reasoning-free
- manojos-coding-free
- manojos-fast-free
- manojos-long-context-free

The user still sees one Nostromo personality.

The local voice layer presents the result, but evidence is semantically immutable.

Automatic paid fallback is forbidden.

## Actions

Actions never go through the model router as authority.

LibreChat sends natural objectives through the MANOJOS3 MCP.

No direct call from LibreChat to private MANOJOS3 control-plane HTTP is canonical.

## Tentáculo HUD

Tentáculo HUD does **not** depend on the intelligence of the local model.

Its state comes from structured sources:

- manojos_status → connection/readiness;
- manojos_capabilities / manojos_skills → discovery;
- MANOJOS3 Interflow map → domain/intent projection;
- manojos_run → work state;
- manojos_authorization_requirement / manojos_authorization → decision state;
- manojos_receipt + target readback → evidence.

Therefore:

- local voice down + MCP read path up → HUD can remain operational;
- free reasoner down + local voice + MCP up → chat/actions continue with reduced deep reasoning;
- MCP down + local voice/reasoner up → conversation continues but MANOJOS3 actions/HUD live state are unavailable;
- all up → full mode.

## Lifecycle

The local voice model is coupled to LibreChat.

Target behaviour:

- load on demand with an active LibreChat conversation;
- keep warm while active;
- permit idle unload from RAM;
- model file remains on disk;
- reconnect does not replay target material effects.

Model selection is a deployment benchmark decision, not hardcoded into the architecture.

Target size: approximately 1–2 GB.
