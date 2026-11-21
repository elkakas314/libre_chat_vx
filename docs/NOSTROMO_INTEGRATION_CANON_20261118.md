# NOSTROMO — integración canónica de revisión (18-11-2026)

**Corte:** `GIT_INTEGRATION_VERIFIED / HOST_LIVE_PROOFS_IN_PROGRESS / FULL_CLOSEOUT_NOT_VERIFIED`.
Este documento es el delta del corte, **no sustituye** el canon original 00/10/20/30/40 ni reescribe `CURRENT.json` histórico. El árbol versionado se audita por HEAD; el Lenovo por readback material.

## Identidad y evidencias GitHub

- Repo: `elkakas314/libre_chat_vx`.
- Base `main@8e642eb1238f9b35f18a070d6a754fede4b432fb` (no modificada).
- Rama aislada: `integration/nostromo-canon-20261118-r1`.
- [PR #53](https://github.com/elkakas314/libre_chat_vx/pull/53) MERGED en **`394f77e7582e3e0fe40658252ef85e21e5005a96`**; padres base `8e642eb...` y Director `f3de4a3e...`.
- GitHub compare: `main...integration` = 116 ahead, 0 behind. `director...integration` = 2 commits ahead, 0 behind, **0 diferencias de archivos**.
- Director ya incorpora integraciones #43/#48/#51. **#37 es el issue de continuidad, no una PR**. NO re-fusionar originales sin semdiff.
- CI anterior del candidato E2 `915da759fabe073167d35c5b34d930f30ecbb869`: [source-check 44174753182](https://github.com/elkakas314/libre_chat_vx/actions/runs/44174753182) SUCCESS; [native mock E2E 44174753161](https://github.com/elkakas314/libre_chat_vx/actions/runs/44174753161) SUCCESS. **Pendiente** CI sobre HEAD exacto de esta rama tras el presente doc y cualquier delta local.

## Contrato canónico y límites

LibreChat = plano conversacional, agente/cabina NOSTROMO y MCP de terminal local único; MANOJOS3 = autoridad externa Policy/Kernel/Verifier/State; MANOJOS = producto externo; VX13 = Link externo futuro; ORÁCULO = advisory. No otro Kernel/Router/Worker/MCP terminal; no fallback facturable. El estado del proveedor LLM nunca autoriza efectos.

## Readback host reportado por Work (NO repetido desde esta auditoría)

| Ruta | Papel observado/hipótesis | Decisión |
|---|---|---|
| `~/librechat/upstream` | backend productivo LIVE (2,9 GB reportados) | KEEP_ACTIVE |
| `~/libre_chat_vx-clean` | MCP productivo desde este SOURCE; deltas exclusivos | KEEP_ACTIVE_UNTIL_SEMDIFF |
| `~/librechat/nostromo` | tools/backups/worktrees (285 MB) | UNKNOWN_PRESERVE |
| `~/librechat/vx` | Work lo encontró ausente | NO_CREAR_SIN_EVIDENCIA |
| `~/librechat` | árbol contenedor (3,2 GB) | KEEP |
| `~/LibreChat` | árbol distinto por casing (657 MB) | UNKNOWN_PRESERVE |
| `~/upstream` | tercer checkout distinto del runtime | UNKNOWN_PRESERVE |
| `~/nostromo-workspace-backup.gngRsx` | backup no contrastado | UNKNOWN_PRESERVE |
| `~/vx-audit`, `~/vx-backup`, `~/bin` | auditorías/copias/utilidades | UNKNOWN_PRESERVE |
| `~/manojos_3` | constructor externo activo; 50 GB reportados | KEEP_ISOLATED |
| `~/MANOJOS` | producto externo | KEEP_ISOLATED |

Las cifras y PIDs anteriores proceden del reporte de otro Work, no de un acceso directo por este commit. Los receipts físicos reportados son `20261118-agent-context-gate.json`, `20261118-root-sizes-readback.json`, `20261118-mcp-persistent-state-fallback.json`: revisar sus bytes/metadata antes de promover. MongoDB es persistencia conversacional; el cambio de persistencia de jobs `~/.local/state/nostromo/jobs` es candidato y **no estaba recargado en el proceso MCP**.

## Bloqueo técnico P0

El Work observó `maxContextTokens=2048`, context overflow `messages do not fit`, `toolsCount=0` y discrepancia entre 28 referencias persistidas, 11 diferidas y otros conteos. Un ensayo de Qwen3 4B completó dos MCP R0; falta certificar la configuración definitiva. En la copia activa se conserva `nostromo_directorio_listar`, aún no incorporado automáticamente al presente repo. No basta ampliar VRAM/contexto sin readback; seleccionar esquemas de herramientas por intención y conservar catálogo completo.

Los 33/33 tests del MCP en Node22 y Node24 reportados por Work son tests de candidato, no prueba de que el proceso ACTIVE haya recargado el cambio. Los servicios Ollama/MCP requieren autorización real antes de cambiar o reiniciar. Swap casi llena según el reporte; medir antes de intervención.

## Google Drive — alineación y fuente documental

[Delta canónico en Drive](https://docs.google.com/document/d/1oOiFTIrMD5Lnd05frGZ3HuZf3LgZHBEnAdhkoZvOwFA/edit) ubicado en [carpeta consolidada](https://drive.google.com/drive/folders/1RtpHboZd9n6tiWLD2JzTBa452euPvsxB). La matriz existente tiene 10 hojas / 119 capacidades: 69 desarrolladas, 39 reuso upstream y 11 diferidas, con 112 ideas trazadas. La columna LIVE histórica no debe marcarse PASS por este merge. Los cinco documentos vivos 00/10/20/30/40 conservan diseño y referencias; este delta registra la diferencia temporal frente al Work.

## Gates para la revisión final (no hay FULL_PASS)

1. Releer HEAD/diff y receipts de cada árbol, distinguir archivos únicos, dependencias, CWD/PIDs, State y backups recuperables, SIN eliminar `UNKNOWN_PRESERVE`.
2. Comparar el MCP realmente activo con esta rama y rescatar exclusivamente cambios únicos `nostromo_directorio_listar`, configuración/persistencia y tests. No acceder ni copiar valores secretos.
3. Corregir presupuesto de tokens y esquemas contextualizados; demostrar chat → dos MCP reales → respuesta → Mongo → reconnect, con logs y recibos.
4. CI exact-head de fuente, TypeScript, stdio, seguridad, overlay/navegador; revisar integridad de ambos padres del merge. No confundir mock con host.
5. Verificar M3/VX13/ORÁCULO según fronteras, móvil, Web Search, modelo gratuito, recuperación, backups y consumo; actualizar verdad operativa y Drive.
6. **Sólo** entonces abrir decisión de integración a `main`, sin force, sin pérdida de trabajo local y con rollback.

**Change:** merge aislado de Director y preservación de `main`. **Test:** compare GitHub sin conflictos; CI anterior E2 no cubre el HEAD nuevo. **Readback:** PR #53 MERGED, SHA y parentesco. **Verify:** código equivalente a Director, 0 archivos distintos. **Next:** recuperar delta local único y nueva QA. **No** certificación de ejecución autónoma global.
