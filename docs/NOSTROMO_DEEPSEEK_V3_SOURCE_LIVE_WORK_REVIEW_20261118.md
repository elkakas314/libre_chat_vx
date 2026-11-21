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

---

## AMPLIACIÓN V3.1 — MCP, FLUJOS OPERATIVOS Y AUTONOMÍA DEL AGENTE

**Solicitud adicional expresa del usuario (18/11/2026):** pide que el propio agente NOSTROMO gestione herramientas y flujos ya configurados en el MCP, que descubra autónomamente lo que puede hacer y que proponga o acometa trabajo seguro útil sin que el usuario tenga que conocer la arquitectura ni pedir cada paso. Buscar funciones aún NO cubiertas por el Work Lenovo, con el menor consumo de memoria y la mayor fluidez. Desarrolla esta parte con detalle técnico, no solo ideas de producto.

### 9.1. Audita el MCP real y separa inventario de disponibilidad

En GitHub SOURCE del único servidor `deployment/nostromo-mcp` aparecen **12 nombres** en `tools.mjs`. No implica que los 12 estén habilitados en el proceso activo, seleccionados en el agente o sean invocables desde la conversación:

- Base y descubrimiento: `nostromo_estado`, `nostromo_herramientas`, `nostromo_auditoria_r0`.
- CLI: `nostromo_terminal_preparar`, `nostromo_terminal_ejecutar` (ejecución directa opcional).
- Lecturas: `nostromo_archivo_leer`, `nostromo_directorio_listar`, `nostromo_git_inspeccionar`, `nostromo_metricas`.
- Tareas asíncronas: `nostromo_tarea_iniciar`, `nostromo_tarea_estado`, `nostromo_tarea_cancelar`.

**Contratos SOURCE a verificar:** `selectedTools(NOSTROMO_TOOL_SET)` exige el trío asíncrono indivisible; no admite activarlo junto al ejecutor terminal directo. Hay herramientas obligatorias aun cuando el selector no las menciona. La persistencia `async-jobs.mjs` está limitada a 1 tarea en ejecución, 96 registros, 7 días, 120 s y salida acotada; `RUNNING` recuperado tras reinicio es `UNKNOWN_OUTCOME`. `nostromo_auditoria_r0` realiza una observación global de lectura de los ámbitos permitidos, **no** un self-healing ni un PASS material. Verifica diferencias entre documentación antigua y código vigente (p.ej. descripción antigua del listado de directorios vs validación actual 1–50 entradas). El MCP SOURCE está separado del MCP LIVE reportado en `~/libre_chat_vx-clean`. Sin readback del Lenovo NO declarar `INSTALLED`, `CONFIGURED`, `LIVE` ni `VERIFIED`.

Para cada herramienta devuelve una ficha: ID exacto, finalidad natural, scope/ACL/riesgo, schema de entrada/salida, tool-description para selección semántica, condiciones de registro, estado SOURCE/CONFIG/LIVE conocido, dependencias, límite de recursos, prueba `stdio` y prueba de invocación desde Agent Builder, receipt requerido, degradación y alternativas. No mezclar el catálogo de MCP NOSTROMO con las 287 capacidades registradas en MANOJOS3: fuentes y permisos son independientes.

### 9.2. Propón un paquete pequeño de FLUJOS MCP REUTILIZABLES

No crear un segundo MCP ni exponer 20 herramientas directas al LLM. Priorización: **flujos compositivos tipados sobre las 12 herramientas existentes + acciones nativas de LibreChat + adapters externos autenticados**, seleccionados con catalogo diferido o búsqueda a demanda. Sólo añadir herramientas nuevas si el upstream fijado no ofrece forma segura de componerlas y la medición muestra valor neto. Diferencia claramente "flujo" de "tool" y "target action". Cada flujo debe incluir `workflow_id`, intent/human description, trigger, prerequisite/check, tools reales y secuencia, inputs tipados, salidas, riesgo, autorización, timeout, cancellation, idempotency, readback/verifier, estado terminal, retry seguro y coste CPU/tokens.

