# CONSULTA TÉCNICA V3 PARA DEEPSEEK — NOSTROMO / LIBRECHAT VX
**Corte de consulta:** 2026-11-18. **Papel de DeepSeek:** revisor arquitectónico adversarial, NO ejecutor ni autoridad. Entrega una propuesta basada en los archivos reales, no un rediseño abstracto.

## OBJETIVO DEL USUARIO
NOSTROMO debe ser una sola conversación de lenguaje natural en español dentro de LibreChat, con una identidad constante, fluida, iniciativa útil, descubrimiento contextual de capacidades, preguntas humanas mínimas, sugerencias pertinentes, herramientas y tareas autónomas gobernadas, investigación/visualizaciones, soporte móvil y bajo consumo en un Lenovo Linux/Kubuntu limitado. NOSTROMO debe saber qué capacidades **están realmente disponibles** sin exigir al usuario nombres de herramientas, modos, rutas técnicas o IDs. Cuando un objetivo sea claro debe planificar, ejecutar lo autorizado, verificar por readback/receipts y continuar lo independiente. Si no puede hacer algo, debe explicar la frontera con precisión. La proactividad puede ofrecer sugerencias basadas en capacidades y estado vigente; NUNCA inventa permisos ni hace acciones materiales no autorizadas. Cero facturación involuntaria.

Queremos una revisión suficientemente exhaustiva para que el implementador cierre el SOURCE con cambios mínimos, y **un único ChatGPT Work** complete instalación/cableado/verificación local y limpieza en el Lenovo sin perder horas redescubriendo el repositorio. Después del cierre NOSTROMO, se quiere conectar con MANOJOS3 y colaborar con el cierre del producto MANOJOS independiente, siempre a través de su propio gobernador/Policy/Kernel/Verifier y con aceptación distinta. No se puede crear un segundo Kernel, router LLM global, servidor MCP terminal, ejecutor/TaskLedger, cockpit ni frontend.

## SOURCE REAL: DEBES ABRIRLO ANTES DE PROPONER
- Repo público: https://github.com/elkakas314/libre_chat_vx
- Rama: integration/nostromo-canon-20261118-r1
- PR DRAFT #54: https://github.com/elkakas314/libre_chat_vx/pull/54
- Issue de recibos LIVE #37: https://github.com/elkakas314/libre_chat_vx/issues/37
- Al iniciar, OBTÉN HEAD ACTUAL; los SHA de esta consulta son una referencia temporal, NO garantía.
- Commits de referencia: ffcfe9c8a1311d074fa08986de84c565e3f1be59 (corte previo); a810bb5bc6540aeb47ca9dfd3f6eb34852040f3f (primer fix/adaptador de esta auditoría).
- main de referencia: 8e642eb1238f9b35f18a070d6a754fede4b432fb; NO modificar main.
- Upstream LibreChat FIJADO: LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b. Comprueba las capacidades **de ese SHA**, no supongas las de LibreChat latest.
- GitHub API y RAW del repo público son accesibles: lee bytes SOURCE, imports, contratos, consumidores, tests y workflows. Cita URL concreta del archivo y commit exacto por hallazgo. Si una URL falla, prueba API/RAW antes de rendirte; no infieras contenido por nombre.

Archivos mínimos para abrir y contrastar:
src/intent/intentInterpreter.ts
src/intent/nostromoDecisionBridge.ts
src/llm/nostromoHybrid.ts
src/llm/inferenceGateway.ts
src/llm/modelRegistry.ts
src/llm/providerStatus.ts
src/llm/cloudflareAiGateway.ts
src/llm/chatgptAuthorized.ts
src/llm/siwcIdentity.ts
src/llm/siwcSession.ts
src/llm/siwcResponsesClient.ts
src/llm/nostromoIdentity.ts
src/targets/targetGateway.ts
src/conversation/conversationPlane.ts
src/discovery/readDiscovery.ts
src/cockpit/{windowRouter,providerStatusHud,shortMemory,referentialContinuity,conversationActivity}.ts
src/hud/; src/ui/; src/mobile/phoneModule.ts
src/recovery/backgroundMutationFence.ts
src/librechat/{nativeSurfaceBinding,nativeSurfaces,resumableBoundary}.ts
deployment/nostromo-mcp/{server,directory,async-jobs}.mjs
deployment/librechat-agents/deferred-instance-filter.mjs
config/{llm_bootstrap,model_registry,nostromo_hybrid,cloudflare_ai_gateway,chatgpt_authorized}.current.json
config/librechat-vx.example.yaml
skills/nostromo-core/SKILL.md
overlay/upstream/
docs/WORK_NOSTROMO_FINAL_EXECUTION_20261118.md
package.json + pruebas unitarias/integración + GitHub workflows.

