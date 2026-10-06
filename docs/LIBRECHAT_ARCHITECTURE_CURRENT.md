# LIBRECHAT VX — ARQUITECTURA, ROUTER Y CAPACIDADES — CURRENT

Date: 2026-10-06
Status: `SOURCE_DESIGN_CONSOLIDATED / LIVE_NO_VERIFICADO`
Authority: `false`

## 1. Decisión de arquitectura

LibreChat VX es la cabina conversacional y de presentación. No es MANOJOS3, no es VX13 y no replica sus autoridades.

La arquitectura queda dividida en tres planos independientes:

```text
Usuario
  ↓
LibreChat / NOSTROMO
  ├─ Conversation + Context + Files/RAG + native tools
  ├─ Tentáculo HUD / Cockpit
  │
  ├─ Cognitive plane
  │    NostromoInferenceGateway
  │      ↓
  │    Cloudflare AI Gateway
  │      ↓
  │    proveedores/modelos admitidos
  │
  └─ Target plane
       NostromoTargetGateway (facade in-process, authority=false)
         ├─ MANOJOS3 adapter → MANOJOS3 MCP → Governor/Policy/Kernel → Verifier/Receipt
         └─ VX13 adapter (future) → Tentáculo Link → Madre/Spawner/hijas
```

Cloudflare AI Gateway es sólo inferencia. Nunca transporta autoridad material, autorizaciones de target ni receipts.

NostromoTargetGateway es una fachada interna de LibreChat, no otro servidor, proxy público, MCP, Governor, Policy, Kernel, executor ni ledger. Su única función es desacoplar la UI del transporte concreto de cada target.

## 2. Por qué el MCP queda debajo del gateway

La UI y el cockpit no deben depender de que un target use MCP.

Para MANOJOS3, el adaptador usa el contrato MCP real. Para VX13, el adaptador usará Tentáculo Link o el frontdoor que VX13 canonice. El contrato visual y semántico de LibreChat permanece estable.

```text
LibreChat UI
  ↓
NostromoTargetGateway
  ↓
TargetAdapter
  ↓
target-specific transport/frontdoor
```

Esto permite añadir VX13 sin rehacer la cabina y permite cambiar el transporte de MANOJOS3 sin cambiar la UX.

## 3. Inferencia y router

Owner: `LIBRECHAT_NOSTROMO_VIA_CLOUDFLARE_AI_GATEWAY`.

Perfiles semánticos:

| Perfil | Requisitos mínimos |
|---|---|
| Rápido | TEXT, baja latencia |
| Normal | TEXT |
| Pensar | TEXT + STRUCTURED_OUTPUT |
| Código | TEXT + STRUCTURED_OUTPUT + TOOLS |
| Contexto largo | TEXT + LONG_CONTEXT, >=128k cuando la tarea lo requiera |
| Visión | TEXT + VISION |

`AUDIO` es una capability, no un modo de operador. Voz/ASR/TTS puede seleccionar una ruta AUDIO cuando esté habilitada y admitida.

Reglas de admisión de proveedor:
- health `READY`;
- quota `AVAILABLE`;
- `VERIFIED_ZERO_COST` para perfiles por defecto;
- privacidad admitida;
- capability compatible;
- contexto suficiente;
- readback LIVE y fresco;
- `paidFallbackAllowed=false`.

El proveedor y el modelo concretos son detalle diagnóstico. La identidad visible sigue siendo NOSTROMO.

## 4. Identidad NOSTROMO

La identidad pertenece a LibreChat, no a Cloudflare, LiteLLM ni a un proveedor.

Debe permanecer estable al cambiar:
- proveedor;
- modelo;
- perfil semántico;
- ruta local/remota.

Un prompt de identidad nunca es frontera de seguridad. El modelo no puede conceder autorización, inventar PASS, receipt o evidencia.

## 5. Contexto, structured output y multimodalidad

Orden de contexto:
1. lecturas dirigidas;
2. RAG/File Context;
3. contexto compacto;
4. contexto largo sólo cuando haga falta.

Structured output:
```text
model output
 -> JSON parse
 -> schema validation
 -> semantic validation
 -> application consumption
```

Campos de autoridad material generados por el modelo se rechazan.

Multimodalidad:
- imagen/screenshot → ruta VISION;
- audio → ruta AUDIO cuando esté disponible;
- texto → perfil semántico correspondiente.

Interpretación multimodal sigue siendo cognitiva; no sustituye readback/evidence/receipt del target.

## 6. Tentáculo HUD

Tentáculo HUD es visualización y foco, `authority=false`.

Debe mostrar dos familias de verdad sin mezclarlas:

