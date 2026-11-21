# GEMINI DEEP RESEARCH — AUDITORÍA TÉCNICA Y CÓDIGO NOSTROMO × GITHUB × DRIVE
**18-11-2026. Encargo autosuficiente, listo para pegar en Gemini Deep Research.**
**Rol:** auditor senior de LibreChat, agente conversacional/MCP, routing LLM, inferencia GPU local y sistemas Linux de bajo consumo; investigador adversarial con fuentes verificables y programador de parches. NO eres el ejecutor del Lenovo ni debes atribuirte capacidad de escritura sin readback.

## Contexto de fuentes y jerarquía
**Repositorio público real:** https://github.com/elkakas314/libre_chat_vx
**Rama activa:** `integration/nostromo-canon-20261118-r1`; PR #54 DRAFT https://github.com/elkakas314/libre_chat_vx/pull/54; recibos host y evolución: https://github.com/elkakas314/libre_chat_vx/issues/37 .
**IMPORTANTE**: haz GET HEAD real ahora. Antes de esta consulta el código de reparación se publicó en `fcc4af8f6ae268bd566e7e44c459e8b42d7defae`; la rama habrá avanzado al publicar este documento. No inventes SHAs.
**LibreChat upstream exactamente fijado:** https://github.com/LibreChat-AI/LibreChat/tree/f10b1d91f1eee3a2c82d5247bf620351486b7c1b
**Agente npm EXACTO:** https://github.com/LibreChat-AI/agents/tree/v4.0.1 (`@librechat/agents@4.0.1`). Verifica funciones y límites de ESE tag, no upstream latest.
**Drive (en tu cuenta conectada, NO público):**
1. Maestro LibreChat NOSTROMO: https://docs.google.com/document/d/1OwadKf4vBKJyRx5Pe3QB2HgjqJlSe2xb52TT7nK3Scc/edit
2. CURRENT / cortes operativos: https://docs.google.com/document/d/1cX4ld93Db6dPFv-F5iAiyXu2QhR5U8vuWZJPMSCQhE0/edit
3. Handoff: https://docs.google.com/document/d/1lrhx64J3hW7iW_qeGOw_fJw67rp_M-2EY_65Go2tMPY/edit
4. Delta GitHub×Drive×HOST: https://docs.google.com/document/d/1oOiFTIrMD5Lnd05frGZ3HuZf3LgZHBEnAdhkoZvOwFA/edit
Inspecciona sólo docs realmente accesibles. Trata las páginas históricas como antecedentes y separa estado LIVE vs documentación. Si no tienes acceso a uno, dilo; no sustituyas con suposiciones.
Selecciona **Google Search/Web y Drive/Docs** como fuentes de Deep Research y **revisa/corrige el plan de investigación antes de ejecutarlo**. No hace falta consultar Gmail/Chat para este encargo, salvo que aporten una evidencia directamente necesaria y autorizada.
PRECEDENCIA: readback de host fechado/correlacionado > código material local > GitHub SHA exacto/CI > Drive CURRENT corroborado > handoff > diseño > inferencia. Documentación Drive privada jamás debe publicarse íntegra en repo público; entrega sólo hallazgos no sensibles y enlaces Drive en informe privado.

