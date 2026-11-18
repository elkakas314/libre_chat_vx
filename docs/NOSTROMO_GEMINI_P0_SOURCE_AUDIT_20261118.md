# NOSTROMO — reconciliación técnica del informe Gemini y solución P0 verificable
**Fecha:** 2026-11-18 · **Repo:** elkakas314/libre_chat_vx · **Rama:** integration/nostromo-canon-20261118-r1 · **PR:** #54 DRAFT.
**Fuente externa:** `docs/observaciones-externas/GEMINI_DEEP_RESEARCH_NOSTROMO_RECEIVED_20261118.md`.
**Verdad:** GitHub SOURCE verificado, Lenovo HOST **no verificado desde este chat**. Prohibido declarar PASS físico por commits o tests de fixture.

## Decisiones sobre el informe
| Gemini propone/afirma | Contraste contra SOURCE | Decisión |
| --- | --- | --- |
| Todos los esquemas llegan siempre al prompt en agents 4.0.1 | `LibreChat-AI/agents@v4.0.1` tiene `getActiveToolDefinitions` y `getEventDrivenToolsForBinding`, que filtran esquemas diferidos no descubiertos. `getToolsForBinding` puede tomar rama de instancias y necesita prueba. | Causalidad total RECHAZADA; investigar instancia/schema/caché con lectura real. |
| Crear `deferralFilter.ts` de parámetros `{}` y límite de 3 herramientas directas | Destruye firmas de herramientas, no prueba discovery, ni compone con package install. | **NO_APLICAR**. |
| Nuevos `nostromo_catalogo`, `terminal_preparar`, `terminal_ejecutar` | El catálogo SOURCE utiliza `nostromo_herramientas`, `nostromo_terminal_preparar`, `nostromo_terminal_ejecutar`. | Corregir nombres; no duplicar MCP. |
| Nuevo `config/nostromo-mcp.yaml` | Ya existe `deployment/nostromo-mcp/librechat-mcp.fragment.yaml`, con staging y tests. | Reutilizar el mecanismo existente. |
| Filtro `ExecStartPre` ya cargado en `vx-backend.service` | Ni unidad, ni hook están confirmados LIVE. Hay patch SOURCE `deployment/librechat-agents/deferred-instance-filter.mjs` que versiona v4.0.1 y modifica source+CJS+ESM mediante preimagen exacta, con tests de fixture. | R0 de servicio y paquete real. Sólo aplicar patch a build real con backup, CAS, canario, rollback; nunca forzar. |
| `npm run nostromo:check` como test E2E de MCP | Comando ejecuta `scripts/nostromo-preflight.mjs`: rutas, puertos TCP y git local. | Preflight R0; separar pruebas unitarias MCP (node/npm) y una llamada de agente real. |
| `mongosh...find(...).pretty()` como prueba | Puede revelar mensajes de usuario y no establece que respuesta corresponda al canario. | No ejecutar consulta que vuelque contenido; usar correlación de conversación e IDs privados, estado del turno, tamaño/flags y reload UI. |
| `unfinished:false` / `error:false` garantizan PASS | Depende de esquema real de mensajes/ramas y del resultado visible. | Prueba compuesta: terminal model finish + tool receipt + persistencia + recarga + ausencia de duplicados. |
| Rutas/VRAM/CPU, `keep_alive=5m` y «<60s» | Supuestos, no mediciones del Lenovo. | Medir driver, contexto REAL, RAM, swap, temperaturas, frío/caliente y TTFT; seleccionar según hardware. |
| Nuevo SQLite para tasks/memory | `deployment/nostromo-mcp/async-jobs.mjs` ya tiene ledger; Mongo mantiene conversaciones; LibreChat ofrece memoria, summarization/contextPruning. | **NO DUPLICAR** ledger/DB/scheduler. |
| «Activo/Configurado» para módulos de NOSTROMO | El repo aporta contratos/overlays, no confirma servicios y credenciales. | Etiquetar SOURCE/CONFIGURED/LIVE/VERIFIED separadamente. |

