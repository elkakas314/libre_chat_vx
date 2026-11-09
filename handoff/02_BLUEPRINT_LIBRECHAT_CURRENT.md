# BLUEPRINT LIBRECHAT CURRENT

> CURRENT routing canon 2026-10-06: `docs/LIBRECHAT_ARCHITECTURE_CURRENT.md`.
> Cualquier topología histórica LiteLLM-first queda superseded por Cloudflare AI Gateway + NostromoTargetGateway/TargetAdapters.


## Arquitectura general

```mermaid
flowchart LR
  U[Usuario PC / móvil] --> LC[LibreChat / NOSTROMO]
  LC --> COG[NostromoInferenceGateway]
  COG --> CF[Cloudflare AI Gateway]
  CF --> P[Providers/modelos admitidos]
  LC --> TG[NostromoTargetGateway<br/>in-process · authority=false]
  TG --> M3A[MANOJOS3 TargetAdapter]
  M3A --> MCP[MANOJOS3 MCP]
  MCP --> I[Intent / Interflow]
  I --> GP[Governor / Policy]
  GP --> K[Kernel / driver]
  K --> RB[Readback]
  RB --> VR[Verifier / Receipt]
  TG -. future .-> VXA[VX13 TargetAdapter]
  VXA --> TL[Tentáculo Link]
  TL --> M[Madre]
  M --> SP[Spawner / hija]
  SP --> V13RB[Readback + verificación]
  LC --> HUD[Tentáculo HUD / ArtifactDock]
  VR --> HUD
  V13RB --> HUD
  OR[ORÁCULO advisory] -. authority=false .-> COG
```

Cloudflare es inferencia únicamente. TargetGateway desacopla UX de transportes; no añade autoridad ni ejecución.

## Focus / ventana

```mermaid
flowchart TD
  MSG[Mensaje] --> SEM[Semántica / referent]
  SEM --> F[focus_current]
  F --> WR[windowRouter]
  WR --> S[Shared native side panel]
  S --> A{Prioridad}
  A -->|Artifact activo| ART[Artifact]
  A -->|Subagent activo| SUB[Subagent]
  A -->|libre| NOS[Nostromo contextual]
  F --> HUD[MinimalTruth + DecisionInbox + TargetRun]
  HUD --> EV[evidence freshness / risk / target]
```

## Mutación

```mermaid
flowchart TD
  UI[UiAction / objetivo natural] --> CT{Concrete target?}
  CT -->|AUTO/BOTH| DENY[Mutación prohibida]
  CT -->|MANOJOS3| M3[M3 MCP]
  M3 --> GOV[Governor/Policy]
  GOV --> K[Kernel]
  K --> RB[Readback]
  RB --> VER[Verifier]
  VER --> REC[Receipt]
  CT -->|VX13| LINK[Tentáculo Link]
  LINK --> MADRE[Madre / Authorization]
  MADRE --> SPAWN[Spawner/hija]
  SPAWN --> R2[Readback]
  R2 --> MV[Madre verification]
  MV --> RP[Receipt projection]
```

## Lanes
- Conversation: lenguaje/respuesta.
- Objective/action: gobernanza/efecto.
- Projection/HUD: read models.
- Native: lifecycle UI LibreChat.
- Evidence: receipts/readback/artifacts.

## Invariantes
1. LibreChat authority=false.
2. LLM authority=false.
3. Focus != target.
4. Approval UI != target authorization.
5. BackgroundTask != TargetRun proof.
6. Resume UI != replay material.
7. Artifact != TrustedSurfaceHost.
8. `AUTO/BOTH` no mutan.
9. PASS material exige readback + verifier + receipt.
10. Polling fijo no es baseline; event-driven/lazy/backpressure/snapshot-resync.

## Provider Mesh de razonamiento

```mermaid
flowchart LR
  U[Usuario] --> LC[LibreChat / NOSTROMO]
  LC --> MS[Model Specs / perfiles semánticos]
  MS --> CF[Cloudflare AI Gateway]
  CF --> P1[Provider A]
  CF --> P2[Provider B]
  CF --> P3[Provider C]
  LC --> LOC[Modelo local opcional]
  LC --> TG[NostromoTargetGateway]
  TG --> M3A[MANOJOS3 adapter -> MCP]
  TG -. future .-> VXA[VX13 adapter -> Tentáculo Link]
  M3A --> AUTH1[Autoridad MANOJOS3]
  VXA --> AUTH2[Autoridad VX13]
```

Invariantes adicionales:
11. `semantic profile != provider`.
12. Modelo local = opcional.
13. Cloudflare AI Gateway = inference only, authority=false.
14. TargetGateway = facade only, authority=false.
15. MCP es transporte del adapter MANOJOS3, no contrato UX.
16. Fallover de inferencia no reenvía ni duplica acciones.
17. No existe fallback automático a proveedor de pago.

## Tentáculo HUD / Projection Plane

```mermaid
flowchart LR
  M3[MANOJOS3 owner] -->|events/snapshots| TP[Tentáculo Projection Module]
  VX[VX13 owner] -->|events/snapshots| TP
  PM[Provider Mesh] -->|health/route| TP
  CTX[LibreChat context/trace] --> TP
  TP --> RM[Derived Read Models]
  RM --> HUD[CORE_MINIMUM + lazy panels]
  HUD --> UI[LibreChat UI]
```

El Projection Module es in-process con LibreChat; no tiene authority ni truth database.

### Carriles independientes

