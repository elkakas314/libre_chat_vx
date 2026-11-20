# NOSTROMO / LIBRECHAT VX — OBJETIVO ÚNICO DE WORK PARA CIERRE TOTAL (18-11-2026)

> **OBJETIVO RELEVADO — CORTE 2026-11-20 / CANON CONTRACT-FIRST**. Antes de repetir cualquier procedimiento de este documento, aplicar [canon de ejecución por contrato](NOSTROMO_CONTRACT_FIRST_EXECUTION_CANON_20261120.md), [schema de handoff](../contracts/nostromo-objective-handoff.schema.json) y último `HANDOFF_CURRENT.md`. HEAD SOURCE documentado: `6106ca1874fe94dc593f49bdd518181b9ae8039a` (no fijar; consultar HEAD remoto). **No abrir otro Work; sustituir el objetivo del Work ya existente.** No reinstalar `native-file-deferral` P0 si hash instalado coincide; reducción del contexto 92%→65% acreditada, pero MCP E2E pendiente, GPU/swap saturadas durante último canario. Ahora PRIORIDAD: (1) revalidar HEAD y escritor; (2) cablear acuerdo autenticado→contrato compacto→capability resolution con ACL y target; (3) ejecución determinista gobernada en MCP/jobs actuales sin Qwen3 ni historia conversacional; (4) persistencia de patch tras rebuild; (5) resolver diferencias de overlay cabina sin pisar 12 dirty; (6) SIWC solo tras consentimiento efectivo; (7) pruebas E2E bajas en consumo, recursos, sincronización y cierre. La implementación del nuevo contrato no está LIVE; no declarar PASS por SOURCE ni por validar JSON. Si fallan pruebas bajo inferencia, continuar otros módulos independientes. `FINAL_VERIFIED=false` hasta criterios materiales.


**AUTORIDAD DEL DOCUMENTO:** ORDEN OPERATIVA DE EJECUCIÓN para el **mismo Work que estaba trabajando E3**, después de que el propietario sustituya su objetivo en pausa. No es recibo LIVE, no sustituye `SPEC.json`, `TOPOLOGY.json`, `CURRENT.json` ni evidencia host. Este documento prevalece sobre tareas históricas contradictorias **solo como mandato de trabajo**. Trabajo exclusivamente en `elkakas314/libre_chat_vx`.

**BASE AL PUBLICAR:** `main@8e642eb1238f9b35f18a070d6a754fede4b432fb`; integración PR #54 `integration/nostromo-canon-20261118-r1`; anterior a este documento `c33df354b780694dc41a047a9f6263ae5770c27b`. **NO fijar este SHA como último eterno:** leer HEAD remoto, historial y CI recién iniciados antes de cada efecto. PR #57 es **investigación**; sus afirmaciones no reemplazan los contratos del upstream.

## MANDATO / PRODUCTO TERMINADO

Acabar **una sola instancia real, accesible, persistente, segura y de bajo consumo** de LibreChat VX/NOSTROMO en el Lenovo, desde la misma conversación/agente nativo, con capacidad de hablar, investigar, razonar, solicitar y ejecutar operaciones gobernadas sobre herramientas MCP/targets existentes. Debe quedar instalable, recuperable, probado tras reconexión/reinicio pertinente, sin pérdida de chats ni archivos únicos y con un **árbol lógico canónico** y una sola fuente Git. Priorizar rutas gratuitas/locales y uso autorizado del plan ChatGPT Plus mediante SIWC; jamás habilitar facturación automática o fallbacks cobrables. Completar código, CI, runtime, HUD, estado, integraciones, documentación, reconciliación de carpetas y limpieza reversible hasta la última frontera material permitida. No detener toda la misión por un bloqueo de consentimiento o un grant particular.

