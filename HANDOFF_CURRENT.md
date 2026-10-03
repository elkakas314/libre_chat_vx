# LIBRECHAT HANDOFF CURRENT

Mode: `SOURCE_ONLY`.

## Active architecture

`NOSTROMO_HYBRID`

There is one active LLM architecture, not five.

```text
LibreChat
→ Nostromo local voice (~1–2 GB)
   ├─ MANOJOS3 LiteLLM free reasoning when needed
   └─ MANOJOS3 MCP for governed actions
→ same personality to user
```

## MANOJOS3 GPT semantics imported

Bootstrap is read-only:
`manojos_gpt_migration_profile → status → capabilities → skills → optional attach`.

Do not submit an objective just to acquire context.

Human input is a natural objective. Capabilities are internal drivers.

Technical slots are resolved/inferred when possible. Ask the user only for true semantic ambiguity, real risk/authorization, irreversible choice or unavailable required data.

MCP and LLM routing have `authority=false`.

Material success requires verified receipt + current evidence + readback.

Ambiguous effects require readback/reconcile before retry.

## Tentáculo HUD

HUD state is model-independent.

It derives from structured target state:
status/capabilities/skills/Interflow/run/authorization/receipt/readback.

Therefore a small local model does not reduce HUD correctness.

## Drive CURRENT

- Start Here: `10sokDQr6eFQGSceTl0KYwfVinmF8ixTUz-XG0e8RyjQ`
- Nostromo Hybrid: `1PqXk7nM8M_arbI472RU5n4T0rFQI1Yt-MH54VSapYc8`
- MANOJOS3 GPT Semantic Bridge: `1gAbtU0XISM4GWuspp-6wWEZACAycWtZBqzMrEJUu6y0`
- VX13 parity: `1i_sw3ZYXdu3-wFrmAxTw42PppT6wxMOK8G2jKI4onF8`

The old five-topology Drive documents are marked SUPERSEDED.

## Proof boundary

Current source tests: `NOT_RUN / STALE_PROOF`.

Last material proof remains `26 PASS @ 94c632762f7afee7d9fa9d0f0c23c80d7494d2d2`.

No local host was touched.

## Next boundary

`WAIT_FOR_LOCAL_REVALIDATION_PERMISSION_OR_LIVE_BINDING`