## OBJETIVO FINAL REAL (NO RECORTAR AL LLM)
NOSTROMO es la única identidad conversacional sobre LibreChat; opera con voz/texto natural en español, continuidad móvil/PC, contexto, Files/RAG, Web Search/scraping seguro, browser cuando procede, Artifacts/visualizaciones, gestor de tareas y background jobs, Agent Events, Subagents cuando son nativos, Tentáculo HUD/Hub, Decision Inbox, recovery, ventanas, accesos remotos gobernados. No reconstruir lo que LibreChat upstream ya suministra.
Prioridad operativa: **conversación ágil y fluida de un solo agente → interpretación de intención/objetivo → selección de herramienta y LLM / GPU local opcional → ejecución por MCP único o cliente de sistema externo → readback y receipt → continuidad**.
La autonomía es detectar capacidades instaladas, decidir, proponer 1–3 mejoras útiles por eventos, ejecutar lo autorizado, reintentar sólo ante certeza de ausencia de efecto, recuperar estado y detener únicamente fronteras humanas. NO pide nombres internos de herramientas/IDs al usuario. NO inventa autorizaciones. NO debe levantar segundo Kernel/Governor/router/TaskLedger/daemon/MCP/frontend.
HOST Lenovo Linux/Kubuntu de recursos limitados, GeForce 840M ~3 GB VRAM ocupado por modelo Ollama Qwen 4B, num_ctx efectivo reportado ~6144, latencia alta. El modelo GPU local se usa a demanda cuando de verdad mejora latencia/coste; no obligar a estar siempre encendido ni despertar llama-server para tareas que no lo necesitan. No inventar GPU física distinta, VRAM, disponibilidad de APIs gratis ni tiempos. Evaluar swaps si/so, PSS/RSS, thermal throttling, cargas persistentes y first-token/total latency. No subir num_ctx ciegamente ni inferir saturación por RSS.

## INSPECCIÓN OBLIGATORIA DE CÓDIGO
`agents/nostromo-autonomo/agent.candidate.json`, `skills/nostromo-core/SKILL.md`, `skills/nostromo-autonomo/SKILL.md`;
`src/intent/{intentInterpreter,nostromoDecisionBridge}.ts`;
`src/llm/{inferenceGateway,modelRegistry,providerStatus,nostromoHybrid,chatgptAuthorized,siwcSession,siwcIdentity,siwcResponsesClient,cloudflareAiGateway}.ts`;
`deployment/nostromo-mcp/{server,tools,directory,policy,async-jobs,inspect}.mjs`, `deployment/librechat-agents/deferred-instance-filter.mjs`;
`src/conversation`, `src/targets`, `src/events`, `src/mobile`, `src/hud`, `src/cockpit`, `src/ui`, `src/research` (lista archivos reales, no infieras por el directorio);
`config/{model_registry,nostromo_hybrid,chatgpt_authorized,librechat-vx.example}.current.json` cuando existan, `config/librechat-vx.example.yaml`;
`docs/{SEMANTIC_MODEL_CURRENT,WEB_RESEARCH_STACK_CURRENT,WORK_NOSTROMO_FINAL_EXECUTION_20261118,DEEPSEEK_WEB_CODING_MISSION_NOSTROMO_20261118}.md`;
`scripts/audit-tool-context.mjs`, `tests/model-registry.test.ts`, `tests/nostromo-decision-bridge.test.ts`, `package.json`, GitHub Actions, issue #37.
Si una ruta no existe o no puede leerse: NO INVENTAR; usar /contents o RAW del SHA exacto; marcar MISSING/UNREADABLE.

## RESEARCH TRACK A — PRIORIDAD P0: AGENTE / MCP / PERFORMANCE REAL
Reconciliar el fallo de preflight reportado: 13 esquemas ~5302 tokens + instrucciones ~3152 > ventana 6144. La selección builder reportada fue 11 herramientas MCP, 8 diferidas y 3 directas; esto NO explica por sí solo por qué el request tenía 13. También hubo dos llamadas MCP R0 con respuesta final (~5 min) y un turno trivial «Hola» que no completó en 120s. Investigar causalidad por etapas, no deducir que falló Ollama antes del preflight.
**CRÍTICO**: la propuesta anterior DeepSeek fue RECHAZADA: proponía mutar `this.toolDefinitions` y un test `assert.ok(true)`; no reproducirla. En `@librechat/agents@4.0.1` existen `getActiveToolDefinitions`, `getEffectiveToolDefinitions`, `getEventDrivenToolsForBinding`, `calculateInstructionTokens`. Inspecciona ruta de instancias, registry overrides, cached toolSchemaTokens, tool_search y conteo presupuesto. Demuestra en el tag exacto lo que sí se filtra y qué rutas pueden omitirlo. El P0 requiere dos canarios del HOST: «Hola» con texto final persistido y una llamada MCP read-only con receipt y persistencia tras reload.
Identifica **un único defecto causal o una matriz de hipótesis verificables** y el probe no sensible que distingue entre ellas. Propón patch mínimo sólo cuando haya prueba suficiente; si el diagnóstico depende del host, produce script de diagnóstico R0 no invasivo y gate Work.

