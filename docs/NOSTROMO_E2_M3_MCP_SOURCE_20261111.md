# NOSTROMO — E2 M3 agente nativo + MCP stdio, SOURCE (2026-11-11)

**OWNER:** E2. **BASE:** `director/nostromo-critical-path-20261111@c11af334ccfce8b7dd4b5be8dece44768b9999d2`.
**BRANCH:** `e2/nostromo-m3-mcp-stdio-canary-20261111`. **ISSUE:** #37.
**Límite:** implementación SOURCE y test local aislado, sin Lenovo, sin cliente LibreChat autenticado.

## Contratos recuperados (no duplicar)

- Agente nativo: `agents/nostromo-autonomo/agent.candidate.json`;
  `enabled=false`, `model=null`, registro pendiente vía Agent Builder.
- MCP único: `deployment/nostromo-mcp/server.mjs` versión 0.3.0,
  transporte `StdioServerTransport`; `tools.mjs` administra catálogo único.
- `policy.mjs`: `preview` separa R0 de R2; hash exacto y autorización
  local física de un solo uso para ejecución R2.
- `inspect.mjs`: R0 de lectura delimitada; `.env` y secretos excluidos.
- YAML: `deployment/nostromo-mcp/librechat-mcp.fragment.yaml`;
  un solo `mcpServers.nostromo-autonomo`, `type: stdio`, `chatMenu: false`,
  `NOSTROMO_MCP_ENABLED: '0'` por defecto.
- Pin exacto LibreChat: `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`:
  `v0.8.8`, `librechat.example.yaml` `version: 1.3.17`,
  `.nvmrc` Node 24.16.0, `package.json` npm@11.13.0.
  Blobs públicos vistos: `librechat.example.yaml@8d0f893c9b229a62e9fa3b0e03be90184af16f5d`,
  `package.json@9b0760c9dd3b160b09663754c8ef7ca7443497a9`,
  `.nvmrc@b832e4001dbc9fb44e7055debe656e04b254f47c`.
- Documentación oficial de LibreChat acepta MCP stdio con `command`,
  `args`, `env`, `chatMenu`, `timeout`, `initTimeout` y
  `serverInstructions`. La prueba de API del commit fijado sigue pendiente.

## Cambio SOURCE

1. `deployment/nostromo-mcp/tests/e2-stdio-config-contract.test.mjs`:
   comprueba YAML, agente deshabilitado y selección de herramientas limitada;
   no habilita servidor ni toca configuración privada.
2. `deployment/nostromo-mcp/tests/e2-stdio-handshake-canary.test.mjs`:
   usa el SDK MCP **real** (si está instalado) como cliente del servidor
   NOSTROMO existente; realiza handshake stdio, `listTools`,
   `nostromo_estado`, `nostromo_terminal_preparar` R0 y R2 sólo-preview,
   `nostromo_archivo_leer` de un README temporal inocuo, y rechazo de
   ruta `/etc/hosts`. `NOSTROMO_TOOL_SET` habilita **sólo**
   `preparar` y `archivo_leer`; jamás expone terminal ejecutar ni async jobs.
   La configuración real del usuario queda `NOSTROMO_MCP_ENABLED=0`.
3. Comando `npm --prefix deployment/nostromo-mcp run test:stdio:source`,
   añadido al package.json existente; el glob `npm test` también ejecuta
   ambas pruebas. No se añade servidor, backend, Kernel, Worker o servicio.

## TESTS y READBACK

- En entorno temporal aislado fuera de Lenovo: contrato de configuración
  **3/3 PASS** usando archivos cuyo hash Git coincide con los de la rama
  Director para agente, catálogo de herramientas y fragmento YAML.
- Canario MCP SDK: **1 SKIP** explícito
  `SDK_DEPENDENCY_NOT_INSTALLED_IN_THIS_RUNTIME`; sintaxis JavaScript
  `node --check` PASS, **handshake real NO EJECUTADO**. Esta ausencia
  no se convierte en PASS ni en E2E.
- Blobs verificados del código nuevo:
  config test `35eed8a4b3709a7368fe7019b8e72cf01f9ca4d6`;
  handshake test `e021d24042da919200bf450d564dda0ed6af1acb`.