### HECHOS QUE NO SE DEBEN REDESCUBRIR
- El Work E3 anterior construyó SIWC en lotes: `src/llm/{chatgptAuthorized,siwcLoopback,siwcIdentity,siwcSession,siwcProtectedVault,siwcResponsesClient,siwcOpenAiFetch,siwcProviderRoutes}.ts`, `src/librechat/nativeInferenceRouteAdapter.ts`, `deployment/librechat-agents/agentclient-siwc-binding.mjs` y pruebas. SHA histórico `6f205d8` con `source-check` run **44364160187 SUCCESS 6/6**, CI nativo run **44364160206 FAILURE** en expectativa visual línea 104. El commit `c33df354` corrigió solo el test de cabina y añadió `scripts/nostromo-gh-work-preflight-r0.sh`. Nuevos runs exact-head deben leerse; no reimplementar el fix antes de ver su resultado.
- `CURRENT.json.p0_live_readback` documenta canario host a **2026-11-18T07:02:56Z**: conversación `2da11982-20a5-5b32-a18c-0dd00413cba8`, 2 llamadas MCP, respuesta completada, Mongo sin error y recuperación tras recarga, Qwen3 4B, contexto 6144; ~300 segundos. Clasificar **HOST_REPORTED/HISTORICAL_RECEIPT**, comprobar al reactivar la instalación. No revertirlo verbalmente a «P0 nunca funcionó»; tampoco promover producto a VERIFIED.
- **Nuevo readback CI sobre `c33df354`**: las dos pruebas `VX ON` de escritorio/móvil pasan la selección de foco, pero el script espera `Volver a NOSTROMO` y la UI real `src/ui/TentaculoHud.tsx` expone `Volver al contexto`. La prueba se corrige al nombre accesible real sin cambiar la aplicación; ejecución/CI del SHA posterior **pendiente**. Run `44380437969` FAILURE. No confundir con el antiguo fallo de línea 104.
- El Upstream pinned es `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`; Agents SDK `@librechat/agents@4.0.1`. El hook real seleccionado por E3 fue `api/server/services/Endpoints/agents/initialize.js`. Antes de cambiar, examinar versión exacta/exports, anclas y preimágenes. El patch SIWC es SOURCE/staging CI, no instalado LIVE.
- GitHub árbol recursivo en `c33df354`: 598 blobs / 102 directorios, `truncated=false`. Componentes críticos existen: AgentClient SIWC, inferencia, semántica, MCP único, HUD, pruebas y Work contract. No volver a inventariar repos duplicados por nombre.
- Work previo reportó backend en `~/librechat/upstream`, MCP desde `~/libre_chat_vx-clean`, datos Compose/MongoDB/Meilisearch/RAG bajo `~/LibreChat`. Es información de host histórica que exige **reconfirmación acotada** por PID/CWD/mounts antes de mover/tocar. `~/LibreChat` y `~/librechat` son rutas distintas en Linux.
- GitHub de este chat tiene `admin/push/pull` sobre el repo privado. En el Lenovo, la captura del propietario muestra `gh` autenticado como `elkakas314` con token **`gho_` = OAuth**, no PAT fine-grained; puede bastar si la API confirma `permissions.push=true`. Un PAT fine-grained es `github_pat_`. No obligar a crear otro token si la sesión existente funciona.

## PRECEDENCIA / CANALES

`READBACK LIVE host con PID/ruta/fecha/receipt > Git exact HEAD y CI exact HEAD para SOURCE > CURRENT contrastado > handoff/issue #37 > Drive 00/10/20/30/40 + matriz > PR #57/research/DeepSeek > memoria > inferencia`.

- **Work local/terminal en Lenovo**: vía principal para leer y operar el host, si la sesión tiene acceso real a ese directorio. **GitHub CLI (`gh` + `git`)**: vía preferente de commits y push desde un checkout aislado **ya existente**, verificando credenciales sin imprimirlas. GitHub MCP/conector: excelente para readback remoto, PRs, comentarios, CI y cambios SOURCE, pero no concede filesystem/control local.
- **MANOJOS5 / MANOJOS3 Control Center:** sistemas externos gobernados, no shell arbitraria ni Kernel de NOSTROMO. Lectura: LIVE MANOJOS3 0.4.0, SQLite OK, LibreChat channel false. El intento de plan R0 sobre cuatro raíces NOSTROMO terminó `TYPED_PLAN_SCHEMA_INVALID` (run `run-6a276716-01d5-40c1-9f30-d716ced3220d`); NO repetir idéntico plan, NO afirmar acceso host. Usar sus capacidades tipadas solamente cuando admitidas y con receipts.
- **Drive:** carpeta LibreChat VX con delta, cinco documentos 00/10/20/30/40, índice, matriz 10 hojas/119 capacidades y 112 ideas. Separar los **120 requisitos `LC-R001…LC-R120`** del recuento histórico de 119 capacidades. Sólo actualizar filas con evidencia, no PASS masivo.
- **Modo Work:** reutilizar el chat del Work E3 si sigue disponible. No iniciar simultáneamente otro escritor. En Work web el host PC no se monta por disponer del conector GitHub; verificar dónde ejecuta realmente cada comando. Si no hay host, continuar SOURCE/CI y documentar `UNAVAILABLE_TOOL` exacto, nunca simular canario LIVE.

