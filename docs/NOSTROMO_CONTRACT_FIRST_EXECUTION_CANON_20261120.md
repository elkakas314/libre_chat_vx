# NOSTROMO — canon ejecutable por contrato, sin obligación de inferencia local (corte 2026-11-20)

**Estado: DOCUMENTED / SOURCE_CONTRACT_ONLY. No instalado ni LIVE. No sustituye el canon existente.** Actualizar sobre evidencia, no por el nombre CURRENT.

## Decisión de arquitectura y conservación

Adoptar como dirección de integración la **variante B contractual**: LibreChat sigue siendo la única cabina (auth, conversación, UI, persistencia); SIWC autorizado u otro proveedor admitido razona y acuerda el **resultado**, no determina permisos; `src/intent/intentInterpreter.ts` + `src/intent/nostromoDecisionBridge.ts` y `src/librechat/nativeInferenceRouteAdapter.ts` siguen siendo el único camino SOURCE de intención, decisión y handoff. La tarea ya se describe en `docs/NOSTROMO_CONVERSATION_TO_GOVERNED_TASK_20261118.md`. **No crear otro Kernel, router paralelo, servicio MCP, gestor de tareas ni base de datos nueva.**

Flujo objetivo:

```text
USUARIO ↔ LibreChat autenticado ↔ SIWC ChatGPT Plus consentido / LLM route admisible
  → interpretación, investigación R0, alternativas, acuerdo sobre resultado
  → acuerdo verificado por HOST (planHash/versión, identidad/sesión)
  → contrato compacto y validado: contracts/nostromo-objective-handoff.schema.json
  → resolución obligatoria sobre catálogo de capacidades EXISTENTE y su readback
  → gate del propietario: policy/grant efectivos y preflight
  → ejecución determinista en MCP NOSTROMO actual o adapter externo
  → readback → verifier → receipt → tarea persistente → respuesta LibreChat/HUD
```

**La ruta determinista no llama a Qwen3 ni exige tool_search.** Si falta parámetro o conocimiento, obtener candidatos de la capa conversacional/investigación o de un LLM admitido, validar su salida y regresar al mismo preflight; no convertir texto libre en permiso. Qwen3 4B es proveedor opcional, no prerequisito de la acción. Mantener Tool Search/deferred para rutas nativas cuyo LLM sí invoque herramientas; no eliminarlo ni prometer que SIWC lo admite.

## Contrato y autoridad

El esquema `contracts/nostromo-objective-handoff.schema.json` es **un artefacto SOURCE para un handoff ya acordado**, no el payload generado sin validar por el LLM. Las referencias `agreement_ref`, `conversation_ref`, `plan_hash` y la identidad real han de verificarse/reconstruirse en el host autenticado. El campo `authority:false` es invariable; **el objetivo acordado no es grant R2**. Cualquier estado o autorización propuestos por el modelo quedan descartados. Nunca almacenar bearer, cookies o tokens en contrato, recibo ni Git.

La forma del `target_id` revela una divergencia existente: `ConcreteTargetId` solo contempla `MANOJOS3|VX13`, mientras que el MCP local NOSTROMO es plano propio. Este contrato distingue `execution_lane=NOSTROMO_LOCAL` de `EXTERNAL_TARGET`; **no ampliar el selector de targets ni pretender que un target externo es el host local**. Work debe reconciliar ambos mediante el gateway/adapter nativo existente y pruebas de exhaustividad, sin promover `AUTO/BOTH` a destino de mutación.

`capability_refs` y `context_refs` transportan referencias, no herramientas ejecutables ni historia entera. Las capacidades se resuelven **en código y con ACL/frescura/riesgo** antes de cualquier dispatch; fallar cerrado en `UNRESOLVED`, `AMBIGUOUS`, `STALE`, `DENIED`. Si no hay una proyección viva, obtenerla del propietario; no convertir un catálogo SOURCE en autorización. El resolver debe consultar primero `src/cockpit/targetToolGate.ts`, `contracts/target-capability-projection.schema.json`, catálogos MCP y adapters existentes. Solo añadir persistencia/índices Mongo a los almacenes vigentes tras demostrar carencia; no crear por defecto colección `capabilities`.