- No hay modelo consultable, agente registrado, autenticación, backend
  ni MCP LIVE del Lenovo acreditados.

## Próxima ejecución admitida

Tras resolver la ejecución local NOSTROMO, comprobar que el MCP comparte
namespace con LibreChat, que los paths existen sin symlinks y que el
conjunto real de tools es mínimo; instalar únicamente dependencias del
MCP existente, realizar `test:stdio:source` con handshake real, luego
habilitar el agente de LibreChat sólo después de modelo, backend, ACL y
aprobaciones verificados. Exigir pruebas reales del recorrido
`chat → modelo → agente → MCP → herramienta → readback`.

**ROLLBACK:** revertir únicamente los commits M3 / cerrar su PR.
**GAP:** `CONFIG_GAP / EXECUTION_ROUTING_MISMATCH` para Lenovo; entorno
de pruebas sin SDK MCP para handshake real.
**ESTADO:** `SOURCE_CONFIG_TESTED / MCP_HANDSHAKE_PENDING / HOST_UNVERIFIED`.


## M3 continuación — intento real de instalación aislada del SDK, SIN PASS

- Revisión `deployment/nostromo-mcp/package.json` Git blob
  `72893789a8ce629b882e07321da2b191af523d94` (readback verificado).
  Declaraciones `@modelcontextprotocol/sdk: ^1.32.2`, `zod: ^4.1.0`:
  **rangos**, no un pin efectivo de dependencias resueltas.
- `deployment/nostromo-mcp/package-lock.json` y `package-lock.json`
  consultados por GitHub: ambos **NOT_FOUND (404)**. No se ha creado ni
  actualizado lockfile en ninguna rama.
- Copia temporal separada en `/mnt/data/nostromo_m3_sdk_trial/package.json`,
  con `git hash-object` = `72893789a8ce629b882e07321da2b191af523d94`;
  idéntico al archivo en GitHub. Ambiente de prueba:
  Node `v22.16.0`, npm `10.9.2` (NO Lenovo; no reproducen el pin
  de LibreChat `24.16.0 / 11.13.0`).
- Comando ejecutado sin escribir en el repositorio:
  `npm install --prefix /mnt/data/nostromo_m3_sdk_trial --no-package-lock --ignore-scripts --no-audit --no-fund --fetch-retries=0 --fetch-timeout=7000`
  → **exit code 1**, `EAI_AGAIN getaddrinfo registry.npmjs.org`
  al solicitar `@modelcontextprotocol/sdk`. En este runtime no
  hay SDK en caché ni en `node_modules` detectables:
  `MODULE_NOT_FOUND`. No se empleó una implementación simulada.
- En consecuencia, **`npm run test:stdio:source` con SDK real NO EJECUTADO**;
  el canario conserva **1 SKIP** por dependencia ausente.
  Su definición cubre el handshake MCP, `listTools`, estado, preparación
  R0/R2 sin ejecutar R2, lectura de archivo temporal y denegación
  `/etc/hosts`; no equivale a ejecución material de esas comprobaciones.
- `HOST_RECEIPTS: NONE`; no se tocó Lenovo, MCP real del usuario, `.env`
  ni configuración privada. La prueba temporal aislada sólo intentó npm.
- `NEXT_ACTION`: en un runtime aislado **con DNS/npm disponible**
  recuperar dependencias legítimas, registrar versiones/lock SHA allí
  sin hacer commit, volver a probar canario con SDK real, confrontar
  resultados y corregir si aparecen fallos. El bloqueo de Lenovo sigue
  `CONFIG_GAP / EXECUTION_ROUTING_MISMATCH`.

**Alineación adicional de canario SDK:** Constructor `Client` ajustado con `{capabilities:{}}`, igual que el test stdio preexistente `deployment/nostromo-mcp/tests/mcp-stdio.test.mjs`. Blob final canario `e021d24042da919200bf450d564dda0ed6af1acb` (GitHub readback). Este cambio de código no resuelve el bloqueo EAI_AGAIN ni demuestra handshake ejecutado.