Incluye como mínimo candidatos de bajo consumo, indicando cuáles se logran **sin añadir código nuevo**:
1. `nostromo.que_puedes_hacer`: autodescubrimiento focal real (catálogo, capacidades nativas, estados y permisos); explicar al usuario "puedo X ahora / puedo configurar Y / no puedo Z" con ejemplos relevantes. No cargar los 12 esquemas de golpe.
2. `nostromo.diagnostico`: preflight R0 de LibreChat, MCP, modelo, Mongo, conectividad, versiones, jobs y recursos; resumir blockers comprobados, riesgos y acción segura siguiente sin scans ni inferencia pesada por defecto.
3. `nostromo.contexto`: retomar "eso/lo anterior", recabar solo archivos/fragmentos autorizados pertinentes, no reiniciar la conversación ni volver a leer corpus entero.
4. `nostromo.revisar_codigo`: inspección Git/read-only, HEAD/dirty/arquitectura/diff/tests existentes; sugerir parche o PR en ramas aisladas; no ejecutar escrituras ni reset sin autorización.
5. `nostromo.tarea`: preparar → estimar riesgo y recurso → ejecutar vía trío `nostromo_tarea_*` si está habilitado → consultar a intervalos razonables → verificar efecto → persistir receipt/handoff; no vender `EXIT_0` como aplicación verificada.
6. `nostromo.reparacion_segura`: diagnosticar un fallo, reutilizar script/procedimiento probado, comprobar preimagen+scope+grant real, cambio acotado, test/readback/rollback. Un nodo denegado no bloquea lo independiente. No dar al MCP permiso autónomo para emitir grants locales.
7. `nostromo.buscar_y_sintetizar`: búsqueda web y lectura pública con herramienta nativa LibreChat, recabar fuentes y proponer acciones; usar navegador sólo para interacciones que lo exijan.
8. `nostromo.documento`: localizar, comparar y resumir Drive/archivos mediante conectores nativos con ACL, sin copiar token ni indexar todo en local.
9. `nostromo.seguimiento`: aprovechar background tasks / notifications / native scheduling SOLO si el pin de LibreChat lo soporta, sin crear daemon, cron, Redis ni segundo TaskLedger; deduplicar alertas, no disparar inferencia continua.
10. `nostromo.recuperacion`: al recargar o cambiar iPhone/PC, recuperar conversación y actividad de Mongo, inspeccionar trabajos y estados `UNKNOWN_OUTCOME`, no reemitir efectos; conservar `parentMessageId` y barreras oficiales de error.
11. `nostromo.cierre_operativo`: pruebas y evidencias por lote, inventario de archivos únicos, propuesta de consolidación/backups, limpieza reversible de archivos demostrablemente redundantes con grant exacto y restore test; no borrar `UNKNOWN_PRESERVE`.
12. `nostromo.manojos_enlace`: sólo tras disponibilidad y consentimiento externo, descubrir health/capabilities y tramitar objetivo con MANOJOS3 por adaptador gobernado, seguir run/receipt y distinguir cierre del producto MANOJOS. NOSTROMO no gobierna ni verifica por sí mismo el Kernel externo.

Para cada candidato decidir: `NATIVE_REUSE`, `MCP_COMPOSITION`, `SMALL_WRAPPER_REQUIRED`, `EXTERNAL_ADAPTER`, `DEFER` o `UNSAFE`. **No** proponer nuevos nombres `nostromo_x` como si existieran ya; si hace falta un nombre de herramienta nuevo, declararlo explícitamente `PROPOSED_NOT_INSTALLED`, con schema y pruebas.

### 9.3. Iniciativa real: el agente propone qué hacer sin que el usuario lo adivine

