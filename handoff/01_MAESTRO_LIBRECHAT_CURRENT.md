# MAESTRO LIBRECHAT CURRENT

## Identidad
Repositorio independiente: `elkakas314/libre_chat_vx`.
Rol: interfaz conversacional y cockpit gobernado para targets externos. `authority=false`.

## Producto objetivo
Una única experiencia conversacional PC/móvil, una identidad Nostromo y un HUD determinado por verdad estructurada. El usuario expresa objetivos naturales; LibreChat no exige IDs técnicos cuando el target puede resolverlos.

## Arquitectura activa
`NOSTROMO_HYBRID` es la única arquitectura LLM CURRENT:
- voz local pequeña/reemplazable: personalidad, español natural, continuidad corta y rendering final;
- MANOJOS3 LiteLLM: razonamiento/coding/long-context gratis cuando proceda;
- MANOJOS3 MCP: acciones gobernadas;
- VX13: target futuro con misma identidad y slots externos, autoridad distinta;
- ORÁCULO: advisory only.

La voz local no autoriza, no ejecuta, no inventa receipts, no altera evidencia y no sustituye Intent/Interflow.

## Canon operativo
- TARGET_CANON es deliberado/versionado.
- CURRENT deriva de evidencia.
- DELTA y LIVING_PLAN son read models.
- Ownership sólo de claim/lease/run/scope observado; sin readback = UNOBSERVED.
- Proofs dependen de fingerprint de dependencias; cambio global de HEAD no invalida todo.
- Closeout es R0/puro y no convierte gates externos en COMPLETE.

## Integración MANOJOS3
M3 current observado: `a7b2647bd7b18df474ac0a0d8f942a3469a11b7c`.

Adapter current:
- `librechat.thread.read` — R0 — readback.
- `librechat.message.send` — R2 — scope `librechat:{thread_id}` — readback.
- fail-closed: AVAILABLE sólo con `configured && call`.

MCP es transporte, no autoridad. Entrypoints canónicos:
`status/readiness/self`, `capability-index`, `skills`, `attach`, `submit`, `run`, authorization reads, resume/advance/pause/cancel y receipts.
El envelope natural es `manojos3.ingress.v1`.

No llamar desde LibreChat a HTTP privado de control plane como contrato de aplicación; usar MCP M3.
Inference plane y action plane son diferentes.

## Integración VX13
VX13 no se modifica por este proyecto.
El A-50 CURRENT define:
- NOSTROMO como composición de surfaces, no servicio/target/router/ledger;
- TargetScope visual separado de ConcreteTargetId;
- AUTO/BOTH no mutan;
- toda mutación VX13 sigue Link -> Switch -> Madre -> Authorization/ExecutionSpec -> Spawner/hija -> readback -> verification;
- Tentáculo Link sigue frontdoor VX13;
- mobile/reconnect no reenvía mutaciones.

## Integración ORÁCULO
ORÁCULO se consume como advisory/provider con `authority=false`. Una recomendación nunca concede permiso ni prueba ejecución. Preferencia: mediado por el target gobernado cuando corresponda.

## Native-first UI
No segundo frontend. Overlay reversible sobre LibreChat upstream pin exacto.
Prioridad: reutilizar SidePanel, ToolApproval, MCP UI, Tools dropdown, Files, Subagents, Background Tasks y resumable SSE.

TrustedSurfaceHost es distinto de Artifact: los controles operativos requieren provenance, schema validation, allowlist, anti-clickjacking/confused-deputy y retorno al owner de autoridad.

## Focus
No “modos”. Estado mínimo:
`focus_current, active_windows, risk, recommended_action, evidence_freshness, concrete_target`.
Cambio de foco no cambia target ni grants.

## Mobile/recovery
PC y móvil son sesiones del mismo backend/historial.
Offline: sólo draft minimizado; no outbox/replay de UiAction, AuthorizationDecision o MUTATE.
Reconnect revalida sesión/ACL/target/preimagen/revisión/autorización para cualquier nueva mutación.

## Modelos
No fijar un modelo local hasta benchmark de deployment.
Objetivo de voz: ~1–2 GB, carga on-demand, warm activo, idle unload permitido.
LiteLLM M3 mantiene aliases semánticos; su disponibilidad servida es LIVE, no se deduce de YAML.
Paid fallback automático: prohibido.

### Decisión runtime local
- Ollama: opción operacional simple para lifecycle/API local.
- llama.cpp server: opción de mayor control fino/huella GGUF.
- decisión final: benchmark host real; no convertir comparación documental en PASS.

## Observabilidad
Separar carriles:
`CONNECTION != READINESS != WORK != EVIDENCE`.
CORE_MINIMUM no se oculta: conexión/frescura, DecisionInbox, run lifecycle seguido, revocaciones y alertas no ocultables.

## Seguridad
- secretos por referencia, nunca valores en repo/UI/receipts;
- browser authority = none;
- scopes de lectura y mutación separados;
- unknown outcome antes de retry;
- offline mutation replay=false;
- explicit concrete target para material work;
- target verification + receipt para PASS.