## P0: hipótesis que debe discriminar un único readback
- H1: `tool_options` del agente persistido no marcó defer o la cap `deferred_tools` no está admitida para el modelo/endpoint.
- H2: herramientas de instancia se enlazan saltándose la clasificación defer; comparar `getToolsForBinding`/registry con `getEventDrivenToolsForBinding`, código instalado CJS/ESM y patch preimagen/sha.
- H3: ~5302 es caché obsoleta de `toolSchemaTokens`, no el total realmente bound, o cuenta extras nativos (13 vs 11 MCP).
- H4: instrucciones/materiales del agente + esquema + historial superan maxContextTokens efectivo; summary/pruning sólo resuelven la porción historial, no tools.
- H5: el saludo sin tools que tarda >120s es fallo independiente provider/stream, swap o thermal, no necesariamente toolSchema.
Obtener por turno **sólo números/flags y hashes saneados**: agentVersion, selectedMcpCount, directCount, deferredCount, discoveredCount, nativeCount, boundCount, schemaTokensMeasured, schemaTokensCached, instructionTokens, historyTokens, summaryTokens, maxContextTokens, requestStage/finishState, durationMs y host metrics. Evitar prompt, tool schemas crudos, contenido Mongo, tokens.
Reutilizar `node scripts/audit-tool-context.mjs --input /RUTA_PRIVADA/snapshot.json` (NO es proof HOST por sí mismo).

## Configuración y continuidad
- Preferir Agent Builder nativo: seleccionar herramientas por turno, `defer_loading` efectivo, instrucciones base pequeñas; no suprimir capacidad necesaria.
- Memoria: claves breves verificadas + provenance/TTL; extracción automática sólo si sobrecoste medido; `summarization` y `contextPruning` para historial, no para schemas.
- Ollama Qwen 4B: validar modelo/quant/context por API readback; `keep_alive` bajo demanda y latencia fría/caliente; sin perfil GPU inventado.
- MCP NOSTROMO: catálogo 12 tools SOURCE; `nostromo_estado` siempre junto con `nostromo_herramientas`/`nostromo_auditoria_r0`; `nostromo_terminal_ejecutar` y trío async son modalidades exclusivas. R0 siempre que admisible, R2 sólo gate local externo y receipt+readback.
- GitHub Skill Sync ya conciliado 14 físicas, 12 stage1 explícitas, 10 stage2; no activar sin readback de ACL/sourceId/tenant, no importar 2 Skills opcionales.
- Mantener móvil, Tailscale/PWA/compañero Tentáculo/HUD, web search/scraping, Files/RAG, artifacts, manager de tareas, eventos. No mezclar con repos externos.

## Canarios en orden y aceptación
1. **R0 STATUS:** estado Git local remoto actual, servicios reales, archivo YAML/config sin valores secretos, Ollama /api/ps (identidad/modelo sólo si no sensible), MONGO health, MCP stdio y permisos sin mutación.
2. **CONTEXT:** snapshot de preflight con 0 clases ambiguas y esquema tool search funcional. Ajustar mínimo; no parche Gemini; test y rollback.
3. **CHAT:** «Hola» con resultado final del agente y Mongo persistido; medir TTFT/total y error; confirmar tras reload.
4. **MCP:** `nostromo_estado` invocado por el agente, resultado propio del MCP y texto final, guardado y visible tras reload; R2 denegada sin grant.
5. **PERF:** 2 turnos corto/largo, frío/caliente, CPU/GPU/RAM/swap; no umbral arbitrario de 60 s como PASS contractual, comparar baseline y utilidad.
6. **RESTO E2E:** router perfil/modelo con salud/capacidad/cuota/coste frescos, continuidad móvil, background job y recovery; demás módulos con etiquetado honesto.
**Cierre:** mantener PR #54 DRAFT hasta HOST E2E con receipts; GH branch fast-forward y readback SHA de remoto.
