# NOSTROMO — RESULTADO SOURCE Y CONTRATO DE CONTINUIDAD, 18-11-2026

## Decisión
La prioridad ahora es terminar el E2E del agente nativo LibreChat con único MCP + routing/modelo local de bajo consumo. NOSTROMO también tiene módulos de móvil/continuidad, tareas, web/search/scraping seguro, HUD, Artifacts, Files/RAG y conexiones externas. Estos módulos NO deben eliminarse ni reconstruirse por optimizar el agente.

## Evidencia inspeccionada (no equivalen a host LIVE)
- GitHub rama `integration/nostromo-canon-20261118-r1`, PR #54 DRAFT; main preservada.
- Drive Maestro/CURRENT y delta de 18/11 contienen diseño y cortes desfasados; no prevalecen sobre SHA GitHub o readback HOST.
- Upstream LibreChat `f10b1d91f1eee3a2c82d5247bf620351486b7c1b`; @librechat/agents v4.0.1.
- `src/intent/intentInterpreter.ts` y `src/intent/nostromoDecisionBridge.ts`: puente pure SOURCE no prueba wiring runtime.
- `src/llm/inferenceGateway.ts` y `src/llm/modelRegistry.ts`: ruta ZERO_COST con evidencia requerida, pero el plan pool NO verificaba capacidades/contexto antes de la corrección del corte.
- `src/llm/nostromoHybrid.ts`: preferencia local voice podía forzarse mediante llamada directa a chooseHybridLane en objetivos no conversacionales; corregido.
- `agents/nostromo-autonomo/agent.candidate.json`: candidato SOURCE deshabilitado en archivo; estado del agente Mongo host puede ser distinto.
- `deployment/nostromo-mcp`: SOURCE 12 tools y jobs async limitados; no equivale a herramienta seleccionada LIVE en agent builder.
- `src/mobile`, `src/ui`, `src/hud`, `src/research`, `src/events` contienen implementación y contratos SOURCE; cada uno necesita evidencias de instalación/función.
- `config/chatgpt_authorized.current.json`: `enabled:false`, provider binding no configurado. OAuth LIVE pendiente.

## Cambios reales de SOURCE
**Commit `6769d4549f2dc37879264f9b31b449cacb272166`**
- Agregó `scripts/audit-tool-context.mjs` y pruebas R0 sobre presupuesto de contexto, 5 casos simulados con aserciones, integrado en `npm run nostromo:qa:diagnostics`.
- El script no inspecciona Mongo ni toolRegistry y no acredita que el host filtre schemas correctamente. La propuesta previa DeepSeek fue RECHAZADA: test placeholder, modificación destructiva de toolDefinitions y comando de instalación incorrecto.
- `@librechat/agents@v4.0.1` ya implementa `getActiveToolDefinitions()`, gating de diferidas no descubiertas y accounting; el P0 requiere evidencia real de snapshot efectivo vs builder. Referencia https://github.com/LibreChat-AI/agents/blob/v4.0.1/src/agents/AgentContext.ts .

**Commit `fcc4af8f6ae268bd566e7e44c459e8b42d7defae`**
- `src/llm/modelRegistry.ts`: `admitModelCandidate` ahora exige capacidades de perfil y contexto suficiente si perfil/turno lo requiere, admite `estimatedInputTokens`, rechaza presupuestos/tiempos inválidos. Se añaden 4 regresiones unitarias.
- `src/llm/nostromoHybrid.ts` y `src/intent/nostromoDecisionBridge.ts`: `chooseHybridLane` veta local-voice para research, visualization, deep/long context, vision y targets; puente traslada `needsVision`. Una regresión.
- **CONTRATO:** los filtros SOURCE no demuestran por sí solos que el runtime nativo de LibreChat esté conectado al router. No declarar host PASS por unit tests.
- Tests de este commit deberán verificarse con CI exact SHA y readback del Work, no asumir PASS.

## Contratos publicados
- Gemini Deep Research: `docs/GEMINI_DEEP_RESEARCH_NOSTROMO_SOURCE_DRIVE_20261118.md`.
- ChatGPT Work único: `docs/WORK_NOSTROMO_E2E_HOST_CLOSURE_20261118.md`.
Ambos ordenan: inspección → diagnóstico → cambios mínimos → pruebas → readback → verificación; repositorios externos MANOJOS3, VX13, ORÁCULO se conservan independientes.

## Gaps y next
1. **P0 HOST**: agente Mongo/LibreChat/Ollama turno simple sin respuesta final y preflight con contexto; diagnosticar contador real, tools seleccionadas vs efectivas, cached schema, provider.
2. **P0 MCP**: comprobar 1 herramienta R0 con respuesta final y persistencia, permisos negados R2, jobs async sin doble ejecución; latency.
3. **P1**: cablear decisionBridge e InferenceGateway a runtime sin duplicar rutas.
4. **P1**: modelo GPU local en demanda, capacidad y contexto reales, memoria idle, first token vs total, unload; fallback remoto gratis admitido.
5. **P2**: tareas, investigación web, scraping, móvil, HUD/Artifact/continuidad integrados E2E.
6. **P3 opcional**: OAuth SIWC con consentimiento explícito, catálogo LIVE y límites compartidos, no API facturable.
Sin acceso Live Lenovo desde esta sesión, los puntos host son `NO_VERIFICADO`.