## Deployment objetivo
1. paquete VX compila/testea;
2. upstream exacto verificado por commit+blobs;
3. overlay feature-flagged reversible;
4. LibreChat upstream arranca con overlay;
5. route real M3 MCP/LLM accesible desde contenedor;
6. local voice benchmark/config;
7. R0 M3;
8. full conversation/HUD/native surfaces;
9. primer R2 mínimo;
10. VX13 parity después.

## Estado actual
`SOURCE_ONLY_OPERATING_CANON_RECONCILER_PENDING_LIVE_REVALIDATION`.
No afirmar LIVE ni MATERIAL_VERIFIED.

## Evidencia mínima
- `libre_chat_vx@657e00d:CURRENT.json:L1-L48`.
- `libre_chat_vx@657e00d:operating/TARGET_CANON.json:L1-L51`.
- `libre_chat_vx@657e00d:overlay/UPSTREAM_INTEGRATION_MAP.json`.
- `manojos3@a7b2647:src/manojos3/adapters/librechat.py:L7-L15`.
- `manojos3@a7b2647:src/manojos3/mcp_gateway.py:L94-L180`.
- Drive VX13 A-50 CURRENT `1i-Dyj_KePeAeQl4d90ZjVQVsmE8Ca-2bGKPHM9vNZO0`, indexes 4819–7023.

## Capacidades nativas LibreChat incorporadas — 2026-10-05

Se prioriza reutilizar capacidades oficiales antes de desarrollar equivalentes propios: Tool Search, Skills, control de agentes en ejecución, trazas, inspector de contexto/compactación, adjuntos inteligentes y RAG, MCP con OAuth/request scope, Agent Management API, tool intents, artifacts, background tasks, scheduled chats y subagentes.

Regla de integración: cualquier superficie que pueda terminar en efecto material se traduce a intención y vuelve al owner del target. LibreChat no obtiene autoridad por tener MCP, Agents, Programmatic Tool Calling, workspaces o Tool Approval.

## Provider Mesh dentro de NOSTROMO_HYBRID

El diseño ya era híbrido y no se sustituye. Se formaliza la independencia del proveedor:

- `nostromo-voice-local` queda como acelerador/voz opcional, no dependencia dura.
- MANOJOS3 LiteLLM conserva aliases semánticos y es el router preferente del plano de razonamiento.
- LibreChat Custom Endpoints puede conectar proveedores OpenAI-compatible o Anthropic-compatible, locales o remotos, cuando la conversación lo necesite.
- LibreChat Model Specs presenta perfiles estables y evita que la UX dependa del nombre real del modelo.
- `paid_fallback_allowed=false` continúa vigente.
- Objetivo operacional: `REMOTE_FREE_CAPABLE + LOCAL_OPTIONAL + PROVIDER_AGNOSTIC_UI`.
- Un fallo de proveedor sólo cambia la ruta de inferencia; nunca cambia target, grants, autorización, receipt ni replay de mutaciones.
- Ningún proveedor remoto “gratuito” se considera garantizado: debe comprobarse LIVE su cuota, compatibilidad, tool calling, límites y estabilidad.

## Tentáculo HUD — contrato maestro reconciliado

Tentáculo HUD es una superficie nativa de verdad operacional proyectada dentro de LibreChat. No es dashboard separado, base de datos, authority ni sistema de receipts.

CORE_MINIMUM siempre visible:
`TARGET | CONNECTION | READINESS | WORK | EVIDENCE | AUTH | PROVIDER | FRESHNESS`.

Paneles lazy:
- Target & Run
- Evidence
- Decision Inbox
- Provider Mesh
- Context
- Tools & Skills
- Conversation Trace
- Recovery / Alerts

Read models derivados:
`TargetStatusView`, `ProviderStatusView`, `ActiveRunView`, `DecisionInboxView`, `EvidenceView`, `ContextUsageView`, `ToolSkillView`, `ConversationTraceView`.

Invariantes:
- CONNECTED != READY.
- FINISHED != VERIFIED.
- VERIFIED != RECEIPT_AVAILABLE.
- focus != target.
- Tool Approval != target authorization.
- BackgroundTask/Subagent != TargetRun.
- cognitive trace != material proof.
- stale projection never becomes target truth.
- UNKNOWN_OUTCOME blocks blind material retry.

El projector se mantiene dentro de LibreChat y usa infraestructura nativa/existente. No se introduce un HUD service ni HUD database. Cache externo adicional sólo tras source/benchmark.

## MANOJOS3 binding real

El adapter interno de LibreChat puede presentar una interfaz estable, pero debe mapear a las tools MCP publicadas por MANOJOS3 y no inventar un segundo execution API.

Source actual observado:
- MCP loopback default: `http://127.0.0.1:8790/mcp`.
- control plane interno del gateway: `http://127.0.0.1:8787`.
- LiteLLM managed loopback: `http://127.0.0.1:4000/v1`.
En contenedores se usa la dirección alcanzable real del deployment; nunca loopback ajeno copiado a ciegas.

Tools source: status, capabilities, skills, attach, prepare, submit, run, authorization requirement/read, resume, advance, pause, cancel, receipt.

La UX de autorización deriva del `grant_interface` LIVE de MANOJOS3. `OPERATOR_MODE_AUTONOMOUS` no se transforma artificialmente en aprobación humana por paso; `LOCAL_CLI_AUTHORIZE_STEP_ONLY` conserva el gate local exacto.