### Inference status
- semantic profile;
- provider/model;
- local/remote;
- capabilities;
- health;
- latency;
- quota;
- freshness;
- identity version/hash.

### Target truth
- connection;
- readiness;
- work;
- evidence;
- target;
- run;
- authorization challenge;
- receipt/readback provenance.

Un proveedor `READY` no implica target `READY`. Un target `READY` no implica trabajo completado.

## 7. Capacidades LibreChat consolidadas

### SOURCE implementado
- Conversation/Nostromo cockpit;
- Tentáculo HUD model;
- StatusRail y truth lanes;
- CurrentFocus/referential continuity;
- automatic windows;
- ArtifactDock y proyección de evidence/receipt;
- Interactive Artifact → UiIntent;
- PlanGraph, ActiveFlow y TargetRun projections;
- panels Files/Audio/Browser/Build/Background tasks;
- mobile/recovery semantics;
- resumable conversation streams without material replay;
- semantic inference profiles;
- strict zero-cost provider admission;
- Cloudflare AI Gateway client contract;
- NOSTROMO identity profile;
- structured cognitive envelope validation;
- provider status projection;
- MANOJOS3 entrypoint descriptors.

### Reutilización nativa de LibreChat
No duplicar:
- Agents;
- Artifacts;
- MCP/MCP UI;
- ToolApproval;
- Skills;
- Subagents;
- background tool calls;
- Files/RAG;
- Speech;
- resumable streams;
- ACL;
- SidePanel.

### Parcial / falta binding
- overlay against pinned upstream;
- real Cloudflare AI Gateway binding;
- semantic Model Specs wired to dynamic routes;
- provider status → live Tentáculo HUD bridge;
- actual AUDIO route/canary;
- MANOJOS3 target adapter LIVE;
- mobile/backend live verification.

### Diseñado, aún no implementado LIVE
- NostromoTargetGateway facade;
- VX13 TargetAdapter → Tentáculo Link;
- VX13 live projection/mutation binding;
- ORÁCULO live advisory route;
- first governed material canary through LibreChat.

## 8. MANOJOS3

MANOJOS3 LiteLLM remains internal/advisory/compatibility infrastructure. It is not the primary LibreChat inference router.

LibreChat material objectives never call MANOJOS3 private control-plane HTTP directly.

Canonical application path:

```text
LibreChat
 -> NostromoTargetGateway
 -> Manojos3TargetAdapter
 -> MANOJOS3 MCP
 -> Governor/Policy/Kernel
 -> readback
 -> Verifier/Receipt
```

Transport under that adapter is deployment-specific:
- same host: direct `:8790/mcp`;
- remote private: authenticated private/Tailnet path;
- remote public: dedicated authenticated Cloudflare MCP edge to the existing MANOJOS3 transport.

The legacy Action Proxy is not the LibreChat contract.

## 9. VX13

VX13 is the future larger target and keeps its own authority.

Planned path:

```text
LibreChat
 -> NostromoTargetGateway
 -> VX13TargetAdapter
 -> Tentáculo Link
 -> Switch/Madre
 -> Spawner/hijas
 -> verification/readback
```

LibreChat reuses the same NOSTROMO identity, HUD, TargetRun, DecisionInbox, ArtifactDock and contextual windows, but never merges VX13 authority with MANOJOS3 authority.

## 10. Invariantes

1. Cloudflare AI Gateway != target gateway.
2. Target gateway != authority.
3. MCP is a target adapter transport, not the UX contract.
4. One NOSTROMO identity across providers and targets.
5. Provider failover never replays a material request.
6. UI approval != target authorization.
7. Source/config != LIVE.
8. Health != work success.
9. Work success != MATERIAL_VERIFIED.
10. No paid fallback.
11. No secrets in repo/Drive/HUD/receipts.
12. Local model is optional.
13. Offline mutation replay is forbidden.
14. VX13 and MANOJOS3 keep distinct authority chains.

## 11. Estado y siguiente cierre

`LIVE=NO_VERIFICADO`
`MATERIAL_VERIFIED=false`

Siguiente orden:
1. reconcile SOURCE docs/config with this architecture;
2. run exact-HEAD source tests;
3. revalidate pinned upstream/overlay;
4. bind Cloudflare AI Gateway and semantic profiles;
5. prove zero-cost fail-closed, provider failover, identity stability, vision and local-absent;
6. connect provider status to HUD;
7. implement the in-process TargetGateway facade;
8. bind MANOJOS3 R0 through its adapter;
9. leave VX13 adapter behind a feature gate until VX13 contracts are canonical;
10. only then attempt a minimal governed material canary.