Diseña un contrato de iniciativa **event-driven, no polling LLM**:
- A partir de intención + foco de conversación + catálogo LIVE de herramientas + estado del host + tareas pendientes + consentimientos vigentes, priorizar 1–3 sugerencias breves realmente ejecutables y de utilidad demostrable.
- Ejemplo: "Puedo comprobar las dependencias del frontend y detectar el bloqueo antes de instalar nada"; al aceptar, seleccionar el flujo disponible, sin preguntarle al usuario qué comando usar.
- En una auditoría, el agente puede continuar automáticamente con lecturas autorizadas, análisis, pruebas SOURCE y recuperación de errores internos; **no** esperar "continúa" para cada paso no material.
- En un fallo acotado, intentar diagnóstico y reparación **solo dentro de los grants/autorizaciones ya existentes**, conservar original/rollback y verificar. Una frontera `CONFIG_GAP` no paraliza otro flujo seguro.
- Descubrir nuevas capacidades cuando hay una necesidad real, por nombre o categoría, sin importar 287 definiciones al contexto ni revelar secretos. Catálogo no es permiso. Mostrar `AVAILABLE`, `CONFIGURED`, `LIVE` y `VERIFIED` separados.
- Proactividad sobria: deduplicación, TTL, seguimiento de sugerencias aceptadas/descartadas, "no molestar", sin notificaciones intrusivas ni prompts infinitos. Medir coste tokens, inferencias, TTFT, RSS, CPU, consumo energético y frecuencia de tareas.
- Voz/personalidad natural constante en español, respuestas breves por defecto, explicaciones si se piden, continuidad de referentes y memoria de tareas; no asumir que el usuario conoce NOSTROMO, MANOJOS, YAML, tool IDs, Git o arquitectura.
- Incorporar "capability gap awareness": cuando el sistema no puede, sugerir al usuario la opción más cercana ya disponible o señalar la autorización exacta pendiente, sin inventar ejecución.
- Definir diferencias entre recomendación, plan, dispatch, ejecución, efecto y verificación; favorecer resultados, evitar "simulación de trabajo" con resúmenes repetidos y pseudo-PASS.

### 9.4. Ingeniería para añadir/componer flujos sin colapsar el contexto 6144

El principal P0 es que 13 esquemas/5302 tokens + instrucciones/3152 > 6144. La arquitectura de flujos **no puede empeorarlo**. Requerir:
- Indexar nombres/descripciones mínimos (manifest tipado y compacto) con búsqueda diferida por necesidad; cargar 1–2 schemas precisos por turno, conservar resto en catálogo sin pérdida funcional. Comprobar qué hace realmente `tool_search` y `defer_loading` del upstream EXACTO; el Builder muestra 8 diferidas y 3 directas, pero el preflight histórico muestra 13 schemas.
- Definir presupuesto dinámico `system + context + selectedSchemas + user + maxOutput + safetyMargin <= effectiveContext`; identificar cuándo el runtime puede detectar sobrecoste antes de Ollama sin realizar otra inferencia.
- Describir un `workflow registry` liviano (JSON en SOURCE o conjunto existente de Skills) con `id, version, intentTags, capabilities, prerequisites, risk, cost, steps, verify` y no autoridad; evitar crear tablas de DB, servicio residente, segundo router ni carga global de cientos de YAML.
- Adaptar selección del agente a `NOSTROMO_TOOL_SET` y al inventario REAL de LibreChat Agent Builder sin editar Mongo a mano ni sobrescribir las 11 herramientas persistidas.
- Comparar dos vías: composición a nivel agente nativo/Skill vs wrapper de flujo tipado en el MCP stdio actual, escoger menor complejidad/consumo y documentar por qué. Cualquier wrapper debe ejecutar sólo operaciones fijadas y autorizadas; no aceptar DSL arbitrario ni `eval`/shell de modelos.
- Manejar progreso de flujos con jobId de `async-jobs` existente si alcanza; no declarar orquestación duradera por el mero hecho de que sea persistente un snapshot CLI. Si un flujo excede 120s, usar fanout cognitivo/segmentación o el plano externo especializado, no ampliar timeout ni lanzar daemon por inercia.
- Fijar máximos de herramientas directas y coste total de instrucciones, suite de regresión, precondiciones `HEAD` exacto y rollback. Medir antes/después en el Lenovo para aceptar ahorro de CPU/RAM/tokens.

### 9.5. Capacidades faltantes que el Work aún NO ha cerrado

