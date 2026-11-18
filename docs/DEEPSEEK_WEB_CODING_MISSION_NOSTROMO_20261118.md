# DEEPSEEK WEB — MISIÓN DE CÓDIGO NOSTROMO, NO SOLO ASESORAMIENTO
**Fecha:** 2026-11-18 · **Destino:** PR #54 DRAFT · **Naturaleza:** contrato de entrega para un auditor/programador externo. Esta petición no acredita que DeepSeek haya recibido ni ejecutado nada.

## 0. Instrucción al ejecutor
Eres el ingeniero de código y revisor adversarial de NOSTROMO/LibreChat VX. Tu trabajo NO es escribir una arquitectura hipotética: abre el código fuente público, cita rutas/funciones/SHAs, produce **código TypeScript/Node ejecutable y pruebas** en parches `git diff` (o commits/PR si una integración GitHub con escritura REAL te autoriza). No inventes rutas, configuraciones, pruebas, servicios ni despliegue. Si DeepSeek Web no tiene lectura o escritura, usa enlaces RAW/API para leer y entrega parches aplicables; nunca declares cambios en GitHub sin readback.

Repo: https://github.com/elkakas314/libre_chat_vx
Rama de trabajo: `integration/nostromo-canon-20261118-r1`; **comprueba HEAD al empezar** (corte conocido `92ddab254eb79f8511cab1e1e6238cbd06566d63`; puede cambiar).
PR: https://github.com/elkakas314/libre_chat_vx/pull/54 (DRAFT).
Evidencias de Lenovo / bloqueo P0: https://github.com/elkakas314/libre_chat_vx/issues/37
Consulta previa V3.1 (lectura obligatoria): `docs/NOSTROMO_DEEPSEEK_V3_SOURCE_LIVE_WORK_REVIEW_20261118.md`
Contrato de Work existente: `docs/WORK_NOSTROMO_FINAL_EXECUTION_20261118.md`.
Upstream único LibreChat fijado: `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b` (NO inferir por latest).

**Regla única:** `READBACK HOST > material local único > SOURCE HEAD > docs > inferencia`. SOURCE/CI/mock no implican host LIVE. No tocar `main`, no forzar pushes ni sobrescribir trabajo sucio en Lenovo.

## 1. Entrega contractual: cuatro paquetes de cambios REALES, pequeños y revisables

### P0 — Quitar el atasco de herramientas/contexto sin rediseño
Rastrear el flujo nativo de LibreChat pinned desde agent builder/selección de MCP hasta `tool_options`, `defer_loading`, ToolRegistry, tool search, efectiva inclusión de schemas y preflight antes de Ollama. Leer `deployment/librechat-agents/deferred-instance-filter.mjs`, `config/librechat-vx.example.yaml`, `deployment/nostromo-mcp/{server,directory,async-jobs}.mjs`, scripts de auditoría y pruebas.
Hecho HOST reportado: contexto efectivo 6144; 13 esquemas ~5302 tokens + instrucciones ~3152 => ~8454 (fallo previo ANTES de inferencia). Builder configurado con 11 MCP y 8 diferidas / 3 directas; NO afirmar que faltan los flags. Ollama 4B y turno «Hola» no finalizaron en 120 segundos; dos lecturas MCP R0 sí acabaron previamente (~5 min). Necesitamos pruebas del diferencial snapshot/efectivo, no atribuciones inventadas.
Salida: mínima corrección de SOURCE sólo si demuestra causa; prueba de frontera "esquemas efectivos + instrucciones + reserva < ventana efectiva", sin cargar todo el catálogo en el prompt; herramienta de diagnóstico R0 que NO vuelque secretos. El HOST readback/benchmark queda para Work.