## ARQUITECTURA CANÓNICA (NO SEGUNDO SISTEMA)

`Usuario (PC/móvil) → LibreChat nativo (auth/ACL/Mongo/stream) → AgentClient nativo único → composición de contexto e intención preliminar → router de inferencia existente → proveedor autorizado (SIWC Plus consentido / 0€ verificado / Ollama on-demand) → salida del modelo → decisión semántica existente con validación del host → tools MCP NOSTROMO único o targets externos → readback/receipt → AgentClient → respuesta, persistencia Mongo y eventos al HUD nativo`.

**Dos decisiones distintas, no dos routers de modelos:**
1. **Proveedor/modelo**: `src/llm/inferenceGateway.ts`, `src/llm/siwcProviderRoutes.ts`, `src/librechat/nativeInferenceRouteAdapter.ts`, registro nativo del mismo AgentClient. Perfiles `RAPIDO/NORMAL/PENSAR/INVESTIGAR/VISUALIZAR/CONTEXTO_LARGO/VISION`; seleccionados por capacidad, contexto, privacidad, salud, quota, latencia, consentimiento, coste y disponibilidad LIVE, no por slug inventado. Separar `ZERO_COST`, `SUBSCRIPTION_SHARED` y `METERED`; no permitir `METERED` ni fallback facturable sin autorización explícita posterior.
2. **Intención/acción**: reusar `src/intent/intentInterpreter.ts` y `src/intent/nostromoDecisionBridge.ts`; señales pre-modelo baratas, acuerdo/autenticación y readback post-modelo, sin trabajo material si la intención no lo necesita. «Hola» con 11 herramientas disponibles NO obliga a investigar/ejecutar ni a cargar todos los esquemas.
**Autoridad:** LibreChat controla sesión/ACL; HOST_CONTROL tiene permisos propios; MANOJOS3 Policy/Kernel/Verifier/State independientes; VX13 y ORÁCULO independientes. El HUD `VXCockpitBridge.tsx`/`NostromoCockpit.tsx` es cabina observadora de eventos reales del mismo chat, no un segundo chat/runner/Kernel; minimizar modos forzados e interfaces duplicadas.

**SIWC:** usar SOLO OAuth OpenAI de app OSS con consentimiento por cuenta y sesión aislada. `GET /v1/models` con bearer del usuario, `POST /v1/responses` con `store:false`, `stream:true`, entrada/history explícita, instrucciones admitidas y eventos hasta `response.completed`; abortar/limpiar ante `response.failed/incomplete`, 429/refresh/revoke, sin texto falsamente finalizado. No incluir bearer en frontend/agente/receipts. No usar ChatGPT `backend-api`, API key pagada, OAuth falso, proxy SIWC externo improvisado, hosted MCP ni `tool_search`. Tools locales admitidas `function/custom` con nombre/call_id, resultado y permisos verificados en LibreChat. SIWC usa cuota compartida del plan, no «cero consumo».

**Contexto/memoria:** contar efectivamente instrucciones + historial reciente + esquema sólo de tools seleccionadas + resumen recuperable + reserva respuesta + overhead SSE, dentro de ventana REAL del modelo/proveedor. Leer valores efectivos de sumarización y pruning en upstream y `librechat.yaml`; `reserveRatio=0.05` no es reserva universal de salida y `80%` no es garantía del runtime. Persistir historial Mongo, usar resumen de información vieja + búsqueda selectiva en historial original/artefactos cuando haga falta. Mantener receipts completos en State; no truncarlos a 300 caracteres. Configurar memoria nativa sólo si contrato, recursos y proveedor realmente admiten extracción sin coste nuevo.