## EVIDENCIA MATERIAL ACTUAL QUE NO PUEDES CONTRADECIR SIN READBACK NUEVO
1. Lenovo host productivo reportado: backend /home/elkakas314/librechat/upstream sobre upstream fijado; MCP activo /home/elkakas314/libre_chat_vx-clean/deployment/nostromo-mcp; agente persistido agent_9ex2a9buul2cwzyo, MongoDB y Ollama. SOURCE remoto no equivale a esos bytes locales.
2. LibreChat ejecutó anteriormente desde conversación autenticada las dos herramientas R0 nostromo_estado y nostromo_directorio_listar; devolvió texto final y persistió en Mongo tras recarga, pero el turno tardó ~5 minutos. No afirmar «MCP nunca funciona» ni «P0 solucionado».
3. Conversación antigua: preflight maxContextTokens=6144, system/instrucciones=3152 tokens y definiciones=5302 tokens (13 esquemas), total=8454 > ventana; error «Your messages do not fit in the current context window» ANTES de llamar a Ollama.
4. Builder actual: 11 herramientas MCP seleccionadas, 8 defer_loading y 3 directas. Por tanto es FALSO afirmar que faltan todos los defer flags. Correlacionar snapshots, tool_options reales, agente, tool registry, tool_search, toolDefinitions event-driven y herramientas eficaces por request, sin leer mensajes ni credenciales.
5. Hook de parche deferred-instance-filter.mjs instalado y aplicado en ExecStartPre sobre @librechat/agents@4.0.1 (TS/CJS/ESM), con rollback. No sugerir reinstalarlo sin prueba de divergencia.
6. Saludo trivial con Qwen3 4B qwen3:4b-instruct-2507-q4_K_M y contexto /api/ps=6144 consumió >120 segundos sin texto; detenido manualmente. Otro turno sí completó en ~5 minutos. Distingue latencia de prompt-eval, decode, memoria y streaming. El error literal «Ollama could not complete this request» sigue NO REPRODUCIDO/correlacionado.
7. Durante carga: runner llama-server ~1.3 GiB RSS, 3.05 GB VRAM, RAM disponible ~8-9 GiB; swap libre casi cero, pero «swap llena» NO prueba swap-in/out activo. Verificar vmstat si/so, PSI, GPU/VRAM, CPU, time-to-first-token, prefill y decode antes de inferir causa.
8. Upstream ya incluye persistencia PR #14118 para errores/follow-ups; NO duplicar saveErrorTurn/beforeErrorPublication.
9. Cloudflare AI Gateway está SOURCE, no binding productivo probado. El gateway no convierte proveedores de pago en gratis. ChatGPT Plus no garantiza cuota API; SIWC no está LIVE y no se deben extraer cookies. Modelo local debe ser opcional, no arrancar Ollama por un saludo.
10. CI en GitHub prueba SOURCE, TypeScript, stdio, upstream pin y UI mock; NO demuestra HOST. PR #54 permanece DRAFT; main se preserva.
11. MANOJOS3 hoy responde LIVE/READY (v0.4.0, 287 capacidades registradas, 268 disponibles, SQLite OK), pero su canal LibreChat figura NO configurado. MANOJOS3 y el producto MANOJOS son proyectos y autoridades independientes.
12. Work del Lenovo estaba detenido/pausado tras investigar P0. Su objetivo local aparece en /home/elkakas314/.codex/attachments/4cbb2c50-1635-4464-bf1c-3f709c8a003e/goal-objective.md. No puedes afirmar haber leído esa ruta remota desde DeepSeek ni asumir un grant HOST_CONTROL R2/R3 a partir del texto.

