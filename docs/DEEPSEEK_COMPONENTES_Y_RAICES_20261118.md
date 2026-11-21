# DEEPSEEK — mapa SOURCE por componente y raíces físicas reportadas

**Documento de lectura, no instalador.** Base funcional a congelar `6f205d8a2a8cae833a5a0fa3ac6b30d6a641674a`. **Reglas de evidencia:** `LIVE/VERIFIED` solo con readback de servicio/DB/turno/receipts; una prueba de stub/CI es `SOURCE_TESTED`. Las rutas son Lenovo **HOST_REPORTED** en issue #37, #56 y documentos históricos; este informe NO ha abierto el home del usuario. Si un componente falta en LIVE, **buscar en estas raíces con alcance R0** antes de implementarlo de cero.

## A. Mapa de las piezas de verdad en este repositorio

| Núcleo / paso | Archivos principales en la base SOURCE | Quién debe ser propietario del estado/efecto | Gap y prueba exacta sugerida |
|---|---|---|---|
| UI Chat/Agent Builder | LibreChat upstream `f10b1d91…`, `overlay/upstream/VXCockpitBridge.tsx`, `src/librechat/nativeSurfaceBinding.ts` | LibreChat autenticado + Mongo | Overlay/cabina parcial LIVE; sesión, agente persistido e identidad R0/readback |
| Identidad/UX NOSTROMO | `src/ui/NostromoCockpit.tsx`, `src/cockpit/{currentFocus,referentialContinuity,statusRail,truthLanes}.ts` | Única identidad NOSTROMO/AgentClient | Comparar Cockpit avanzado vs Bridge realmente servido; no crear segundo chat |
| Modelo SIWC | `src/llm/{chatgptAuthorized,siwcLoopback,siwcIdentity,siwcSession,siwcProtectedVault,siwcConnectionService,siwcResponsesClient,siwcOpenAiFetch,siwcProviderRoutes}.ts` | Usuario autenticado + backend server-only (bóveda); OpenAI OAuth solo infiere | PKCE/JWKS/vault/refresh/catálogo + ciclo SSE real + callback + tests de separación multiusuario; consent LIVE pendiente |
| Proveedor remoto gratuito | `src/llm/{cloudflareAiGateway,providerStatus,modelRegistry,nostromoHybrid}.ts`; `config/{cloudflare_ai_gateway,provider_candidates,nostromo_hybrid}.current.json` | Ruta de inferencia del host | SOURCE != gateway/credenciales/cuota configuradas; no facturación inesperada |
| Enrutado LLM native | `src/librechat/nativeInferenceRouteAdapter.ts`, `src/llm/inferenceGateway.ts` | LibreChat/AgentClient; no Modelo | Hook exacto upstream, route chosen, contexto, model catalog/plan validado; elegir antes de fijar LLM |
| Parchado AgentClient | `deployment/librechat-agents/agentclient-siwc-binding.mjs`, `src/llm/siwcOpenAiFetch.ts` | Fuente upstream fija + parche idempotente/reversible | Archivo `api/server/services/Endpoints/agents/initialize.js` con anclas/hash; script restringido a CI, no host; en `6f205d8` CI canaria FAIL |
| Semántica/intención | `src/intent/{intentInterpreter,nostromoDecisionBridge}.ts`, `src/conversation/conversationPlane.ts` | Host y runtime de NOSTROMO, no token del modelo | Clasificación pre-LLM barata + decisión post-modelo con acuerdo; no inducir TOOLS en todo turno |
| Prompt y coste contexto | `scripts/audit-tool-context.mjs`, `src/conversation/clientCompaction.ts`, `src/llm/responseContract.ts` | Native message assembly; presupuesto por modelo | Preflight de hola con pocos tokens y 0/1 schemas, reserva salida; tool deferral real vs catálogo Builder |
| Historial/memoria | LibreChat `api/server/services/Endpoints/agents/initialize.js`; `src/cockpit/shortMemory.ts`, `config/librechat-vx.example.yaml` | Mongo chats/checkpointer + memoria native user separada | YAML read ≠ YAML efectivo; `memory`/permissions/resumido/pruning sin auto Qwen |
| MCP terminal y async jobs | `deployment/nostromo-mcp/{server,policy,inspect,audit,async-jobs}.mjs`, `deployment/nostromo-mcp/tests/*` | MCP activo único y state externo propietario | Semdiff vs `~/libre_chat_vx-clean`; tool call genuino `nostromo_estado`, no texto simulado |
| Host Control independiente | `src/host/hostControlBridge.ts`, `deployment/host-control/README.md`, `config/host_recovery.current.json` | HOST_CONTROL, separado de MANOJOS3 Kernel | Operaciones amplias sobre PC mediante permisos propios y readback; token GH fine-grained no es autorización host |
| Gobernanza/targets | `src/targets/targetGateway.ts`, `src/adapters/*`, `src/librechat/approvalBridge.ts` | MANOJOS3 Policy/Kernel, VX13 Link/Madre, ORÁCULO advisory | No duplicar autoridades; plan, target, scope, grant, receipts y UNKNOWN_OUTCOME |
| Plugins/Skills | `skills/*`, `plugins/vx-nostromo/*`, `config/skills.current.json` | Native LibreChat Skills; autorización independiente | Skill disponible ≠ herramienta instalada/permiso |
| Ficheros/RAG | `src/files/*`, `src/resources/*`, `src/ui/{FilesPanelView,ResourceTreeView,ArtifactDockView,InteractiveArtifactView}.tsx` | LibreChat native Files/RAG + ACL; datos Compose | Verificar lectores/búsquedas/previews vs contrato UI; no duplicar RAG |
| Investigación/navegación | `src/research/researchPolicy.ts`, `src/browser/browserView.ts`, `src/ui/BrowserPanelView.tsx` | LibreChat native Web Search/Browser, restricciones de egress | Fuente pública actual vs readback local, navegadores con consentimiento |
| Visor avanzado + Tentáculo HUD | `src/ui/{NostromoCockpit,CockpitShell,ContextInspectorView,StatusRailView,TentaculoHud,TentaculoHub,TargetRunView,PlanGraphView,ActiveFlowView}.tsx`, `src/cockpit/*` | React en LibreChat, proyecciones solo lectura | Bridge simplificado usa `projectTentaculoHud([])` y snapshot SOURCE; falta alimentar eventos LIVE sin UI que invente ejecución |
| Reanudación / tareas | `src/librechat/resumableBoundary.ts`, `src/recovery/*`, `src/ui/BackgroundTasksView.tsx`, `src/events/agentEvents.ts` | Checkpointer/job store único; backend | Reconnect sin duplicar llamadas materiales; status job/receipt independiente de stream |
| Móvil/PWA/voz | `src/mobile/*`, `src/ui/PhoneModuleView.tsx`, `src/audio/audioPanel.ts`, `config/mobile_access.current.json` | Misma sesión/ACL LibreChat y Tailscale Serve privada | App móvil autenticada, voz independiente SIWC, no segundo backend |
| Overlay / QA / recuperación | `scripts/{audit-local-librechat,reconcile-native-visual,reconcile-existing-workspace,nostromo-layout}.mjs`, `ci/nostromo-stage-clean-overlay-ci-only.mjs`, `docs/WORK_NOSTROMO_FINAL_EXECUTION_20261118.md` | Work del host + Git CI + backups | Reconciliación idempotente, base SHA/copy preimagen/rollback, no reemplazar árbol dirty ni crear doble runtime |