### P1 — Automatización del ROUTER DE DECISIONES existente
Inspeccionar exactamente `src/intent/intentInterpreter.ts`, `src/intent/nostromoDecisionBridge.ts`, `src/llm/inferenceGateway.ts`, `src/llm/nostromoHybrid.ts`, `src/targets/targetGateway.ts`, `src/conversation/conversationPlane.ts` y consumidores nativos. Construir un pequeño adaptador real de la conversación en español a señales/selección, o demostrar técnicamente dónde debe vivir en LibreChat pinned. NO inventar un segundo motor de NLU, Kernel, governor, router global, scheduler o frontend.
Contrato canónico por turno: `USER_TURN -> INTENT_DRAFT -> DECISION_BRIDGE -> SEMANTIC_PROFILE -> ADMITTED_PROVIDER -> LIBRECHAT_INFERENCE OR CONCRETE_TARGET_GATE -> READBACK -> USER_REPLY`.
- Reutilizar `interpretIntent`, `bridgeIntentToDecision`, `selectSemanticProfile` / `NostromoInferenceGateway`, nunca duplicarlos.
- Intentos CONVERSATION, RESEARCH, VISUALIZE, EXPLAIN, TARGET_READ, TARGET_COMMAND, CLARIFY se resuelven en lenguaje natural; prioridad a objetivos y contexto persistente sin hacer preguntas técnicas innecesarias.
- `TARGET_COMMAND` con target ambiguo queda BLOQUEADO, no se convierte en invocación MCP. El puente `authority:false` no concede permisos. `TARGET_READ` responde después de readback, no con datos inventados.
- Proactividad útil basada en capabilities/recibos recientes, event-driven, opt-in y deduplicada; cero polling continuo de LLM o carga permanente de Ollama. Cuando faltan datos importantes, pregunta por la decisión humana exacta. Sin modificación irreversible sin grant.
- La selección de herramientas MCP es *distinta* de la elección del LLM: resolver capacidad efectiva y cargar 1–2 schemas pertinentes por turno vía funciones nativas demostradas, NO declarar que todo está instalado.

### P2 — Automatización del ROUTER LLM existente; sin facturación
Inspeccionar `src/llm/{inferenceGateway,modelRegistry,providerStatus,cloudflareAiGateway,nostromoHybrid}.ts`, `config/{llm_bootstrap,model_registry,nostromo_hybrid,cloudflare_ai_gateway}.current.json`, tests existentes.
- Mantener perfiles RAPIDO, NORMAL, PENSAR, INVESTIGAR, VISUALIZAR, CONTEXTO_LARGO, VISION.
- Rutas admitidas sólo con `health=READY`, `quotaState=AVAILABLE`, `zeroCost=VERIFIED_ZERO_COST`, `evidence=LIVE_READBACK`, timestamp fresco, capacidades suficientes, privacidad y contexto adecuados.
- La configuración de candidato, un nombre de modelo publicado o un HTTP 200 genérico NO convierten un proveedor en LIVE. Ruteo con motivos de rechazo tipados y estado `UNAVAILABLE` cuando corresponda. Cero fallback facturable, cero claves API facturables por defecto.
- Política de prioridades y reserva basadas en disponibilidad real, latencia, salud/cuota; reutilizar `planModelPool` y `StrictZeroCostRouteResolver`. Distinguir cuotas gratuitas de planes compartidos. No bloquear toda la conversación si un proveedor falla; redirigir sólo a una ruta autorizada y demostrada.
- Contratos/test de `context-fit`, freshness, cuota desconocida, timestamps futuros, perfil no compatible, rate limit, proveedor caído, fallback de pago prohibido, secretos y privacidad. Si no hay endpoint de readback público, marcar `UNKNOWN` y no fingir mediciones.