```text
CONNECTION: UNKNOWN -> CONNECTING -> CONNECTED -> DEGRADED -> DISCONNECTED
READINESS:  UNKNOWN -> DISCOVERING -> READY | NOT_READY | DEGRADED
WORK:       IDLE -> PLANNING -> ADMITTED -> WAIT_AUTH -> QUEUED -> RUNNING -> READBACK -> VERIFYING -> SUCCEEDED | FAILED | CANCELLED | UNKNOWN_OUTCOME
EVIDENCE:   NONE -> EXPECTED -> READBACK_AVAILABLE -> VERIFIED -> RECEIPT_AVAILABLE
```

### Event contract

Cada evento proyectado incluye `event_id`, `stream_id`, `sequence`, owner/provenance, timestamps, target/run refs y payload. Duplicados se descartan; gaps marcan STALE/GAP_DETECTED; se recuperan por replay si existe o snapshot autoritativo. No se coalescen authorization/evidence/terminal transitions. Polling fijo sólo fallback.

### Provider critical path

```text
browser -> LibreChat -> ProviderRouteResolver -> selected inference route -> stream
```

Tentáculo HUD no bloquea TTFT. Health/routing usa estado cacheado/derivado y no sondea todos los proveedores por turno.

### MANOJOS3 real binding

```text
LibreChat
 -> MANOJOS3 MCP deployment URL
    -> manojos_status / capabilities / skills
    -> manojos_prepare or manojos_submit
    -> manojos_run / authorization reads
    -> resume / advance / pause / cancel
    -> manojos_receipt
 -> MANOJOS3 control plane internally
 -> Governor / Policy / Kernel / driver
 -> readback / Verifier / Receipt
```

El deployment puede traducir networking, pero no cambia el contrato ni crea tools paralelas.



## Provider profile routing / identity split

```mermaid
flowchart LR
  U[Usuario] --> LC[LibreChat]
  LC --> ID[NOSTROMO_IDENTITY_PROFILE]
  ID --> MS[Model Specs / perfil semántico]
  MS --> ALIAS[Alias MANOJOS3]
  ALIAS --> LIT[LiteLLM]
  LIT --> OR[OpenRouter deployment]
  LIT --> GE[Gemini deployment opcional]
  LIT --> LO[Local deployment opcional]
  LC --> M3[MCP MANOJOS3]
  M3 --> AUTH[Governor/Policy/Kernel/Verifier/Receipt]
```

Reglas:
- `semantic alias != provider`.
- `identity != provider`.
- `prompt persona != authority`.
- `free tier != zero-cost LIVE proof`.
- `provider failover != material replay`.
- `large context != upload everything by default`.
- `multimodal inference != target evidence`.
- `structured JSON != trusted material state`.
- `local model != deployment prerequisite`.

Structured output:
```text
model JSON
 -> schema validation
 -> semantic validation
 -> target binding check
 -> MCP MANOJOS3 if material
```

Large context:
```text
targeted reads -> File Context/RAG -> compact relevant context -> long-context alias only if needed
```

Provider details shown in Tentáculo HUD are diagnostic: alias, provider/model, locality, capability flags, health, quota/rate-limit state and freshness. None changes authority.


## Cloudflare remote inference plane

```mermaid
flowchart LR
  U[Usuario] --> LC[LibreChat / Nostromo]
  LC --> CF[Cloudflare AI Gateway]
  CF --> P1[Provider A]
  CF --> P2[Provider B]
  CF --> P3[Provider C]
  LC --> M3[MCP MANOJOS3]
  M3 --> GOV[Governor/Policy/Kernel]
  GOV --> REC[Readback/Verifier/Receipt]
  M3 -. internal advisory .-> LIT[LiteLLM MANOJOS3]
```

Invariantes:
- Cloudflare route/model change nunca altera authority.
- LibreChat conversation path no depende de LiteLLM M3.
- LiteLLM M3 puede seguir sirviendo consumidores internos.
- no hay loop Cloudflare -> M3 LiteLLM -> Cloudflare.
- paid route no puede aparecer como fallback implícito.
- provider search/tool output no es EvidenceRef/ReceiptRef.


## Transport topology

```mermaid
flowchart LR
  LC[LibreChat] --> CFAG[Cloudflare AI Gateway]
  CFAG --> LLM[Remote LLM providers]

  LC --> MCPB{MCP binding}
  MCPB -->|same host| M8790[MANOJOS3 MCP :8790]
  MCPB -->|private remote| TS[Tailscale Serve/private]
  TS --> M8790
  MCPB -->|public remote| MEdge[Dedicated authenticated Cloudflare MCP Edge]
  MEdge --> VPC[MANOJOS3_VPC]
  VPC --> CFT[Cloudflare Tunnel]
  CFT --> M8790

  GPTA[Legacy GPT Actions] --> AP[manojos2-action-proxy]
  AP --> VPC2[MANOJOS3_VPC]
  VPC2 --> CFT2[Cloudflare Tunnel]
  CFT2 --> CP[Control plane :8787]

  GPTP[ChatGPT Plugin] --> OAIT[OpenAI Secure MCP Tunnel]
  OAIT --> M8790

  HC[host-control :8791] -. recovery only .-> M3[MANOJOS3]
```

Separación obligatoria:
- AI Gateway != Cloudflare Tunnel.
- LibreChat MCP edge != legacy Action Proxy.
- OpenAI Secure MCP Tunnel != generic LibreChat transport.
- Tailscale Funnel != baseline public MCP.
- host-control != normal action route.
