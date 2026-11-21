# NOSTROMO: auditoría oficial de agentes, plugins y contexto
18 de noviembre de 2026. SOURCE auditado contra upstream fijo; HOST/LIVE aún NO_VERIFICADO. Rama integration/nostromo-canon-20261118-r1, PR #54 DRAFT.

## Hallazgo P0 y reparación segura
La rama contiene 14 Skills físicas. El catálogo y los canarios antiguos exigían 12. Se ha reconciliado el inventario como 10 canónicas + 2 legacy + 2 opcionales de agentes = 14 físicas. La primera etapa de GitHub Skill Sync selecciona sólo 12 rutas explícitas (canónicas y legacy); la segunda sólo diez canónicas; las dos opcionales nostromo-autonomo y nostromo-extension-creator no son importadas automáticamente. El ejemplo principal permanece con skillSync.github.enabled=false. Ninguno de estos cambios instala Skills en Lenovo.
La rama histórica handoff_current_bootstrps de los ejemplos se ha sustituido por la rama de integración en SOURCE. Antes del canario LIVE congelar SHA, reconciliar el sourceId ya existente y verificar derechos de admin/tenant/ACL; no efectuar una segunda fuente duplicada.

## Matriz técnica documentada y recomendada
| Capacidad | Ubicación real en upstream fijado y SOURCE NOSTROMO | Recomendación |
| --- | --- | --- |
| Agent Builder | client/src/components/SidePanel/Agents, data-provider types/agents.ts | Un agente NOSTROMO visible. Inspeccionar agente persistido Mongo, versionado, tools y modelo. |
| Herramientas diferidas y ToolSearch | client/src/hooks/Agents/useMCPToolOptions.ts, @librechat/agents v4.0.1 AgentContext.ts | El capability deferred_tools no convierte herramientas en diferidas: verificar tool_options.<tool>.defer_loading guardado/efectivo; comparar binding y conteo. |
| Memoria | packages/api/src/memory, config memory | Memorias breves con referencias; no activar memory.agent.enabled automático por defecto en el Lenovo sin benchmark. |
| Compactación y poda | summarization y contextPruning oficiales | Reducen historial y resultados antiguos, no schemas del primer turno. Preservar bloqueos, decisiones y evidencia. |
| Approval, pause/resume | endpoints.agents.toolApproval, Mongo checkpointer | R0 autónomo seguro, R2 por permisos locales exactos, no por prompt o click HUD. |
| Skills | skillSync.github, selección en Agent Builder | 14 físicas, 12 canario inicial, 10 canónicas finales; no inyectar las 14 en cada mensaje. |
| Agent Plugins | packages/api/src/plugins, plugins/vx-nostromo/plugin.json | Plugin SOURCE experimental con 2 Skills empaquetadas, sin mcp.json/hooks. No instalar por existir. |
| MCP | mcpServers + deployment/nostromo-mcp | Un único stdio local y opciones de defer; el catálogo SOURCE no demuestra herramientas LIVE. |
| Subagents | LibreChat nativo | Delegación puntual con contexto aislado, no procesos siempre encendidos. |
| Background Tasks | run_in_background opt-in + backgroundTasks | No es scheduler duradero ni garantiza supervivencia del proceso; probar continuidad real. |
| Scheduled Chats | interface.schedules experimental | Diferir sin requisito y canario E2E. No duplicar scheduler. |
| Web, Files, Artifacts, OCR | Agent capabilities + Tool Library | Reusar nativo, Search antes que navegador; fuentes web no confiables. |
| Ollama/local GPU/router | src/llm/inferenceGateway.ts, modelRegistry.ts, nostromoHybrid.ts | Modelo 4B a demanda, medir VRAM/contexto/TTFT, rutas gratis sólo con cuota y canario LIVE. |
| Móvil, HUD y continuidad | src/mobile, src/ui, src/hud, src/events | No descartar módulos; verificar misma sesión y Mongo tras reload/dispositivo. |

## Causa P0: no declarada resuelta
Host reportó contexto efectivo 6144, instrucciones ~3152 y schemas ~5302, total 8454 sin reserva. 11 herramientas seleccionadas en Agent Builder (8 deferred + 3 directas), frente a 13 schemas observados. @librechat/agents v4.0.1 contiene getActiveToolDefinitions, getEffectiveToolDefinitions, getEventDrivenToolsForBinding y calculateInstructionTokens; no borrar this.toolDefinitions indiscriminadamente.
Work debe capturar snapshots saneados de tool_options guardados/efectivos, extras nativos, herramientas realmente enlazadas, cached toolSchemaTokens, instructionTokens, maxContextTokens y final de un turno con persistencia. La memoria NO corrige el exceso inicial. No aumentar num_ctx sin medir swap, VRAM, latencia y límites reales del modelo.
En el upstream pinned hay opciones modelResponseHeadersTimeoutMs, modelResponseBodyTimeoutMs, maxToolCallArgBytes, checkpointer.type=mongo, activityLabel y backgroundTasks. Las etiquetas generadas son llamadas de modelo adicionales; no activar proveedor facturable por accidente. Cualquier ajuste del YAML real exige backup, parse, diff y readback.

## Documentación técnica oficial para Gemini y Work
- Agents: https://www.librechat.ai/docs/features/agents
- Agents YAML: https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/agents
- Memory: https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/memory
- Summarization: https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/summarization
- Skills: https://www.librechat.ai/docs/features/skills
- Skill Sync: https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/skill_sync
- Agent Plugins: https://www.librechat.ai/docs/configuration/agent_plugins
- MCP: https://www.librechat.ai/docs/features/mcp
- Subagents: https://www.librechat.ai/docs/features/subagents
- Scheduled Chats: https://www.librechat.ai/docs/configuration/scheduled_chats

## Resultados y siguiente evidencia
La corrección de GitHub es SOURCE, no despliegue. npm run nostromo:qa:diagnostics incluye test de inventario; su PASS debe corroborarse en CI exact HEAD. Gemini investiga Drive+GitHub+fuentes oficiales y entrega informe privado, matriz y parches; el Work existente realiza canarios en Lenovo y reporta readback/receipt saneados en issue #37. No alterar main ni cerrar PR #54 sin gates HOST.
