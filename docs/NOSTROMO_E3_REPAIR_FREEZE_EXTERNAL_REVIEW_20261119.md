# NOSTROMO E3 — reparación externa y congelación de evidencias (2026-11-19)

**Clasificación:** `EXTERNAL_REVIEW / SOURCE_CANDIDATE / NOT_MERGED / NOT_LIVE`. **Propietario de la ejecución:** Work E3. Esta revisión es una rama y PR independientes, nunca un segundo `CURRENT.json`, handoff ni director de NOSTROMO. **Base de lectura:** PR #54 `integration/nostromo-canon-20261118-r1@37b8b37c0b640e583bc325d067966a569c0a8bf0`. El Work sigue escribiendo: releer su HEAD antes de aplicar. No hacer merge, rebase, squash, force-push ni despliegue desde esta revisión.

## 1. Territorios: evitar pisarnos

- **Work E3 es el único escritor** de `integration/nostromo-canon-20261118-r1`, `CURRENT.json`, `HANDOFF_CURRENT.md`, issue #37/#56, cabina, SIWC, callback nativo, host y matrices.
- **Revisión externa**: solo corrige `scripts/nostromo-gh-work-preflight-r0.sh`, incorpora una prueba aislada en `scripts/tests/nostromo-gh-work-preflight-r0.test.sh` y deposita este informe. No modifica la rama de Work.
- **NO regenerar** `docs/NOSTROMO_CANONICAL_INVENTORY_CURRENT.json` ni `docs/NOSTROMO_DRIVE_IDEA_CROSSWALK_CURRENT.json`: Work los publicó en `37b8b37...` y mantienen **119** capacidades Drive (`LC-001…LC-119`), **120** requisitos GitHub (`LC-R001…LC-R120`), **39** filas SOURCE (`SRC-001…SRC-039`, índices locales) y **112** IDs IDEA-LC. No equiparar por número ni asumir estado LIVE a partir del diseño.
- La palabra **congelación** aquí significa **baseline de contratos y recibos con SHA**, no crear un tag de release ni cerrar el objetivo mientras siga activo.

## 2. Reparación real: GitHub PUBLIC

El preflight R0 tenía una condición incorrecta: `IS_PRIVATE != true` producía bloqueo aunque el repositorio fuese **público** y `gh` tuviera permiso efectivo de escritura. El propietario ya cambió `elkakas314/libre_chat_vx` a PUBLIC.

**PATCH**: aceptar `private=true` y `private=false`, rechazar visibilidad desconocida, y seguir exigiendo `permissions.push=true`. Mostrar `PUBLIC_SECRET_HISTORY_REVIEW_REQUIRED` cuando proceda. Sin leer tokens, sin Git writes y sin tocar el Lenovo.

**TEST ejecutado en contenedor aislado:** `bash -n` del preflight y su nueva prueba; cuatro casos de `gh/git` simulados: privado/escritura, público/escritura, público/sin escritura y visibilidad inválida — **4/4 PASS en MOCK LOCAL**. Esto **NO** es readback `gh` real ni CI exacta del Lenovo. Work debe ejecutar el test publicado, comprobar `gh` autenticado sin imprimir secretos y decidir integrar esta pequeña corrección una sola vez.

## 3. Baseline SOURCE que debe preservarse

| Área | SOURCE / contrato | Límite material |
| --- | --- | --- |
| Interfaz NOSTROMO | `overlay/upstream/VXCockpitBridge.tsx`, `src/ui/TentaculoHud.tsx`, `src/ui/TentaculoHub.tsx` | Hub muestra inventario SOURCE, no servicio MCP LIVE |
| AgentClient | `deployment/librechat-agents/agentclient-siwc-binding.mjs`, upstream pinned `f10b1d91...`, Agents SDK 4.0.1 | Runtime productivo no contiene binding SIWC según último R0 |
| SIWC cuenta y seguridad | `siwcSession.ts`, `siwcConnectionService.ts`, `siwcProtectedVault.ts`, `siwcConnectionApi.ts` | Sin consentimiento OAuth LIVE, sin instalación ni servicio SIWC acreditado |
| Responses/funciones | `siwcOpenAiFetch.ts`, `siwcResponsesClient.ts` | SOURCE valida `store:false`, `stream:true`, rechazos, namespace/call_id; sin conversación real |
| Router semántico | `intentInterpreter.ts`, `nostromoDecisionBridge.ts`, `nativeInferenceRouteAdapter.ts` | No implementar un segundo router ni convertir clasificación en permiso R2 |
| Host/backend | `vx-backend.service`, `127.0.0.1:3080/health` en receipt anterior | HTTP 200 no equivale a OAuth+MCP+Mongo+reconexión |

Los resultados Work de 28/28 SIWC, 12/12 HUD, 12/12 tool stream son **recibos de pruebas focalizadas SOURCE**, no un PASS LIVE ni CI exacta del último HEAD. Un receipt de #56 que no exista en la ruta del corte actual se conserva como `HOST_HISTORICAL_UNRECONFIRMED`. No inventar ni sustituir recibos.

## 4. DeepSeek: qué aceptar y qué NO aplicar literalmente