**Tool approval:** upstream fijado usa `endpoints.agents.toolApproval` con `enabled`, `mode`, `deny[]`, `ask[]`, `allow[]`. NO el `rules:[{match,action}]` de DeepSeek. `deny > ask > allow`; los grants de HOST_CONTROL siguen siendo independientes y vinculados a target/operación/TTL/preimagen. Un LLM ni la autorización verbal del chat crean un grant material. R0/R1 autónomo cuando esté admitido; R2/R3 solo con la autoridad realmente presente; bloquear **únicamente** ese efecto y continuar el resto.

## ÁRBOL CANÓNICO LÓGICO; NO CREAR O MOVER CARPETAS POR DEFECTO

| Ruta observada/reportada | Función objetivo | Acción por defecto |
| --- | --- | --- |
| GitHub `elkakas314/libre_chat_vx`, integración PR #54 | SOURCE Git única, CI y contratos | KEEP, cambios atómicos; promocionar main sólo tras gates |
| `~/librechat/upstream` | Único backend LibreChat instalado/activo | KEEP_ACTIVE; overlay reversible, no reset |
| `~/libre_chat_vx-clean` | Fuente/executable de MCP único + deltas únicos | KEEP_ACTIVE; semdiff de código y tests antes de relevo |
| `~/LibreChat` | Compose y datos Mongo/Meili/RAG sensibles | KEEP_ACTIVE_DATA; preservar volúmenes/binds |
| `~/librechat/nostromo` | worktrees/reports/backups existentes | REUSE, no duplicar |
| `~/upstream`, `~/vx-audit`, `~/vx-backup`, `~/nostromo-workspace-backup.gngRsx`, `~/bin` | posibles cambios únicos, referencias, utilidades | UNKNOWN_PRESERVE hasta lectura consumidores y semdiff |
| `~/librechat/vx` | reportada ausente | NO_RECREATE |
| `~/manojos_3`, `~/MANOJOS` | repos/productos ajenos | EXCLUDE, no borrar/cambiar |

**Regla física:** no crear nuevas raíces ni segundo checkout/backend/MCP/database. Reutilizar worktrees y staging **ya existentes** tras asegurar que no soportan procesos activos; usar directorios efímeros dentro de un staging existente solo si es indispensable, con limpieza controlada. Un único árbol **lógico** no exige colocar físicamente Mongo, Compose, secretos y Git dentro de la misma ruta. No mover/borrar datos en caliente, no interpretar `~/LibreChat` como carpeta redundante. Si se demuestra redundancia: primero snapshot y backup restaurado en aislamiento, consumidores, hashes, rollback, cuarentena reversible y solo luego eliminación autorizada del target exacto. Mantener `UNKNOWN_PRESERVE` mientras persista la incertidumbre.

## EJECUCIÓN AUTÓNOMA POR LOTES GRANDES (NO REINICIAR DESCUBRIMIENTO)

**L0 — READBACK DE CONTINUIDAD Y PERMISOS (acotado):** releer PR #54/HEAD/PR #57/issue #37, `CURRENT.json`, `HANDOFF_CURRENT.md`, `SPEC.json`, `TOPOLOGY.json`, matriz de requisitos y Work anterior. Verificar si E3 había dejado cambios locales no publicados; no perderlos. Ejecutar `bash scripts/nostromo-gh-work-preflight-r0.sh` desde checkout correcto; si `gh api` autentica y push true, reutilizar credencial. Verificar PIN upstream y SDK sin instalar. Leer receipts físicos EXISTENTES y sus hash antes de escanear; si no están, etiquetar missing (el issue #56 ya advierte recibos no localizados).

**L1 — SOURCE/CI:** comprobar run `44380439061` (source-check) y `44380437969` (native E2E) del commit `c33df354`; no asumir conclusión por estado `in_progress`. Reparar fallos restantes a nivel de causa, sin esconder errores cambiando la UI sin contrato. Ejecutar TypeScript, unit tests, pruebas SIWC, MCP, security/TOCTOU y nativo desktop/mobile sobre MISMA SHA. Si ya PASS, NO reescribir.

