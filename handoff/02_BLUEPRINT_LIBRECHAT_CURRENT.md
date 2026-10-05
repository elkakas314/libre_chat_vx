# BLUEPRINT LIBRECHAT CURRENT

## Arquitectura general

```mermaid
flowchart LR
  U[Usuario PC / móvil] --> LC[LibreChat]
  LC --> NC[NOSTROMO_CONVERSATION_CORE]
  NC --> LV[Voz local reemplazable]
  NC --> LR[MANOJOS3 LiteLLM]
  NC --> MCP[MANOJOS3 MCP]
  MCP --> I[Intent / Interflow]
  I --> GP[Governor / Policy]
  GP --> K[Kernel / driver]
  K --> RB[Readback]
  RB --> VR[Verifier / Receipt]
  VR --> HUD[Tentáculo HUD / ArtifactDock]
  HUD --> LC
  LC -. target futuro .-> TL[Tentáculo Link VX13]
  TL --> SW[Switch]
  SW --> M[Madre]
  M --> SP[Spawner / hija]
  SP --> V13RB[Readback + verificación Madre]
  OR[ORÁCULO advisory] -. authority=false .-> LR
```

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
  U[Usuario] --> LC[LibreChat / Nostromo]
  LC --> MS[Model Specs / perfiles semánticos]
  MS --> PM[Provider Mesh]
  PM --> M3L[MANOJOS3 LiteLLM aliases]
  PM --> REM[Custom Endpoints remotos compatibles]
  PM --> LOC[Modelo local opcional]
  LC --> ACT[MANOJOS3 MCP / VX13 ingress]
  ACT --> AUTH[Autoridad del target]
  AUTH --> RB[Readback + Verifier + Receipt]
```

Invariantes adicionales:
11. El proveedor del LLM es intercambiable y no forma parte de la autoridad.
12. Modelo local = opcional; remoto = posible; ninguno es requisito único.
13. Model Specs/aliases son identidades semánticas; el binding real se verifica LIVE.
14. Fallover de inferencia no reenvía ni duplica acciones.
15. No existe fallback automático a proveedor de pago.

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