1. El bloqueo `app.locals.nostromoReadNativeInferenceRouteInput` es real: el bootstrap SOURCE **ya lo consume**, pero el backend activo no lo produce. No afirmar que ese bootstrap corre LIVE.
2. `nostromo-siwc-route.cjs` exporta un **Router Express**, no un lector de rutas. El patch DeepSeek que exige `readNativeInferenceRouteInput` desde ese módulo es incorrecto.
3. El `siwc-session-store.cjs` del ejemplo DeepSeek no está en SOURCE y duplica la bóveda por usuario. El nuevo `NostromoRouteEnvelope` tampoco satisface `NativeInferenceRouteInput`. **No introducir ni registrar un objeto `authorized` vacío**.
4. El callback debe ser compatible con `(context: SiwcAgentClientRunContext) => Promise<NativeInferenceRouteInput>`, con `intentSignals`, `routes`, `bindModel`, `estimatedInputTokens`, `reservedOutputTokens` y `turnNeedsToolExecution`, obtenidos de sesión autenticada y readbacks verificables de capacidades/contexto/quota/health/privacy. No derivar de nombres de modelo, texto generado o datos cliente no validados.
5. El código actual `siwcOpenAiFetch.ts` **ya rechaza** parámetros no admitidos y hosted tools, y normaliza namespace de funciones. No añadir otro sanitizador silencioso que oculte errores. Filtrar herramientas mediante catálogo MCP + grants efectivos sin conceder permisos por simple intención.
6. El `issued client_id` y `hostId` ya están modelados en `siwcSession.ts`; `dynamic_agent_client` es entrada de primer registro, no identificador persistente. Auditar el flujo real antes de cambiarlo.
7. **Nunca fallback silencioso** de SIWC a una API facturable. Con 401/403/429, stream fallido o cuota agotada, informar error tipado con fallo seguro y conservar consentimiento/selección de proveedor.
8. El script DeepSeek `npm test || true; playwright || true; gh api status success` es inválido: crea **PASS ficticio**. No usarlo. `npm ci --omit=dev` tampoco sirve para los tests TypeScript/Playwright. La CI local debe ejecutar realmente las suites y registrar exit codes por SHA.
9. Para compactación y pruning de LibreChat, consultar el **upstream fijado**, no asumir `trigger.value=0.8` por defaults de documentación `latest`.
10. Los umbrales de reinicio propuestos por DeepSeek son hipótesis no verificadas. Medir antes de adoptar cualquier watchdog.

## 5. Reparación y consolidación restante (el ejecutor es Work E3)

| Orden | Lote | Aceptación real |
| --- | --- | --- |
| R0 | Aplicar preflight público desde este PR, si Work no lo corrigió ya | Rebase de lectura/patch mínimo, test local y `gh` real; sin otro writer |
| R1 | Callback autenticado AgentClient/SIWC | Firma nativa correcta + datos reales por turno + pruebas negativas aislamiento usuarios y fail-closed |
| R2 | Paquete productivo | Sync de archivos por preimagen/CAS, consumos PID/mount, upstream pinned, sin duplicar backend ni copiar volúmenes |
| R3 | CI local sin Actions | Checkout **ya existente y aislado**, flock, SHA fijo, suites reales, reporte CPU/RAM, log y `gh api statuses/<SHA>` con permiso efectivo; no instalar tooling innecesario |
| R4 | OAuth + chat SIWC LIVE | Consentimiento propietario, issued client id, `response.completed`, stream, tool `function` MCP local, Mongo y reload |
| R5 | Cabina/targets | HUD alimentado por eventos reales + readback MCP/HOST_CONTROL, no mezclar autorizaciones MANOJOS3 |
| R6 | Recursos | Baseline idle, carga TS, inferencia y tools; CPU PSI, memoria PSI, swap, RSS/PSS y temperatura por proceso; reinicios solo justificados y autorizados |
| R7 | Backups/layout | Preservar `~/LibreChat` mayúsculas (Mongo/Meili/RAG) y `~/librechat/upstream`, hashes, diferencias semánticas y restauración aislada antes de archivar nada |
| R8 | Publicidad, commits y release | Auditar historia pública por secretos **sin imprimirlos**, sin squash/merge mientras Work escriba; cierre con HEAD/CI local/LIVE exactos y aceptación |

**R2/R3 del propietario en chat ≠ grant efectivo de HOST_CONTROL.** Obtener o leer el grant específico de archivos del backend y reinicio de `vx-backend.service` antes de modificar runtime. No aplicar operaciones materiales a MANOJOS3, MANOJOS, VX13 u ORÁCULO.

## 6. Fuentes y próxima operación

- SIWC: https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations
- Modelos y errores de cuota: https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference
- GitHub estados locales: https://docs.github.com/en/rest/commits/statuses
- LibreChat resumido y pruning: https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/summarization

**Next action Work:** seguir callback nativo SIWC y canarios, integrar la corrección GitHub PUBLIC solo si aún hace falta, no regenerar inventarios ni abrir otra rama de ejecución. Este PR DRAFT externo debe permanecer sin merge hasta review de Work. Congelación definitiva a `main` solo tras recibos LIVE de conversación SIWC, MCP, Mongo, HUD, continuidad, recursos y rollback.
