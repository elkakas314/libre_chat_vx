# NOSTROMO — WORK ÚNICO DE CIERRE MATERIAL, CONSOLIDACIÓN Y LIMPIEZA (18/11/2026)

**Uso:** instrucciones operativas para el Work que YA opera en el Lenovo. Continuar el mismo objetivo; no abrir otro Work, ni otro ejecutor, Kernel, Router, agente, MCP o frontend.

**Precedencia:** READBACK host actual (CWD/PID/Mongo/servicio/CLI) > datos y hashes locales únicos > GitHub SOURCE HEAD exacto/CI > Drive CURRENT contrastado > memorias y handoffs anteriores.

## RECONCILIACIÓN DE SOURCE Y WORK CLI — 18/11/2026 (NUEVO; prevalece sobre notas antiguas de este fichero)

**Base verificada antes de escritura:** rama de PR #54 `6f205d8a2a8cae833a5a0fa3ac6b30d6a641674a` contra `main@8e642eb`. En esa base, source-check run **44364160187** completó **6/6 SUCCESS**; native-mock-E2E run **44364160206** falló solo en fixture visual desktop/mobile línea 104: el encabezado «Estado de la conversación» es GLOBAL en `overlay/upstream/VXCockpitBridge.tsx:58-66` y el test exigía indebidamente ocultarlo en VX13. Este lote cambia solo la expectativa y conserva la telemetría. **No declarar CI PASS del nuevo commit hasta comprobar los runs del nuevo HEAD exacto**.

**P0 HOST reportado, NO nuevo readback de Lenovo desde esta modificación:** `CURRENT.json.p0_live_readback` contiene recibo fechado 2026-11-18T07:02:56Z con conversación `2da11982-20a5-5b32-a18c-0dd00413cba8`, 2 MCP R0, respuesta completada, Mongo sin error y recuperación tras recarga con Qwen3 4B/Ollama 6144; episodio de ~300 s. No volver a afirmar «no funciona nada»; tampoco declarar TOTAL PASS. Falta corroborar de nuevo la instancia, latencia, error/retry, proveedor gratuito real, SIWC, memoria, HUD, backup/restore y disponibilidad móvil.