## B. Inventarios distintos: NO reducir a un único porcentaje

- **Drive, matriz maestra documentada** en [`docs/NOSTROMO_INTEGRATION_CANON_20261118.md`](NOSTROMO_INTEGRATION_CANON_20261118.md): 10 hojas / **119 capacidades**: 69 desarrolladas, 39 reuso upstream y 11 diferidas; son **categorías declaradas**, no 119 PASS material ni necesariamente corte fresco.
- **GitHub** `docs/REQUIREMENT_LOCATION_MATRIX_CURRENT.md`: **120 IDs** `LC-R001…R120` de requisito→rutas, gran parte `DOCUMENTED/SCAFFOLDED`.
- **GitHub** `docs/NOSTROMO_FEATURE_MATRIX_CURRENT.md`: **39 filas** de funciones agregadas en `SOURCE`, no 39 funcionalidades host verificadas.
- **GitHub** `SPEC.json` y `TOPOLOGY.json` contienen contratos de capas/cuentas/rutas, no inventario LIVE exhaustivo.

**Inventario a entregar al final**: `capability_id;name;native_reuse;owner;source_commit;path;installed_hash;actual_process;effective_config;DB_state;contract_tests;LIVE_canary;receipt;state;blocker;next_action`. Alinear IDs de Drive/LC-R/feature por correspondencia, no renombrar ID sin justificación.

