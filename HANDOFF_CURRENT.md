# LIBRECHAT HANDOFF CURRENT

Mode: `SOURCE_ONLY`.

## Source-only closeout

`COMPLETE_WITH_LLM_PLANE`

Closed source/Drive layers:

- `LC-OPERATING-CANON = PASS`
- `LC-M3-INTERFLOW-PROJECTION = PASS`
- `LC-NATIVE-SURFACE-BINDING = PASS`
- `LC-MOBILE-RECOVERY = PASS`
- `LC-LLM-PLANE-TOPOLOGIES = PASS`
- `LC-M3-ENTRYPOINT-CONTRACTS = PASS`

## LLM architecture now fixed

Model plane and action plane are separate.

Model topology families:
1. direct provider;
2. local OpenAI-compatible model;
3. external OpenAI-compatible router;
4. MANOJOS3-managed LiteLLM;
5. hybrid model endpoint + MANOJOS3 MCP.

MANOJOS3 action entrypoint:
- MCP streamable-http;
- source loopback `127.0.0.1:8790/mcp`;
- deployment variable `MANOJOS3_MCP_URL`;
- 14 bounded tools;
- no arbitrary capability execution;
- no direct LibreChat call to private control-plane HTTP.

MANOJOS3 inference entrypoint:
- OpenAI-compatible LiteLLM/ModelRouter plane;
- source loopback `127.0.0.1:4000/v1`;
- deployment variable `MANOJOS3_LLM_BASE_URL`;
- authority=false.

Advisory model use through MANOJOS3:
- LibreChat submits a bounded objective with `manojos_submit`;
- MANOJOS3 chooses `llm.models` / repair advisory Interflow internally.

## Unresolved live truth

MANOJOS3 source disagrees about currently promoted free models:
- managed LiteLLM config marks aliases LIVE_VERIFIED_FREE;
- LLM_MODELS_CURRENT says none active;
- CONTROL_PLANE_STATUS says live_verified_free_models=0.

Do not resolve from source. `LC-M3-LLM-LIVE-READBACK` requires live canaries.

## Drive

- LLM plane: `1eopGIXRbeOZwwfotCbmObeIDDalpGLsGZGWI_fMNpgI`
- MANOJOS3 entrypoints: `19WZ2DM3pXyIe9-mhyq_3oVXQ63QmvDBf7i720mGW1N4`
- VX13 LLM alignment: `1Oq3BPniuQI96z5e6T_vmUl2AhHP1Iu05_iPD6MKOOLM`

## Proof boundary

Last executed host proof remains `26 PASS @ 94c632762f7afee7d9fa9d0f0c23c80d7494d2d2`.

Current-head tests are `NOT_RUN / STALE_PROOF`.

## Next boundary

`WAIT_FOR_LOCAL_REVALIDATION_PERMISSION_OR_LIVE_BINDING`

No local host was touched.