**Árbol canónico LÓGICO, no consolidación destructiva:** 1 SOURCE versionada (PR #54); 1 backend LibreChat instalado reportado en `~/librechat/upstream`; 1 MCP NOSTROMO activo reportado en `~/libre_chat_vx-clean`; 1 árbol de datos/volúmenes sensibles reportado en `~/LibreChat` (diferente de `~/librechat`); `~/librechat/nostromo` para evidencias/worktrees; `~/upstream`, `~/vx-audit`, `~/vx-backup`, `~/nostromo-workspace-backup.gngRsx`, `~/bin` **UNKNOWN_PRESERVE**. `~/librechat/vx` reportada ausente; no crear por inercia. Excluir `~/manojos_3` y `~/MANOJOS`. Identificar PID/CWD/mounts y semdiff; NO mover Mongo/Meili/RAG ni datos secretos en caliente. Ninguna ruta se archiva solo por el nombre o tamaño.

**Work ya iniciado:** un solo escritor a la vez. Si E3 sigue operativo, continuar su objetivo/recibos, no crear un segundo controlador que altere el mismo checkout. La ruta `gh` del Lenovo está autenticada según salida del usuario, pero el acceso GitHub de ChatGPT es **otra identidad OAuth**; verificación local efectiva previa es obligatoria. No guardar PAT en Git, log, argumentos ni chat. Ejecutar el preflight R0 añadido en este mismo commit desde un checkout del repositorio:
```bash
set -euo pipefail; set +x
bash scripts/nostromo-gh-work-preflight-r0.sh
```
`gh` lee login, visibilidad, permiso push y SHA remoto; `git` lee SHA local, rama, dirty y `diff --check`. NO cambia el sistema ni ejecuta inferencia. Para preparar lote seguro, sólo después de confirmar checkout correcto y preservar exclusivas:
```bash
set -euo pipefail; set +x
REPO='elkakas314/libre_chat_vx'; BR='integration/nostromo-canon-20261118-r1'
REMOTE="$(gh api "repos/$REPO/git/ref/heads/$BR" --jq '.object.sha')"
git fetch origin "$BR"
test "$(git rev-parse FETCH_HEAD)" = "$REMOTE" || { echo REMOTE_DRIFT; exit 3; }
git status --short; git diff --check
# Aplicar en WORKTREE STAGING limpio, nunca sobre backend/MCP LIVE sucios.
# TEST + commit atómico + readback HEAD fresco antes de publicar.
test "$(gh api "repos/$REPO/git/ref/heads/$BR" --jq '.object.sha')" = "$REMOTE" || { echo LEASE_DRIFT; exit 4; }
# git push origin HEAD:"refs/heads/$BR"   # sólo si FAST-FORWARD, sin force ni reset.
# gh pr checks 54                  # revalidar SHA/run/conclusión y artefactos.
```

**Correcciones DeepSeek vinculantes para Work:** no crear segundo provider/AgentClient/Kernel/router. Reutilizar `siwcOpenAiFetch.ts`, `siwcResponsesClient.ts`, `agentclient-siwc-binding.mjs` y hook REAL `api/server/services/Endpoints/agents/initialize.js` (upstream pin/Agents 4.0.1), verificando contrato SSE, identidad, consentimiento, cuota y tool calls `function/custom`; no hosted `tool_search` ni fallback pagado. `toolApproval` usa `allow/ask/deny/mode` en upstream, **NO** `rules:[{match,action}]`. Context reserveRatio no es reserva universal de salida ni fija 80%. Filtrar esquemas por intención sin perder catálogo, test negativo `Hola` sin tools. P1 SIWC, P2 contexto, P3 HOST preflight, P4-P9 instalación/memoria/MCP/HUD/árbol/reinicio con grants genuinos y backup restore; fases independientes avanzan aunque otra se bloquee. No repetir el P0 ya acreditado como si no existiera.

**Aceptación material:** CI source-check + E2E nativo **mismo HEAD**, SIWC autenticado/con consentimiento y SSE completado, dos tools con call_id/output/receipt, Mongo persistente tras reload, host único PID/CWD/servicio, backup+restauración ensayada, seguridad y costes 0€ comprobados, recursos medidos, ausencia de pérdidas. Cada efecto con `CHANGE→TEST→READBACK→VERIFY→RECEIPT`. `SOURCE` no acredita `LIVE`.

---

## Identidad y estado

- GitHub: `elkakas314/libre_chat_vx`; `main@8e642eb1238f9b35f18a070d6a754fede4b432fb` preservada. Rama aislada `integration/nostromo-canon-20261118-r1`, PR #54 DRAFT hacia `main` (NO MERGE hasta gates).
- PR #53 integró Director/E2; PR #44, #47, #49, #50 cerradas como ancestrales (sin borrado de ramas). PR #31/#34/#35/#36 antiguas: 27 archivos de sus cambios con blob idéntico, 19 blobs diferentes, 0 rutas exclusivas respecto a integración; se requiere semdiff, no merge automático.
- Nuevo MCP remoto SOURCE: `nostromo_directorio_listar` R0 opcional añadido al MCP único en commit `0bcbd4b746ba3fb839a1e4cf104c252808f0ce9e`; pruebas de alcance y stdio incluidas. **NO asumir que equivale al código único y activo de ~/libre_chat_vx-clean; rescatar y comparar implementación local antes de sustituir.** La persistencia de jobs SOURCE usa ~/.local/state/nostromo/jobs o approvalDir/jobs, pero su puesta en producción no está acreditada.
- CI del commit SOURCE anterior `df445dcf9333f60c833e890b256cd7aaf17c69f7` completó E2E nativo run `44225150002` SUCCESS. Nueva CI sobre `0bcbd4b746ba3fb839a1e4cf104c252808f0ce9e`: source-check `44227630582`, native `44227630594`, consultar conclusiones finales, no inventar PASS.
- Drive: carpeta LibreChat VX consolidada. Delta verificable: https://docs.google.com/document/d/1oOiFTIrMD5Lnd05frGZ3HuZf3LgZHBEnAdhkoZvOwFA/edit ; documentos 00/10/20/30/40 + README/MAESTRO/CURRENT/HANDOFF enlazados con rama.
- Issue material HOST: https://github.com/elkakas314/libre_chat_vx/issues/37.
- Trabajo LIVE reportado: backend `/home/elkakas314/librechat/upstream`; proceso MCP `/home/elkakas314/libre_chat_vx-clean/deployment/nostromo-mcp/server.mjs`; Mongo persistente; Ollama CUDA GeForce 840M; agentes y herramientas en Mongo.
- Ollama: `/api/generate` aceptó 6144 tokens en un canario (77% GPU/23% CPU); vía real `/v1/chat/completions` siguió efectiva en 2048 aun con `num_ctx`; herramientas y prompt desbordan preflight. 28 referencias de tools persistidas, 11 diferidas, herramientas de MANOJOS3 heredadas. Necesita intervención autorizada, no inflar contexto a ciegas.
- Datos que NO se descartan: `~/librechat/upstream`, `~/libre_chat_vx-clean`, `~/librechat/nostromo`, `~/LibreChat`, `~/upstream`, `~/vx-audit`, `~/vx-backup`, `~/bin`, `~/nostromo-workspace-backup.gngRsx`. MANOJOS3 (`~/manojos_3`) y producto (`~/MANOJOS`) ajenos al cleanup; OpenClaw externo, no bloqueo de NOSTROMO.

## Política de privilegios

La petición del usuario autoriza **intención operativa** R2/R3/R4, pero una frase del chat, un plugin, un token PAT o un modelo **NO materializa los grants de HOST_CONTROL ni cambia el grant_interface real**. Comprobar el contrato vivo y el grant exacto por acción/target/preimagen. No crear, falsificar, reutilizar indebidamente ni eludir concesiones ni usar otro canal para sustituir operaciones denegadas. Un R3 de eliminación requiere el grant específico aunque sea un directorio vacío. Si una acción queda bloqueada, continuar otras tareas seguras; registrar EXTERNAL_BOUNDARY/SECURITY_BOUNDARY con identificador. Ejecutar R0/R1 autónomo donde el contrato permita y R2/R3 solamente tras grant válido. No suponer que R4 exista en todos los planos.

## Lote A: congelar material y construir mapa físico definitivo (R0)

1. Leer el objetivo Codex actual y los receipts ya producidos: `20261118-agent-context-gate.json`, `20261118-root-sizes-readback.json`, `20261118-mcp-persistent-state-fallback.json`, `20261118-vx-clean-active-mcp-readback.json` y posteriores. No repetir inventario masivo si ya está acreditado.
2. Identificar PID y `/proc/PID/cwd` y `/proc/PID/cmdline` de backend, MCP, Ollama, Mongo; servicios systemd usuario, configuración efectiva, rutas, permisos, consumos. No leer valores de secretos.
3. Registrar para cada raíz path, owner/UID, SIZE, HEAD/diff si Git, archivos únicos, datos persistentes, enlaces, procesos, dependencias, decisión KEEP_ACTIVE / KEEP_SOURCE / KEEP_DATA / BACKUP_REQUIRED / ARCHIVE_PROVEN / UNKNOWN_PRESERVE. La distinción `librechat` vs `LibreChat` es física en Linux.
4. Probar que `~/upstream` no es runtime antes de tocarlo; conservar `.env` y seis `node_modules` ignorados mientras no haya equivalencia y plan de restauración verificados.

## Lote B: rescatar la fuente activa sin romper servicio

1. Leer archivo por archivo el delta exacto `~/libre_chat_vx-clean/deployment/nostromo-mcp` contra GitHub rama #54. NO usar `git reset --hard`, `git clean -fdx`, ni copiar recursivamente sobre LIVE.
2. En workspace de staging aislado / worktree limpio, importar únicamente: `nostromo_directorio_listar`, `audit.mjs`, `async-jobs.mjs`, lockfile, tests, configuración y archivos exclusivos que superen semdiff/seguridad. Si el source remoto R0 es mejor que el local, preservar ambas preimágenes y tomar la implementación demostrablemente más segura. No copiar `.env`, SecretRef, token, DB, claves ni datos personales a Git.
3. Trabajar en PR #54/branch revisión, no en `main`. Obtener HEAD fresco antes de `gh`/git writes; crear commits coherentes; push fast-forward con lease, no force. Usar PAT ya configurado vía SecretRef/gh cuando autorizado, sin mostrarlo. `gh auth status` debe enmascarar credenciales. Separar GitHub app OAuth de PAT fine-grained.
4. Comprobar Node22 runtime ACTIVO y Node24 candidato con npm/lockfiles; `npm ci` SOLO en workspace aislado o GitHub CI, nunca sobre `librechat/upstream` sucio ni `libre_chat_vx-clean` LIVE. Priorizar CI remota por CPU/RAM y swap casi llena.

## Lote C: reparar agente sin multiplicar componentes

1. Leer el documento de agente persistido en Mongo y el YAML efectivo del backend. Guardar preimagen exacta y SHA; no imprimir credenciales. Correlacionar `tools`, `toolOptions`, `mcpServerNames`, herramientas legado de MANOJOS3, `defer_loading`, registros del tool registry y herramientas que REALMENTE llegan al transporte (`toolsCount`).
2. Medir preflight: presupuesto instrucciones sistema + memoria/contexto + historias + definiciones + margen de salida y tokens. La medición anterior 4237+3957 > 2048 prueba overflow; NO equivale solo al campo instructions de 894 caracteres observado después.
3. Conservar el catálogo completo en el MCP y seleccionar **solo dos herramientas MCP R0** para un canario por turno mediante mecanismos de defer/loading reales del LibreChat instalado. NO dejar al agente permanentemente recortado a dos tools; no habilitar herramientas de escritura como R0.
4. Verificar Ollama `/v1/chat/completions` y contexto efectivo. `num_ctx` por petición falló en la ruta real; si hace falta modificar `OLLAMA_CONTEXT_LENGTH`, adquirir grant HOST_CONTROL R2 real para el archivo de servicio y un único restart; preimagen y rollback; medir RAM, swap, VRAM GPU física, y no reiniciar hasta obtener grant. `/api/generate` con 6144 no es prueba de binding LibreChat.
5. Revisar el parser/adaptador de streaming para el turno con `toolCalls=0` y `contentItems=0`, sin asumir que el alias antiguo causó el fallo. Corregir únicamente el punto de pérdida de tool schema/response.
6. Canario **en el navegador de la aplicación LibreChat de escritorio, no mock**: abrir la sesión real autenticada, seleccionar el agente NOSTROMO persistido, enviar una consulta natural solicitando `nostromo_estado` y una segunda para `nostromo_directorio_listar` sobre una carpeta de datos de prueba permitida. Verificar eventos MCP reales, nombre de herramienta, argumentos, resultado R0 mostrado en la respuesta; Mongo y backend logs correlacionados, reconexión que preserva respuesta. No declarar PASS si solo hay HTTP 200, respuesta vacía o herramienta no llamada.

## Lote D: funcionamiento completo y targets

Una vez superado P0: comprobar Web Search/Keenable de coste cero con consent/config LIVE; autorización de GitHub fine-grained y semántica de secreto; Skills nativas y MCP; modelo/router gratuito y si hay Cloudflare AI Gateway actual, consultar su estado/contratos sin crear suscripciones; interacción escritorio y PWA/móvil; recuperación de Mongo; backups/restore; control de recursos y rutas de servicios. MANOJOS3 permanece gobernado por su propio Kernel y SecretRef; VX13 y ORÁCULO externos sin duplicación de autoridad. No habilitar acceso global/publico al agente por comodidad.

## Lote E: CI, release y limpieza comprobada

1. Efectuar GitHub Actions sobre HEAD exacto del código recuperado: source-check, build, MCP stdio, security scope, navegador Chromium y nativo LibreChat, Android/iOS si aplican. Recopilar runs, fallos y SHA. No consumir GPU local en tests pesados si la CI remota ya cubre SOURCE.
2. Confirmar runtime instalado desde el HEAD/árbol elegido y dos tareas útiles REALMENTE ejecutadas, una recuperada tras reconexión; diffs, hashes, servicios y receipts. Contrastar con la matriz Drive y actualizar SOURCE/LIVE por capacidad solo cuando exista prueba.
3. Proponer consolidación de paths: 1 runtime LibreChat productivo, 1 MCP NOSTROMO, 1 fuente canónica git VX, directorio de State respaldable, backups restaurables; no confundir unificar instalación con meter todo bajo un solo directorio.
4. Quitar solo procesos y configuraciones obsoletas demostradas; mover a cuarentena reversible árboles redundantes, verificar readback y ausencia de consumidores; eliminar solo con autorización R3 exacta y backup/restaurabilidad probada. No mover / borrar `UNKNOWN_PRESERVE`, `.env`, `state/`, `auth/`, DB, backups únicos ni MANOJOS3.
5. Cambios remotos: completar PR #54, actualizar CURRENT/HANDOFF/MATRIZ en GitHub + Drive con HEAD real final, señalando PASS/NO_VERIFICADO, y decidir merge a main tras cierre. Nunca force push.
6. Mantener receipt por operación: `CHANGE → TEST → READBACK → VERIFY → RECEIPT`; cierre final con tabla original/final, acciones y tamaños recuperados realmente, IDs, rollback.

## Continuidad y salida

No preguntar lo que ya está en receipts, repo, Drive, State o plugins. Si falta acceso host explícito clasificar `CONFIG_GAP / SECURITY_BOUNDARY / UNAVAILABLE_TOOL` y ejecutar lo independiente. El primer trabajo después de abrir este archivo es recuperar diff MCP único y cerrar el fallo de contexto/herramientas; **NO más barrido exhaustivo de carpetas como tarea principal**.

Criterio final: `GIT_MAIN_SOURCE_COHERENT`, `DRIVE_CANON_COHERENT`, `HOST_SINGLE_RUNTIME_VERIFIED`, `AGENT_MCP_E2E_VERIFIED`, `STATE_RECOVERY_VERIFIED`, `BACKUP_RESTORE_VERIFIED`, `CLEANUP_VERIFIED`. Cualquier ausencia permanece explícita, nunca PASS ficticio.