Las precondiciones y criterios de aceptación se resuelven a predicados tipados confiables: **nunca ejecutar strings de `expected_result` o `predicate_ref` como shell, SQL o código**. Alcance, riesgo y herramienta elegible son determinados por runtime, no por la declaración del LLM. `idempotency_key` debe ligarse a acuerdo, target, versión y acción por el host; al reintentar tras un dispatch ambiguo: `UNKNOWN_OUTCOME → READBACK/RECONCILE`, nunca replay ciego.

## Persistencia y tareas: reutilizar, no duplicar

`deployment/nostromo-mcp/async-jobs.mjs` ya conserva snapshots privados y recarga RUNNING como `UNKNOWN_OUTCOME`; `src/cockpit/targetRun.ts` exige readback/verification/receipt. No sustituir su state machine ni crear un gestor competidor. Mapear estados de contrato a su representación existente y demostrar que una acción se despacha una vez, que la cancelación no significa reversión y que una reconexión no reejecuta. MongoDB actualmente persiste conversación; **no está acreditado que persista objetivos y jobs gobernados con la misma autoridad**. Distinguir responsabilidades sin inventar capacidades instaladas.

## SIWC y router

El SOURCE existente `src/llm/siwcOpenAiFetch.ts` ya transforma herramientas de función en un namespace local; `src/llm/siwcResponsesClient.ts` presenta ruta text-only. Reconciliar ambos sobre `app.locals.nostromoSiwc` (resolver) y `app.locals.nostromoSiwcConnectionService` (ciclo de vida), usando el lector `app.locals.nostromoReadNativeInferenceRouteInput` si lo admite el contrato instalado. SIWC requiere consentimiento real, modelos admitidos y peticiones soportadas; `tool_search`, MCP alojado y `previous_response_id` no forman parte del camino admitido. `store:false`, `stream:true` y continuidad local. No confundir SIWC/Plus con API key facturable. Ningún fallback facturable.

## Recursos y P0

Recibo LIVE `operating/sync-receipts/e4-native-file-deferral-live-canary-20261120.json`: 5360/5837 → 3818/5837 (~92% → 65%), herramientas nativas ~1900 → 335; `native-file-deferral` instalado en bundle con preimagen. **Esta mejora sí está verificada**, pero la conversación MCP E2E no: 43 s sin dispatch, GPU 100%, swap libre 0, PSI elevado, Mongo respuesta vacía/inacabada. Esto NO demuestra por sí solo incapacidad de Qwen3 ni causa única. Investigar prefill, decode, load/keep_alive, tool payload, parsing y memoria por intervalos; no ejecutar canarios prolongados hasta preflight de recursos. El patch en `packages/api/dist/index.cjs` no tiene persistencia de rebuild demostrada; integrar sin duplicar el hook existente.

## Auditoría estructural y gates de integración

Auditoría R0 del checkout a este corte: 647 tracked, 504 imports relativos revisados estáticamente y **una ruta fixture no resuelta** `ci/fixtures/native-overlay-prereq.spec.ts → ../specs/mock/helpers`; 0 JSON malformados; `logs/` untracked, preservar. No equivale a TypeScript/CI PASS: revisar si fixture es sintética o falta archivo, y ejecutar tests exact HEAD. El canon híbrido `docs/NOSTROMO_HYBRID_CURRENT.md` declara Cloudflare como preferencia, pero runtime no tiene ruta gratuita Cloudflare verificada; **SIWC autorizado/LLM admisible y local opcional son rutas, no promesas de LIVE**. `operating/TARGET_CANON.json` es intención, `CURRENT` debe derivarse de pruebas. Reconciliar `docs/SEMANTIC_MODEL_CURRENT.md` (NOSTROMO no ejecuta autoridad material) con la frase "ejecutor NOSTROMO": el ejecutor local actúa **solo a través del MCP/policy propietarios**, nunca como autoridad propia de UI/modelo.