**L2 — SIWC NATIVO:** completar sólo enlaces realmente faltantes: resolver servidor por usuario autenticado, `app.locals.nostromoSiwc`, selección ANTES de `initializeAgent` cuando fija cliente/modelo, Responses fetch aislado por run, sesión/vault cifrada, consentimiento oficial, refresh/expire/revoke y fuga de secretos. Patch fuente con SHA exacto, preimagen y rollback. Tests en upstream descartable (ya existe material), no reemplazar el backend LIVE por un mock. Canario real autenticado con SSE terminal, tool function/call_id, modelo descubierto por cuenta y recuperación de conversación; si UI de consentimiento requiere interacción humana real, aislarlo y completar demás lotes.

**L3 — ROUTER, MEMORIA Y CARGA:** conectar `nativeInferenceRouteAdapter` al request real, con selección de proveedor y router semántico distintos pero sin duplicar; test «Hola»/consulta/investigación/tarea propuesta; 11 MCP seleccionadas (2 directas, 9 deferidas según readback previo) no implican 11 schemas en prompt. Ajustar contexto y memoria nativa/compactación sin segundo modelo facturable ni Qwen residente permanente. Medir primer token, tool schema, tokens y latencia; evitar loops de 300 s.

**L4 — MCP ACTIVO Y OPERACIÓN REAL:** semdiff `~/libre_chat_vx-clean/deployment/nostromo-mcp` vs repo; rescatar `nostromo_directorio_listar`, persistencia de jobs y tests únicos si son superiores y están autorizados. Verificar **un** MCP/terminal/productor de receipts; registrar y llamar dos tools R0 desde chat real y reconexión Mongo. Una tarea reversible R1/R2 legítimamente autorizada, con verificador independiente; no sustituir HOST_CONTROL por GitHub OAuth. Reconciliar `UNKNOWN_OUTCOME` antes de reintentar.

**L5 — INSTALACIÓN/PRODUCTIVO:** leer `systemd` unidades, PID/cwd/exe y rutas de modelos/config, Mongo/Meili/RAG mounts, API/version; pruebas de backup+restore aislado antes de cualquier manipulación de datos. Aplicar overlays mínimos CAS desde SOURCE elegida, preimagen SHA y reversión. Reinicios solo cuando necesarios y con grant real, postchecks PID/health/chats/MCP/DB/VRAM/RAM/swap. Nada de segundo backend o pérdida de `.env`/datos.

**L6 — EXPERIENCIA COMPLETA:** un chat/agente, HUD orgánico y foco contextual, visualización de estado/receipts vivos, desktop y móvil/PWA privado, reconexión, acceso fuera de casa solo por enlace privado si ya admitido; web research, Skills, archivos y búsqueda con herramientas nativas y 0€ verificado. No activar túnel público como sustituto de protección. Comprobar que Qwen/Ollama se descarga a demanda y que proveedor remoto no dispara cobros; si no hay modelo remoto cero coste, marcarlo CONFIG_GAP sin bloquear la ruta SIWC ni local.

**L7 — CONSOLIDACIÓN Y LIMPIEZA:** matriz origen→consumidor→código único→hash→destino lógico→KEEP/ARCHIVE_PROVEN/UNKNOWN_PRESERVE. No archivar runtime ni volúmenes activos. Para redundancias probadas, cuarentena reversible **sin tocar backups únicos ni datos históricos**; eliminación solo con grant y restauración probada. Contabilizar bytes recuperados realmente, no estimaciones.

**L8 — RELEASE/CI/CURRENT:** tras tests y canario LIVE de misma versión, publicar recibos exactos, actualizar `CURRENT.json` y `HANDOFF_CURRENT.md` por estado real, `docs/WORK_NOSTROMO_FINAL_EXECUTION_20261118.md`, matriz Drive 00/10/20/30/40 y status de issue #37. Completar PR #54; fusionar a `main` únicamente cuando SOURCE y HOST sean coherentes y no haya divergencias únicas ni CI roja. Nunca force-push, nunca borrar rama única.

