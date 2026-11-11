# Auditoría de la aportación DeepSeek M1–M3 (2026-11-11)

## Dictamen

**APROVECHAR CON CORRECCIONES, NO EJECUTAR EL SCRIPT DE DEEPSEEK.**
El usuario aportó una propuesta de reparación de dependencias, unión agente/MCP y cabina.
Se contrastó con LibreChat v0.8.8, checkout fijado f10b1d91 y
`elkakas314/libre_chat_vx` (MCP 0.3 con 28/28 pruebas Lenovo).

### M1 — Dependencias

Aceptado: registrar SHA de package-lock, tratar cambios dirty como únicos,
separar preflight R0 de mutaciones, prohibir `npm ci`/reset/clean, limitar
recursos y exigir frontend:ci después.

**No incorporar sin cambios:**
1. El `preflight-deps.sh` propuesto considera FAIL la ausencia de los
   tres binarios, pero requiere PASS antes de instalarlos: flujo contradictorio.
2. El fallback `vite@^5.0.0` no coincide con `client/package.json`
   de LibreChat f10b1d91, que declara `vite@^8.2.2`. La versión real
   debe obtenerse de manifests/lock, nunca una fallback distinta.
3. `resolveVersion()` mira sólo package.json raíz y omite las dependencias
   por workspace de `packages/data-provider` y `client`.
4. `npm install --no-save --no-package-lock` **no es quirúrgico**:
   puede modificar/podar node_modules; `--package-lock=false` hace que
   npm ignore el lock durante resolución, por tanto no garantiza
   conservar versiones fijadas. Restaurar manifests no revierte módulos.
5. Respaldar en `/tmp` es efímero y glob `cp /tmp/...*` no es un
   rollback CAS seguro. `unlink node_modules/.bin/*` puede destruir
   enlaces legítimos existentes; no usar.
6. `--ignore-scripts` no garantiza que herramientas nativas funcionen
   después: comprobar compilación real, no sólo existencia de .bin.
7. Una instalación npm puede mutar dependencias adicionales aunque
   se pidan sólo tres; sin snapshot completo no afirmar rollback de
   node_modules ni impacto limitado.

Se consolida en la **PR #34 ya existente**, sin crear otro reparador.
El script de esa PR hace preview R0, verifica HEAD y lock SHA exactos,
recursos, copia manifests fuera del árbol y ejecuta dry-run primero.
Como mejora derivada de la auditoría se incorpora
`librechat-npm-dry-run-guard.mjs`: rechaza salida JSON malformada
y planes que indican paquetes removidos o modificados.
**No convierte npm install en idempotente ni garantiza rollback**.
Si la simulación falla o anuncia reemplazos, se detiene, sin reparaciones
ad hoc, y se conserva el estado existente.

### M2 — Agente NOSTROMO y MCP

Concepto válido: registrar **una** entrada `mcpServers.nostromo-autonomo`
en `librechat.yaml` real, vincularla al agente nativo y probar E2E.
El archivo de ejemplo ya existe:
`deployment/nostromo-mcp/librechat-mcp.fragment.yaml`.

Corregir los ejemplos de DeepSeek antes de aplicarlos:
- Ejecutable: `deployment/nostromo-mcp/server.mjs`, no
  `server.js` ni `NOSTROMO_MODE=governed`.
- Entorno real: `NOSTROMO_MCP_ENABLED`,
  `NOSTROMO_ALLOWED_ROOTS`, `NOSTROMO_TOOL_SET`,
  `NOSTROMO_APPROVAL_DIR`.
- Herramientas: `nostromo_terminal_preparar`,
  `nostromo_tarea_iniciar`, `nostromo_tarea_estado`,
  `nostromo_tarea_cancelar`; no inventar `nostromo_execute`.
- Estados: `RUNNING`, `EXIT_0`, `EXIT_NONZERO`, `TIMEOUT`,
  `CANCELLED`, `BUSY`, `NOT_FOUND`, etc.; no `completed`
  genérico ni `cancelled:boolean` como sustituto de readback.
- `timeout_s=130` es inválido (máximo 120); para probar timeout
  se usa duración mayor que timeout permitido en entorno de prueba
  y sin efectos materiales.
- El agente candidato mantiene `enabled:false`/`model:null`.
  No afirmar conexión con LibreChat hasta comprobar backend, ACL,
  Agent Builder y llamada stdio real desde conversación.

### M3 — Visual y Tentáculo Hub

La PR #31 ya desarrolla sobre la cabina real. Evitar otra aplicación,
otro panel y duplicar Artifacts/Subagents. El trabajo visual adicional
debe seguir esa rama o esperar pruebas de su HEAD exacto.

Aceptar: separación de estado SOURCE/INSTALLED/CONFIGURED/LIVE/VERIFIED,
resumen de trabajos asíncronos, cancelación por permiso real, viewport móvil
y aislamiento de fallos. Exigir evidencia autenticada y timestamps; un
job `RUNNING` **no demuestra** estado LIVE verificado del agente completo,
y `EXIT_0` no da VERIFIED material. La salida del MCP está acotada
a 16 KiB por stream: evitar añadir virtualización pesada por defecto.
Consultar con backoff/acotación temporal y aprovechar canales nativos
LibreChat; evitar WebSocket propio, scheduler y segundo Kernel.

## Estado de aceptación

- M1: solución robustecida en PR #34, **SOURCE/TEST_PENDING_LENOVO**.
- M2: contrato existente confirmado; **AGENT_MCP_E2E_NOT_VERIFIED**.
- M3: mejoras correlacionadas con PR #31; **SOURCE/NO_LIVE_BINDING**.

Nunca crear PASS de CI que no se haya ejecutado. Ninguna acción GitHub
Actions solicitada ni iniciada.