## RESEARCH TRACK B — MODELO LOCAL GPU Y ROUTER LLM
Examinar Ollama con contexto EFFECTIVE (no solo `num_ctx` configurado), memoria, KV cache, tokenizer, prompt/template, tiempo primera respuesta, total, selección de modelo ligero vs cloud gratis permitido, amortización de wake, unload idle. Configurar costes 0: Cloudflare AI Gateway BYOK no implica gratis, SIWC ChatGPT Plus/Pro consume cuota compartida con Work/Codex; modelos públicos no equivalen a disponibles. Comparar herramientas nativas LibreChat y APIs soportadas, no inventar providers. Resolver perfiles RAPIDO/NORMAL/PENSAR/INVESTIGAR/VISUALIZAR/CONTEXTO_LARGO/VISION, health/quota/capability/privacy/context freshness, no auto fallback pago. Inspeccionar cambios nuevos `fcc4af8` para detectar regresiones o gaps: modelos sin capacidad, VRAM/contexto insuficiente, preferLocalVoice en tareas complejas.
OAuth opcional SIWC: primero documentación oficial vigente en https://developers.openai.com/siwc/token-sharing-open-source ; analizar limitaciones de Responses vs MCP local; OAuth expreso humano, nada de cookies web, tokens a logs o API facturable.

## RESEARCH TRACK C — CATALOGO DE MÓDULOS Y END-TO-END
Mapa REAL de familias y cables:
1. LibreChat nativo conversación/agents/tools/builder/ToolSearch/Skills/Subagents/Artifacts;
2. modelo local GPU + LLM gateway/router + fallback gratis;
3. único MCP NOSTROMO (R0, R2 gobernado, allowlist, async jobs/UNKNOWN_OUTCOME);
4. gestor de tareas: LibreChat background, Task Inbox, Agent Events y workflows, sin duplicar scheduler;
5. web Search, scraping/extracción pública, investigación, browser limitado, prompt injection;
6. móvil: misma Mongo/session/backend, Tailscale/TLS/PWA/continuidad offline-read-only/reconnect;
7. HUD Tentáculo/Hub/cockpit/ventanas/decisiones y tarjetas de proveedor;
8. archivos/Drive/RAG/referencias/artefactos;
9. MANOJOS3, VX13 y ORÁCULO como EXTERNOS independientes, sin autoridad NOSTROMO;
10. recuperación/observabilidad/backup seguro/receipts/versiones/limpieza.
Para cada familia: ruta SOURCE, dependencias entrantes y salientes, gobernanza, pruebas existentes, huecos SOURCE, necesidad de host LIVE, coste RAM/CPU/GPU, decisión KEEP/FIX/DEFER/REMOVE_DUPLICATE. NO reemplazar módulos que ya existen.

## INVESTIGACIÓN EXTERNA
Priorizar fuentes primarias actuales 2026 de LibreChat pinned (commit exacto), @librechat/agents v4.0.1, documentación MCP (tool_search/defer metadata), Ollama contexto/cache/unload/benchmark, Google Gemini API/Workers AI/Groq/OpenRouter cuotas reales y SIWC. Verificar fecha de cada hallazgo, enlaces, versiones, requisitos/hardware; marcar incompatibilidades y planes potencialmente facturables. Reddit/blogs sólo como experiencia no contractual. No recomendar dependencia de pago ni instalar stack nuevo por inercia.