### P3 — CHATGPT OAUTH oficial (SIWC), UX simple, acoplado al router y opcional
**No usar cookies de chatgpt.com, scraping, credenciales Codex copiadas, endpoints privados ni key API facturable.** Un ChatGPT Plus o Pro no garantiza cuota ilimitada ni autoriza tareas materiales. La integración requiere consentimiento explícito del usuario y consume límite compartido Work/Codex.
Ya existen en SOURCE (NO reescribir): `src/llm/{chatgptAuthorized,siwcIdentity,siwcSession,siwcResponsesClient}.ts`; `config/chatgpt_authorized.current.json` indica `enabled:false`, `provider_binding:UNCONFIGURED` y ausencia de LIVE OAuth. Inspeccionar esos archivos y tests antes de crear una línea.
Documentación oficial:
- https://developers.openai.com/siwc/token-sharing-open-source
- https://developers.openai.com/siwc/token-sharing-open-source/sign-in
- https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference
- https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations
- https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt
- SDK de referencia: https://github.com/openai/sign-in-with-chatgpt-devkit
**Comparar código propio con SDK: elegir el menor cambio mantenible.** No instalar un segundo servicio ni una UI duplicada.
UX requerida: en la interfaz nativa LibreChat un único flujo `Conectar con ChatGPT -> navegador de consentimiento -> cuenta/plan conectado -> lista de modelos realmente visibles -> habilitar/deshabilitar uso de cuota -> estado de cuota/limitación y desconectar`. Nunca exponer token al frontend o en logs. Callback loopback seguro, state/nonce/PKCE, JWKS/iss/aud, client ID persistido, host ID estable, credenciales cifradas/permisos 0600, refresh/rotación atómicos, revocación/reautorización y test de errores.
El proveedor sólo pasa a ROUTABLE con permiso `chatgpt.tokens.use.direct` + `resource.invoke`, token válido, catálogo LIVE, respuesta canaria terminada con evento `response.completed`, y consentimiento explícito. `identity-only`, expirado, límite semanal, fallo/red o sin modelo => deshabilitado, nunca fallback de pago.
HTTP: `https://api.openai.com/v1/models` (catálogo del usuario) y `POST /v1/responses`, `store:false`, `stream:true`, historial en `input`; sin `system` message explícito, enviar instrucciones/developer según docs. El stream debe llegar a `response.completed`, no asumir que HTTP 200 implica éxito. Campos no soportados: `temperature`, `top_p`, `background`, `conversation`, `previous_response_id`, `max_output_tokens`, etc. Revisar límites de preview.
**ATENCIÓN DE ARQUITECTURA:** SIWC Responses HTTP NO admite hosted MCP, Responses `tool_search`, file search, Code Interpreter, computer use ni herramientas alojadas. La búsqueda/carga selectiva de herramientas del agente debe permanecer **cliente/nativa en LibreChat**, o usar función/custom autorizada si la capacidad real lo soporta. No vender SIWC como sustituto de la pila MCP de LibreChat. Proponer si el runtime pinned puede consumir SIWC como proveedor sin romper herramientas; si necesita un adaptador, entregar patch y pruebas. Si la integración requiere una acción de consentimiento LIVE, entregar código probado/mocks y marcar gate real humano para Work.

## 2. Agente y MCP: contrato compartido
Un único `deployment/nostromo-mcp` y herramientas SOURCE ya existentes (su presencia en repositorio no demuestra instalación):
`nostromo_estado`, `nostromo_herramientas`, `nostromo_auditoria_r0`, `nostromo_terminal_preparar`, `nostromo_terminal_ejecutar`, `nostromo_archivo_leer`, `nostromo_directorio_listar`, `nostromo_git_inspeccionar`, `nostromo_metricas`, `nostromo_tarea_iniciar`, `nostromo_tarea_estado`, `nostromo_tarea_cancelar`.
Revisar reglas `NOSTROMO_TOOL_SET`, exclusión del terminal directo frente a async triplet, snapshots de jobs y `UNKNOWN_OUTCOME` tras reinicio, grants R0/R2. Los workflows son **composiciones** de estas capacidades y conectores disponibles; no inventar 12 nuevas herramientas.
Demostrar al menos: autodescubrimiento, diagnóstico R0, lectura Git, selección LLM, tarea asíncrona gobernada, reparación permitida, readback+receipt, sugerencia proactiva no intrusiva, continuidad tras reload. Mantener HOST_CONTROL/MANOJOS3 como plano independiente; tras cerrar NOSTROMO podrá consultar MANOJOS3 por su MCP y transferir objetivos al propio gobernador, no usurparlo.