## TAREAS TÉCNICAS QUE DEBES RESOLVER
### 1. Diagnóstico causal P0 y experimentos BARATOS
Inspecciona el pipeline real del upstream fijado: agentes, construcción tool registry, entradas MCP, herramienta diferida, tool_search, preflight tokens, SSE y guardado; identifica exactamente dónde tool_options defer=true puede convertirse en 13 esquemas y 5302 tokens pese a tener 8 defer. Propón una matriz mínima de observaciones no invasivas para distinguir snapshot antiguo vs flags no propagados vs toolDefinitions event-driven vs catálogo de tool_search vs instrucción raíz demasiado grande. Define logs seguros (solo conteos, hashes/IDs no sensibles), instrumentation con feature flag, diffs por archivo, QA unitarios y un canario LIVE acotado. No reintentar chats de 120 s repetidos sin aislar cuello de botella. Mide prompt, historial, esquema, presupuesto de respuesta, KV cache y métricas CPU/GPU. Distingue 2048 antiguo vs 6144 observado real.
### 2. Fluidez, inferencia automática y coste cero
Proponer ruta determinista para saludos/órdenes simples (sin inferencia si basta), perfil RAPIDO cuando hace falta lenguaje; proyección de proveedor local/remoto sin forzar modelo local; clasificación semántica bajo demanda. Respeta strict-zero-cost y LIVE_READBACK, salud, cuota, privacidad, context fit; no fallback billable. Explica arquitectura posible de modelSpecs / endpoint/pool con upstream fijado y puntos exactos donde enlazar sin crear otro proxy/servicio. Dimensiona alternativas con pros/contras para CPU, TTFT y RAM/VRAM (no inventar cifras ni tarifas). Ollama idle-unload condicionado, no keep_alive=0 indiscriminado. Prioriza proveedores gratuitos reales solo tras canario.
### 3. Lenguaje natural de verdad, autonomía y proactividad segura
Diseña un solo ciclo usuario → comprensión de objetivo/contexto/referentes → capacidades realmente disponibles (descubrimiento focal, fresco y paginado, sin cargar los 287 esquemas) → plan de mínima complejidad → herramientas nativas/MCP → readback/verify/receipt → respuesta natural; el sistema debe sugerir funciones útiles cuando resulten pertinentes, explicar capacidades y limitaciones con evidencia y plantear UNA pregunta humana solo cuando exista ambigüedad material, consentimiento, irreversibilidad o dato inaccesible. No forzar al usuario a elegir modo, proveedor, IDs, comandos ni herramientas. Quiero proactividad guiada por estado verdadero, no notificaciones/inferencia continua, comportamiento paternalista ni acciones riesgosas automáticas. Propón triggers de sugerencias no intrusivos, memoria operativa corta con referencias, caducidad, deduplicación y privacidad. Estudia qué puede hacerlo ya LibreChat nativo con Skills/Tools Search/Background Tasks/Subagents/Files/Search. Separa iniciativa conversacional de ejecución material autorizada. Ofrece 10 casos reales de prueba natural en español que cubran el comportamiento.
### 4. Tareas, errores y persistencia
No recrear Scheduler/TaskPlan/DB si upstream y async-jobs MCP ya cubren gran parte. Define contratos de Plan/Task/Readback/UNKNOWN_OUTCOME, idempotencia, reanudación, cancelación, interrupción, fanout limitado, seguridad y límites de memoria. Explica exactamente cómo evitar un replay material al reconectar del teléfono o cambiar de proveedor. Que un fallo aislado no detenga tareas independientes.
### 5. HUD contextual y teléfono
Ya existen Tentáculo HUD, Cockpit, ProviderStatusView, PhoneModule y native surfaces; usarlos sin segundo cockpit. El HUD muestra estados LIVE solo con fuente/timestamp/provenance; no confundir CONFIG con LIVE, health de proveedor con estado de target, ni HTTP 200 con respuesta. Diseño responsive accesible, no montar paneles pesados al saludar. iPhone vía sesión LibreChat/Tailscale Serve, historial/Mongo/Streams y Shortcuts autorizados; sin prometer control general de iOS.
### 6. MANOJOS3 / MANOJOS y sistemas independientes
NOSTROMO se integra después con MANOJOS3 mediante target adapter/MCP y contratos de autenticación/health/readiness/capability readback; MANOJOS3 mantiene Policy/Kernel/Verifier/State. No mezclar /home/elkakas314/manojos_3 (constructor), /home/elkakas314/MANOJOS (producto), VX13 u ORÁCULO. El objetivo adicional es que, una vez NOSTROMO esté LIVE VERIFICADO, el Work/flujo gobernado pueda coordinar el cierre independiente del producto MANOJOS usando sus propias capacidades, sin convertir NOSTROMO en su Kernel ni declararlo finalizado por un enlace. Define gates de conexión, owner-ACK, readback y receipts.
### 7. Instalación y limpieza Lenovo
Dar fases de Work exactas con comandos idempotentes/verificación/rollback R0 primero; Node24 upstream, backend Mongo, Ollama, MCP actual, control de herramientas, Cloudflare y móvil condicionados a disponibilidad; preservar cwd/PIDs, preimágenes, datos Mongo, .env, YAML, secretos, ficheros únicos, worktrees y backups. Raíces relacionadas: /home/elkakas314/librechat/upstream, /home/elkakas314/libre_chat_vx-clean, /home/elkakas314/librechat/nostromo/mcp, /home/elkakas314/librechat/nostromo/tools, /home/elkakas314/.local/state/nostromo, /home/elkakas314/LibreChat, /home/elkakas314/upstream. Medir espacio real antes/después; nada de rm -rf basado en nombres. HOST_CONTROL es plano independiente: grants locales exactos para R2/R3 si requeridos; no eludir autorización con otro canal.
### 8. ¿Mismo Work o Work fresco?
Define criterio objetivo: preferir **reanudar el Work actual** si todavía ofrece sesión y filesystem Lenovo, objetivo íntegro, receipts y control de un solo escritor; elegir un Work nuevo SOLO si el anterior es irrecuperable, pierde acceso, agota contexto y no puede compactar, o ya no tiene continuidad verificable. Exige congelar/terminar el escritor antiguo antes de levantar otro, y preparar un handoff autosuficiente y comprobable. No afirmar que el Work está funcionando ahora por el mensaje de pausa.