## ENTREGABLES QUE NECESITO DE TI
**D1 — Informe maestro listo para integrar:** Google Doc titulado «NOSTROMO • Gemini Deep Research • SOURCE × DRIVE × HOST • 2026-11-18», con resumen ejecutivo (máx 1 página), mapa modular, matriz de contratos y flujos de extremo a extremo, 10 principales gaps ordenados por severidad, pruebas/métricas/gates y lista de fuentes enlazadas. Si no puedes crear Google Doc, devuelve texto íntegro, no una promesa.
**D2 — Tabla de hallazgos verificables:** ID, prioridad P0/P1/P2/P3, claim, archivo+líneas+SHA GitHub o doc Drive, fuente externa, prueba que falta, recomendación mínima, riesgo/regresión, coste de operación.
**D3 — PARCHES**: para los 2–4 cambios SOURCE más útiles y reproducibles, devuelve `diff --git` completo con contexto auténtico, tests que NO sean placeholders, comandos `node --test`/`npm run build`, y rollback; si no puedes validar lo ejecutado marca `NOT_RUN`. Primero patch P0, sin inventar host.
**D4 — Handoff Work**: pasos para el MISMO Work pausado, distinguir 1) inspect 2) diagnose 3) repair 4) E2E 5) readback 6) verify 7) cleanup; minimiza comandos y explica gates humanos reales.
**D5 — DECISION MATRIX**: mínimo 3 perfiles de ejecución: (i) solo local 4B, (ii) híbrido con cloud gratis demostrado, (iii) OAuth SIWC sólo autorizado; qué hacer con quotas 0, proveedor ausente, contexto insuficiente y modelo dormido. No scores inventados.
**D6 — CONTINUIDAD**: CURRENT privado Drive/plan de sincronización con GitHub por SHA, backlog ordenado de parches, sin exponer datos de Drive o secretos en Github público.

## REGLAS DE CALIDAD
- No recrear lo existente. No generar tutorial en lugar de evidencia/código.
- Cada cifra MEDIDA / DOCUMENTED / ESTIMATED, sin confundir.
- Afirmar PASS sólo con salida del test o readback comprobable; no claim host LIVE desde GitHub CI.
- No cambiar `main`, no crear otro Work, no tocar Mongo/host.
- Nunca añadir autorización material al agente de lenguaje; target owner es la frontera.
- Si acceso web no permite leer o programar, decirlo y producir instrumento de diagnóstico/patch aplicable; prohibido reportar commit ficticio.
- **Primera respuesta debe enseñar plan de fuentes y baseline SHA, después investigación; resultado final debe contener informe y código o un gap explícito.**

## ANEXO GEMINI: auditoría oficial de agentes y plugins (18/11/2026)
Antes de tu informe, lee docs/NOSTROMO_AGENTS_PLUGIN_CONFIGURATION_AUDIT_20261118.md del mismo HEAD. Audita Agent Builder, tool_options.defer_loading y herramienta ToolSearch efectiva; correlaciona 11 herramientas seleccionadas versus 13 schemas, maxContextTokens efectivos, cached toolSchemaTokens, contexto 6144, memoria versus summarization/contextPruning y coste de llamadas. Audita 14 Skills físicas: 10 canónicas, 2 legacy, 2 procedimientos opcionales de agentes; stage 1 selecciona 12 rutas explícitas y stage 2 diez; no importar Skills opcionales sin dueño. Revisa la diferencia entre opciones de documentación oficial actual y upstream pinned, no inventes parámetros. Cruza con Drive Maestro, CURRENT, Handoff y Delta. Entrega informe privado en Google Docs, matriz de evidencia por SHA y 2-4 parches auténticos con pruebas (o NOT_RUN). No actives sync, no mezcles MANOJOS3/VX13/ORÁCULO, no publiques Drive privado en repo público.