## 3. Evidencia, tests y criterio de aceptación
Entregar cambios organizados por P0/P1/P2/P3 en parches separados, cada uno pequeño y reversible (no mega-PR). Para cada patch:
1. `BASE_SHA`, `HEAD_SHA`, archivos exactos tocados y por qué; imports y consumidores comprobados.
2. `git diff --binary` o un bloque `diff --git` **íntegro y aplicable con `git apply --check`**. Si no puedes ejecutar tests, pon `NOT_RUN`; no falsifiques.
3. Nuevas pruebas unitarias/contratos e integraciones offline (simular respuestas y fallos sin tokens). Indicar comando: `npm test`, `npm run build`, `npm run nostromo:wiring:test` según cobertura. No confundir mock con host LIVE.
4. Tabla de invariantes: sin segundo router, sin pago, sin escritura no autorizada, sin credenciales, preserve existing CLI/MCP/agent, no carga permanente de LLM.
5. Matriz `SOURCE/CONFIGURED/LIVE/VERIFIED` y evidencias/rutas reales. Los gates LIVE pendientes se asignan a Work.
6. Plan de rollback por archivo/ruta y criterio de parada para cada cambio.
7. Prioridad: primero arreglar P0 para que la conversación no se bloquee, luego P1/P2, y OAuth P3 opcional. No instalar antes de superar gates base. Pueden entregarse en tandas si la respuesta es larga; **primera tanda debe incluir un patch auténtico y tests**, no otra explicación general.

## 4. Coordinación bidireccional DEEPSEEK <-> CHATGPT WORK
DeepSeek trabaja sobre SOURCE público y escribe patches; ChatGPT/GitHub aplica sólo los validados en rama, mantiene PR #54 DRAFT y registra receipt. El **mismo Work ya pausado**, si conserva sesión, estado local y acceso, compara con `/home/elkakas314/libre_chat_vx-clean`, implementa instalación/cableado, verifica Mongo/LibreChat/MCP/turnos y publica readbacks saneados en issue #37 para una SEGUNDA revisión de DeepSeek.
DeepSeek evalúa esos readbacks y prepara patches diferenciales; Work no debe ejecutar recomendaciones ciegas, ni suponer que una sugerencia DeepSeek tenga permiso de mutación.
P0 host: comprobar ventana realmente efectiva, herramientas eficaces, turno simple y turno MCP con final persistido, tiempos, reintentos y rollback. OAuth host: consentimiento en navegador por usuario, no por agente, y canario consentido `response.completed`, cuota, reconexión y no-fallback. Si Work anterior no puede reanudarse: primero congelar handoff y evitar dos escritores, luego nuevo Work. No borrar sesiones, dirty work, Mongo ni datos únicos.
La salida final es `CONTRATOS CUMPLIDOS + SOURCE TESTS + HOST READBACK + CI` o una lista pequeña de gates REALES pendientes. Una propuesta o commit no equivale a cierre.

## 5. Formato que DEBES devolver
- `A) FUENTES INSPECCIONADAS`: tabla archivo@SHA/línea/URL y hallazgo, distinguir no accesible.
- `B) BASELINE Y FALLOS REALES`: qué falta, lo que YA existe, riesgos y anticollisiones.
- `C) CONTRATO CANÓNICO`: interfaces de tipos y flujos exactos, sin duplicar clases.
- `D) P0 PATCH APLICABLE + TESTS`: primera entrega obligatoria, prioridad.
- `E) P1 PATCH + TESTS`: decisión/NLU/conexión real.
- `F) P2 PATCH + TESTS`: routing LLM/selección/readback.
- `G) P3 PATCH + TESTS`: SIWC OAuth opcional, UX, proveedor integrado; dejar explícitos pasos humanos.
- `H) CI/TEST RESULTS`: sólo resultados ejecutados.
- `I) WORK HANDOFF`: instrucciones precisas en orden de aplicación, rollback y gates físicos.
- `J) SIGUIENTE REVISIÓN`: qué pedir al mismo Work para alimentar tu auditoría diferencial.

**Primer acto:** confirma el HEAD real y cita 4 archivos fundamentales antes de inventar nuevos módulos. **Primera entrega mínima:** parche P0 con tests que se puedan aplicar; no otro dictamen sin código.
