# START HERE — GPT

Active architecture: `NOSTROMO_HYBRID`.
Canonical architecture: `docs/LIBRECHAT_ARCHITECTURE_CURRENT.md`.
Authority: `false`.
Mode: `SOURCE_ONLY` until runtime readback proves otherwise.

Read:
1. `operating/TARGET_CANON.json`
2. `operating/BOOTSTRAP_CURRENT.json`
3. `docs/LIBRECHAT_ARCHITECTURE_CURRENT.md`
4. `operating/HANDOFF_CURRENT.md`
5. `docs/NOSTROMO_HYBRID_CURRENT.md`
6. `docs/MANOJOS3_GPT_SEMANTIC_BRIDGE_CURRENT.md`

Current routing:
- inference: LibreChat/NOSTROMO -> Cloudflare AI Gateway -> admitted provider/model;
- semantic profiles: RAPIDO, NORMAL, PENSAR, CODIGO, CONTEXTO_LARGO, VISION;
- local model: optional, never a promotion prerequisite;
- MANOJOS3 LiteLLM: internal/advisory/compatibility, not primary LibreChat inference;
- actions: LibreChat -> NostromoTargetGateway (in-process, authority=false) -> target adapter;
- MANOJOS3 adapter: real MANOJOS3 MCP;
- VX13 adapter: future Tentaculo Link/canonical VX13 frontdoor.

Rules:
- one NOSTROMO identity across providers and targets;
- Cloudflare inference never becomes target authority;
- MCP is a MANOJOS3 adapter transport, not the LibreChat UX contract;
- target gateway is not a server, MCP, policy engine, executor, verifier or ledger;
- provider failover never replays material effects;
- ToolApproval != target authorization;
- model JSON is untrusted until schema + semantic validation;
- Tentaculo HUD keeps provider status separate from target truth;
- no paid automatic fallback;
- no secrets in source, Drive, HUD or receipts;
- no direct LibreChat call to private MANOJOS3 control-plane HTTP;
- AUTO/BOTH never mutate;
- source/config != LIVE.

Current source state:
- router core: IMPLEMENTED_SOURCE;
- Cloudflare client contract: IMPLEMENTED_SOURCE;
- provider status projection: IMPLEMENTED_SOURCE;
- provider -> HUD live bridge: PARTIAL/OPEN;
- NostromoTargetGateway: DESIGNED_CURRENT/OPEN;
- upstream overlay revalidation: NOT_TESTED;
- Cloudflare live binding: NO_VERIFICADO;
- MANOJOS3 R0 binding from LibreChat: PREPARED/UNCONFIGURED;
- VX13 live binding: GATE_EXTERNAL.

Do not touch MANOJOS3 or VX13 repositories while closing LibreChat router/source gaps unless the user explicitly changes scope.