**L9 — VALIDACIÓN FINAL Y RECUPERACIÓN:** dos turnos útiles reales, 2 MCP R0 más una operación segura gobernada, tool outputs visibles y persistidos, recarga de navegador, restart de aplicación/reboot **solo si realmente necesario y autorizado**, restore probado, PWA/móvil privado, latencia/contexto/consumos y costo/cupo. Cierre `VERIFIED` solo con receipts de mismo release HOST. Entregar handoff autosuficiente para futuro hilo sin reconstrucción masiva.

## CRITERIOS FORMALES DE CIERRE

| Gate | Prueba de aceptación | Evidencia |
| --- | --- | --- |
| `SOURCE_CI_EXACT_HEAD` | TypeScript/unit/security y CI completa verde SHA exacta | commit SHA + runs/jobs/artefactos |
| `NATIVE_VISUAL_DESKTOP_MOBILE` | misma cabina y contexto global, VX13/ORÁCULO/MANOJOS sin autoridad falsa | Playwright real/mock claramente diferenciado |
| `SIWC_OAUTH_NATIVE` | login consentido, modelos por cuenta, stream completo, revocación/limit handling y ACL | scope ID no secreto + SSE events + response.completed |
| `ROUTER_CONTEXT` | rutas verificadas, costes no facturables, «Hola» sin tools, contexto presupuestado | test + request/usage sanitizado |
| `MCP_CHAT_E2E` | mismo agente usa dos MCP R0 con call_id/input/output en chat REAL | receipt origin+Mongo+UI |
| `HOST_SINGLE_RUNTIME` | un backend, MCP, Mongo, servicios PID/CWD y config con HEAD atribuible | readback fechado y postrestart |
| `STATE_RECOVERY` | chat/tareas y memoria preservados tras recarga/reconexión | Mongo/readback y UI |
| `BACKUP_RESTORE` | backup y restauración probados en aislamiento | hash, comandos, checksum, prueba |
| `HUD_MOBILE` | eventos reales, continuidad móvil segura, sin duplicar UI | E2E/lectura de dispositivo |
| `CLEANUP_RECOVERABLE` | mapa de consumidores y datos activos intactos, redundancias recuperables | inventario PRE/POST y rollback |
| `MATERIAL_SAFE_ACTION` | operación reversible legítima, autorización real y readback | receipt exacto; UNKNOWN no es PASS |
| `COST_AND_RESOURCES` | sin gasto API no consentido, RAM/swap/VRAM/latencia observadas | config y métricas LIVE |

**Política de operación:** `inspect → diagnose → test → repair → verify → continue`. Aplicar cambios estrechos, separar lotes, `CHANGE→TEST→READBACK→VERIFY→RECEIPT`. Si una frontera `INTERNAL_REPAIRABLE/CONFIG_GAP/EXTERNAL_BOUNDARY/SECURITY_BOUNDARY/UNAVAILABLE_TOOL` bloquea una subfase, completar otras; solo pedir aprobación humana cuando la superficie real lo exija. No inventar PASS, no pedir repetir datos recuperables, no declarar «trabajaré en segundo plano» ni reiniciar el diagnóstico desde cero. No producir un plan sin ejecutar todo lo ya admitido.

## FUENTES TÉCNICAS OFICIALES PARA CONSULTAR (versiones efectivas mandan)
- OpenAI SIWC OSS: https://developers.openai.com/siwc/token-sharing-open-source
- SIWC preview: https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations
- SIWC model+SSE: https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference
- SIWC sesiones: https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions
- LibreChat Agents config: https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/agents
- LibreChat MCP/deferred: https://www.librechat.ai/docs/features/mcp
- GitHub CLI fine-grained: https://cli.github.com/manual/gh_auth_login
- GitHub token prefixes: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github
- GitHub MCP toolsets: https://github.com/github/github-mcp-server
- Work local vs cloud: https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex

**INSTRUCCIÓN DE ARRANQUE DEL NUEVO OBJETIVO:** entra en este mismo Work, lee este archivo remoto actualizado en PR #54, consulta HEAD/CI y tus receipts últimos, ejecuta el script R0 existente, **reanuda directamente el SIWC AgentClient pendiente y los gates de instalación**, sin inventariar otra vez 598 blobs ni crear carpetas por defecto. Cierra materialmente todo lo permitido. Si la sesión no tiene acceso real al Lenovo, deja SOURCE listo y el bloqueo HOST exacto, sin fingir instalación.