Haz una tabla `NECESIDAD → EXISTE SOURCE → ACTIVE HOST REPORTADO → EVIDENCIA → GAP → CAMBIO MÍNIMO → TEST → OWNER/GRANT`. Cubrir:
- selección contextual de herramientas efectivas vs 8 defer/3 direct, tool_search event-driven y modelo de respuesta vacío/lento;
- bridge de intención `nostromoDecisionBridge.ts` SOURCE (no binding runtime), autoselección de proveedores realmente GRATIS y garantía sin fallback facturable;
- descubrimiento de capacidades y sugerencias naturales apoyadas en readback (no listas de marketing);
- tareas gobernadas, progreso visible, interrupción, persistencia de jobs y reconciliación `UNKNOWN_OUTCOME`;
- agent loop sin confirmaciones artificiales pero con autorización externa real para R2/R3;
- integración por rutas mínimas GitHub, Drive, Web Search, correo/calendario si están **conectados**; acceso a ChatGPT/SIWC y móvil únicamente si hay concesión y LIVE;
- recuperación de conversación original con error preflight y retry real completado sin estancamiento;
- memoria operativa y continuidad de hilos/tareas, summaries/compaction con retención de identidades, evidencias, bloqueos y `next_action`;
- construcción/ejecución segura a petición: cuándo usar herramientas nativas del agente, `nostromo_tarea_*` o enviar objetivo a MANOJOS3; no duplicar trabajadores;
- chequeo de observabilidad de recursos, swap activa (si/so), PSI, limitaciones VRAM, latencia/TTFT y criterios de dormir Ollama;
- interfaz proactiva, estados exactos, accesibilidad y responsive móvil sin replicar Artifacts/Subagents;
- cierre de NOSTROMO y coordinación posterior con MANOJOS3/MANOJOS como producto independiente.

### 9.6. Entregables ampliados obligatorios para poder implementar SIN otro rediseño

Añade a tu informe original los apartados:
K. **Matriz completa de las 12 herramientas existentes:** catálogo fuente vs `NOSTROMO_TOOL_SET` vs Agent Builder vs llamada real; diferencias, schema y límites sin fingir readback HOST.
L. **Flujos tipados y workflow registry mínimo:** prioridad P0/P1/P2; para los primeros 6 da schema JSON concreto, secuencias de llamadas, manejo de fallos, dedupe, riesgo/grant, receipts y 2 casos de prueba por flujo.
M. **Diseño de agente autónomo natural:** contrato `Discover → Understand → Plan → ActWithinGrants → Readback → Verify → Explain → Suggest`, reconexión de UI, herramientas diferidas, criterio "sólo una pregunta cuando sea obligatoria", ejemplo de 10 diálogos naturales e iniciativa razonable.
N. **Plan de implementación precisa:** ruta de cada archivo ya existente, diff propuesto en el upstream pin o repo, imports reales, configuración agent/YAML, tests NODE + CI, tests LIVE sin saturar swap, rollback y versionado. Declarar `NO CHANGE` donde ya exista.
O. **Lista de mejoras nuevas respecto al Work detenido:** qué resolvió el Work (E2E MCP previo, parche instalado, Mongo) y qué sigue sin cerrar (P0, selección efectiva, latencia, retry, iniciativa, binding, autonomía, ahorro, limpieza); evitar repetir lo ya resuelto.
P. **Handoff Work Lenovo autosuficiente:** misma sesión preferida si recuperable, readback y ownership, HEAD/CI exacto, pruebas de 2 herramientas MCP y memoria, capacidad de descubrir y orquestar un flujo, consumo/latencia, cierre sin pérdida de datos, conexión posterior MANOJOS3 gobernada. Solo declarar `FULLY_FUNCTIONAL` con recibos reales.

**No hay autorización implícita para modificar producción.** Este anexo demanda propuestas detalladas, no que DeepSeek o el modelo posean nuevas credenciales/autoridad. Si la solución requiere privilegios locales, diseñar preflight y tratamiento del bloqueo, no burlar el gate. Evitar GitHub Actions adicionales si no aportan valor: ya existen CI SOURCE; los tests en host deben ser muy acotados.