Gates de Work, sin empezar desde cero:

1. HEAD/base/worktrees/owners/receipts y últimos cambios; no tocar logs untracked o 12 dirty upstream.
2. Validar el contrato con positivos/negativos (lane/target, idempotencia, agreement, permisos simulados); verificación real del acuerdo fuera de JSON Schema.
3. Cablear el handoff en puntos SOURCE existentes; test unitario del resolver real + catálogo y lectura de permisos R0; ejecución determinista requiere **LLM calls=0** y ningún `messages[]` entregado al ejecutor.
4. Usar la infraestructura MCP/jobs existente, sin segunda cola; no doble dispatch, `UNKNOWN_OUTCOME` tras reinicio, respuestas/verificación.
5. SIWC conversación real con consentimiento o bloqueo `EXTERNAL_BOUNDARY` preciso; Ollama OFF no debe bloquear ejecución determinista si conversador admisible está LIVE.
6. Persistencia de parches tras rebuild; cabina overlay con diferencias semánticas y preimágenes, sin sobrescribir dirty.
7. Pruebas de CPU/RAM/swap/GPU, seguridad, desktop/móvil cuando accesibles, E2E, CI exact HEAD, release SHA; sincronizar Drive por revisión.
8. Actualizar `CURRENT/HANDOFF/PROOFS/GAPS` únicamente desde receipts y readback; PR #54 DRAFT hasta gates. `FINAL_VERIFIED=false` hasta completar todo.

## Evaluación de DeepSeek (archivo propietario 20261120-165511)

**ACEPTADO como dirección:** separar chat vs ejecución, contratos compactos, resolución obligatoria de capacidades, mapa por referencias, ejecución determinista cuando proceda, preservar SIWC y MCP existentes.

**NO ACEPTADO como hecho verificado:** atribuir únicamente al modelo/GPU los 43 s; deducir que tool_search está roto; afirmar que todos los jobs ya viven en Mongo; que SIWC por sí mismo concede ejecución de herramientas; crear inmediatamente colección `capabilities`; que las cadenas de instrucciones del LLM son predicados de ejecución. El documento externo es investigación, NO SOURCE/INSTALLED/LIVE.

**No se ordena desplegar esta arquitectura por existir este canon.** Sólo el Work con host, pruebas y grants efectivos puede promoverla.

## Corte E5 2026-11-21: segunda herramienta R0 y registro persistente

El contrato SOURCE `nostromo.objective.handoff.v1` y el adaptador `dispatchGovernedObjective` se reutilizan sin sustituirse. El registro `NativeObjectiveDispatchLedger` realiza un claim atómico en el campo privado MongoDB de la conversación y comprueba huella de objetivo, acuerdo, herramienta, argumentos y propietario antes de `VERIFIED`, que exige receipt persistido. El MCP original conserva su idempotencia independiente para `nostromo_tarea_iniciar`; este journal no es una nueva cola ni concede autoridad.

La cabina incorpora `nostromo_metricas` en una vía R0 separada con `cwd=/home/elkakas314` fijo, previamente mostrado al usuario y vinculado al hash del plan. El host consulta catálogo MCP y ACL nativos y rechaza shadow servers, binarios inesperados y argumentos distintos. La ruta POST `/api/nostromo/objectives/:conversationId/execute-metrics` está montada y requiere sesión.

**Evidencia material:** Vite nuevo servido (HTTP 200), backend reiniciado y activo (HTTP 200), ruta de métricas sin sesión devuelve 401, Mongo real y ejecutable MCP instalado en fixtures 2/2 READ_OK, readback y no repetición; cero inferencias LLM. El registro/recuperación está probado en SOURCE y fixture. **No se ha demostrado aún la pulsación autenticada en una sesión de usuario real para métricas**, ni la autonomía general; SIWC sigue frontera externa. `FINAL_VERIFIED=false`. Receipt `operating/sync-receipts/e5-native-metrics-installed-20261121.json`.