## C. Árbol físico Lenovo: evidencia reportada y riesgos

```text
/home/elkakas314/
├── librechat/
│   ├── upstream/                   BACKEND PRODUCTIVO activo (NO pisar)
│   │   ├── packages/librechat-vx/    Paquete instalado: comprobar SHA/diff
│   │   └── client/src/components/VX/ Bridge+CSS; state.ts/spec host únicos
│   ├── vx/                         Checkout SOURCE histórico; después reportado ABSENT
│   ├── nostromo/                   Tools/backups/worktrees/reports/handoffs/staging
│   ├── data/                       RUTA HISTÓRICA; existencia/consumidor no verificados
│   └── logs/                       RUTA HISTÓRICA; existencia/consumidor no verificados
├── libre_chat_vx-clean/            SOURCE MCP ÚNICO actualmente consumido (NO pisar)
│   └── deployment/nostromo-mcp/    Server stdio, inspect, async-jobs, etc.
├── LibreChat/                     CASING DISTINTO; COMPOSE y DATOS ACTIVOS (NO borrar)
│   ├── data-node/                  bind mount Mongo a /data/db según receipt histórico
│   └── meili_data_v1.35.1/        bind mount Meilisearch según receipt
├── upstream/                      TERCER checkout LibreChat independiente; .env propio
├── vx-backup/                     Backup histórico; no deducir duplicado
├── vx-audit/                      Auditorías/receipts
├── bin/                           Comandos/wrappers; leer consumidores
├── nostromo-workspace-backup.2jGTrK/
├── nostromo-ui-backup.s5cE3siD/
├── nostromo-backup.ceBhjB8V/
├── nostromo-frontend-deps-backup.fDbtdf/
├── nostromo-workspace-backup.gngRsx/
├── Documentos/nostromo_e2_*.sh   Scripts históricos, comparar con CLI vivo
└── .local/state/nostromo/jobs/    Persistencia candidata de trabajos MCP
```

**Dato MATERIAL histórico clave recuperado de issue #37:** comentario [#6960522779](https://github.com/elkakas314/libre_chat_vx/issues/37#issuecomment-6960522779) documenta `~/LibreChat` como Compose activo: `chat-mongodb` bind mount `/home/elkakas314/LibreChat/data-node:/data/db`, `chat-meilisearch` `.../meili_data_v1.35.1:/meili_data`, además `rag_api` y `vectordb`/volumen Docker. **No clasificar `~/LibreChat` como copia vieja ni moverla sin plan de mount/data migration probado.** Backend `~/librechat/upstream` consume estos servicios, aunque resida en otra raíz. Recibo anterior [#6970744060](https://github.com/elkakas314/libre_chat_vx/issues/37#issuecomment-6970744060): varios filenames de receipts citados no estaban en la carpeta esperada: **no considerar un receipt reutilizable sin `exists/read` real**.

El proyecto `manojos_3` (~50 GiB reportados), `MANOJOS`, `oraculo-operator`, `oraculo-archive` **son externos**, no basura de LibreChat; no mezclar ni limpiar.

### ¿Dónde buscar lo que «falta en LIVE» ANTES de duplicar SOURCE?