## REVISIÓN ADVERSARIAL DE TU ANÁLISIS ANTERIOR
Tu respuesta anterior acertó al conservar inferenceGateway, nostromoHybrid, modelRegistry, providerStatus, Cloudflare, diferimiento y MCP existentes y evitar duplicaciones; pero no basta.
- Propusiste preferLocalVoice=true para toda conversación simple: contradice el objetivo de Ollama opcional/bajo consumo y envía a LOCAL_VOICE; ahora el bridge obliga preferLocalVoice opt-in comprobado.
- Afirmaste que ProviderStatusView no podía emitir FRESH sin LIVE_READBACK; el código anterior sí lo permitía si había timestamp. El commit a810bb5 corrige la proyección; vuelve a leer código.
- Proponías añadir solo un adaptador de decisión; ese adaptador SOURCE por sí solo NO lo conecta al agente real ni soluciona el P0, el Tool Search o el transporte. Identifica el consumidor/upstream REAL y el punto de binding; no declares integrado lo que no se ejecuta.
- El ejemplo de tarea material usaba 'nostromo_directorio_listar' como fallback de ejecución: eso es lectura, NO corrige host; no confundir cognición/readback con acción.
- No afirmes que toda API SIWC es gratuita ni que token OAuth autoriza Responses sin canario oficial o evidencia actual.
- La existencia de una API/nombre en LibreChat latest no prueba que esté en el upstream f10b1d91; leer el pin.

## FORMATO DE SALIDA OBLIGATORIO
A. Veredicto ejecutivo: los 5 principales bloqueos reales, priorizados por impacto/P0 y acción, sin porcentajes ficticios.
B. Inventario SOURCE con archivo + URL SHA + función real + consumidores/imports + tests + estado KEEP/CONNECT/REPAIR/CONSOLIDATE/NEW_REQUIRED/DEFER.
C. Flujo end-to-end concreto: turno sencillo, investigación, objetivo material y continuidad iPhone; incluye número de llamadas modelo/herramientas y qué disparadores evitan gastos cuando no hacen falta.
D. Diagnóstico diferencial del preflight 8454 > 6144 y latencia: hipótesis falsables, qué datos corroboran/descartan, rutas upstream exactas y orden seguro de instrumentos.
E. Matriz de contratos y cambios por archivo: diff TypeScript/YAML/JSON concreto (o pseudodiff fiel si falta readback), con precondiciones, tests, SHA base y rollback. No inventar nombres de tipos.
F. Batería de tests: unit, integration, native pinned, stdio, security, budget, fault, persistence, iPhone, readback E2E. Diferenciar mock/SOURCE/CI/LIVE.
G. Plan consolidado del WORK FINAL en lotes ejecutables: comandos completos acotados, preflight, guardrails CPU/RAM/swap, grants reales, diagnóstico, instalación, canarios, recuperación, limpieza, y gates LIVE de aceptación.
H. Decisión SAME_WORK vs NEW_WORK con criterios verificables y handoff de una página para el siguiente operador.
I. Revisión adversarial: enumera al menos 10 modos de fallo de tu propia propuesta y cómo se detectan/corrigen; prioridad evitar falsa evidencia y trabajo inútil.
J. Preguntas solo si bloquean materialmente la corrección SOURCE; no pedir al usuario datos que constan en los recursos.

Precisión: todo hallazgo debe identificarse como SOURCE_VERIFIED, CI_VERIFIED, HOST_REPORTED, LIVE_VERIFIED, INFERRED o EXTERNAL_BOUNDARY. Si no puedes abrir el código, dilo y produce informe parcial: NO rellenes vacíos con arquitectura inventada. No publiques commits, no modifiques el host ni solicites credenciales. Este texto es una consulta arquitectónica. **Devuelve la propuesta detallada para que el implementador pueda incorporarla casi directamente a GitHub y a un solo Work local.**