| Hueco | Rutas/fuentes que confrontar mediante solo lectura | Evidencia material necesaria |
|---|---|---|
| Provider SIWC | `~/librechat/upstream/packages/librechat-vx`, `~/libre_chat_vx-clean/src/llm/siwc*`, repo congelado, `.env`/YAML del backend SOLO presencia | Hook server import/middleware, session userId, vault host secret, modelo autorizado, despliegue real |
| Agent Builder | Mongo, unidad `vx-backend.service`, upstream `api/server/services/Endpoints/agents/initialize.js` | Agent ID/provider/model/context/tools/deferred, sanitized; SHA de código ejecutado |
| Memoria/compactación | Mongo/checkpoints, YAML efectivo, `src/cockpit/shortMemory.ts`, frontend | UserMemory permissions, config, extractor/provider real, límites y resúmenes persistidos |
| MCP/async jobs | `~/libre_chat_vx-clean/deployment/nostromo-mcp`, `~/librechat/upstream`, `~/.local/state/nostromo/jobs` | proceso PID/argv/cwd, tools exported, tool call trace e idempotency |
| Interfaz y visor | `~/librechat/upstream/client/src/components/VX`, `~/librechat/upstream/packages/librechat-vx/src/ui`, `~/libre_chat_vx-clean/overlay` | hashes diferenciales de Bridge CSS y `state.ts/state.spec.ts` exclusivos, screenshot UI autenticada |
| RAG/búsqueda | Docker Compose `~/LibreChat`, Mongo binds, Meili y vectordb volume | mounts `docker inspect`, indexes, servicio disponible, DB backups |
| Scripts/rutas | `~/upstream`, `~/librechat/vx` si existe, `~/bin`, `~/Documentos`, `~/librechat/nostromo/tools` | referencias activas por systemd/PID/env, revisiones exclusivas, backups |

## D. Propuesta de árbol lógico final, NO mover datos a ciegas

```text
NOSTROMO — producto lógico único (no root físico obligatorio)
├─ SOURCE (un checkout Git canónico, worktrees temporales aislados)
├─ LIBRECHAT_RUNTIME (un upstream fijado y su overlay)
├─ DATA (Mongo, Meili, RAG, volúmenes Docker con mounts conservados)
├─ MCP_TERMINAL (un proceso, con registry y persistent jobs)
├─ HOST_CONTROL (plano independiente y sus permisos; nunca kernel alternativo)
├─ CONFIG_PRIVADA (secrets por usuario/servicio, no repo público)
├─ EVIDENCE (reports, receipts, logs retenidos)
└─ BACKUP + ROLLBACK (restauración probada, no sólo ZIP)
```

`scripts/nostromo-layout.mjs` ya establece `~/librechat/nostromo/{worktrees,tools,backups,runtime,reports,handoffs,manifests,staging,cache,tmp,legacy}`. **No añadir otro «canonical root»** por hábito. `scripts/reconcile-native-visual.mjs` exige `~/librechat/vx` al ejecutar APPLY, pero el último Work reportó ruta ausente; resolver **con comprobación de consumidor + rutas canónicas** sin quitar garantías CAS/rollback ni pisar checkout sucio. Consolidación física solo al final con backup probado y permisos exactos.

## E. Auditoría incremental R0 mínima para Work futuro (NO para DeepSeek en remoto)

Solicitar readbacks de host **solo a Work**, no fingir que los proporciona GitHub:
- `realpath`, `stat` dev/inode/owner/perms de raíces conocidas, `git status --porcelain=v1 -uall` resumido y `git rev-parse HEAD`; no hash masivo de 50 GB.
- PID `/proc/PID/{cwd,exe,cmdline}` sanitizado; `systemctl --user show` WorkingDirectory/ExecStart filtrados; Docker Compose `docker inspect` binds/vols para Mongo/RAG/Meili; Mongo Agent Builder campos **no secretos**; `LIBRECHAT_CONFIG_PATH` y demás overrides solo **presencia/selección**, nunca `.env` plano.
- Capturar `target sha|base sha|installed sha|unique delta|active consumer|backup restore proof|disposition` por componente.
- Clasificar `KEEP_ACTIVE / KEEP_DATA / KEEP_SOURCE / UNKNOWN_PRESERVE / ARCHIVE_PROVEN / QUARANTINE_CANDIDATE`.
- Comparar variaciones de código **por blob/hash y semdiff**, no copiar directorios o `node_modules` recursivamente.
- Primero sacar de raíces históricas los bytes ÚNICOS, después comprobar que el nuevo runtime funciona, y solo entonces cuarentena reversible para lo redundante probado. Borrado definitivo R3 exacto aparte.

Ver también [issue #56](https://github.com/elkakas314/libre_chat_vx/issues/56) y [docs/NOSTROMO_RECLAIM_GB_EXECUTION_CURRENT_20261118.md](NOSTROMO_RECLAIM_GB_EXECUTION_CURRENT_20261118.md). El propósito de esta investigación es **que DeepSeek indique dónde falta cableado, no que invente que hay un archivo en el Lenovo por estar nombrado aquí**.
