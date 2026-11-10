# Modo NOSTROMO Autónomo · primer producto funcional

**Un MCP stdio local**, no un nuevo servidor HTTP, túnel ni controlador remoto.
El agente de LibreChat conversa a través del proveedor ChatGPT SIWC (si está realmente autorizado) o un LLM gratuito/local compatible. El modelo no tiene permisos del sistema operativo: sólo llama a herramientas MCP.

## Activación local (nunca automática)

El operador verifica el Lenovo, la carpeta `librechat/vx`, la instalación de LibreChat y sus cambios sin seguimiento antes de actualizar. **No** hacer `reset --hard`, `git clean` ni sobrescribir el overlay. Esta PR proporciona código SOURCE sin tocar el host.

Para el servidor MCP, Node 22+ y `npm install --prefix deployment/nostromo-mcp` (sin root ni APIs de pago). Ejecutar junto al mismo usuario Linux y en el mismo espacio de archivos que el Lenovo. **Si LibreChat está en Docker, `cwd` no es mágicamente la ruta del host**; no montar `/`, socket Docker o `.ssh` y no arrancar procesos privilegiados.

El administrador configura **una sola entrada** `mcpServers.nostromo-autonomo` de tipo `stdio` en el `librechat.yaml` real, desde el fragmento `librechat-mcp.fragment.yaml`, ajustando la ruta física con readback. Bloquear acceso a otros usuarios con los controles nativos de LibreChat. No usar un MCP público ni el editor de MCP remoto para un proceso local. Reinicio LibreChat sólo tras preflight y backup de configuración.

Valores de entorno esperados:
- `NOSTROMO_MCP_ENABLED=0` hasta canario de operador.
- `NOSTROMO_ALLOWED_ROOTS=/home/elkakas314/librechat/vx:/home/elkakas314/librechat/upstream` solamente si esas rutas están efectivamente montadas para el proceso.
- `NOSTROMO_APPROVAL_DIR`: directorio privado propietario del UID local para permisos puntuales R2. El agente **no** puede escribir allí.
- Un proceso por usuario autorizado, sin multiplexar entre tenants.

## Herramientas del agente

`nostromo_estado` — estado de este MCP, no de ChatGPT ni del host remoto.

`nostromo_terminal_preparar` — normaliza `argv`, `cwd`, límites y devuelve hash SHA-256 exacto sin ejecutar.

`nostromo_terminal_ejecutar` — ejecuta usando `spawn(shell:false)`: comandos de lectura R0 muy limitados (p. ej. `git status --short`, `pwd`); cualquier otro comando requiere aprobación R2 fuera del chat (archivo local 0600, carpeta 0700, hash de comando exacto y expiración máx. 2 min). Retorna stdout, stderr, código de salida, ID y marca temporal. No hay terminal interactiva persistente, sudo, shell libre sin autorización o reintento automático de un efecto desconocido.

Creación manual del permiso: un proceso humano local y confiable inspecciona `requestHash`, comando exacto, ruta y límites y crea un archivo `<hash>.json` owner-only con `{ "version": 1, "hash": "<hash>", "risk": "R2", "expiresAt": <epoch_ms> }` dentro del directorio privado. Nunca proporcionar esta capacidad al modelo, no compartir la carpeta en LibreChat ni exponerla mediante MCP.

## Integraciones futuras preservadas

`src/host/hostControlBridge.ts`, `config/host_recovery.current.json`, `deployment/host-control/` y la Skill MANOJOS3 siguen en el repositorio como candidatos futuros **desactivados**. La primera versión del agente autónomo no los carga ni necesita MANOJOS, HOST_CONTROL, VX13 u ORÁCULO.

ChatGPT SIWC sigue `enabled=false` hasta completar consentimiento OAuth y binding. No confundir modelo ChatGPT con permisos de ejecución ni usar la suscripción como token API.

## Gates

Pruebas offline `npm --prefix deployment/nostromo-mcp test` y protocolo MCP stdio (CI SOURCE), verificación visual del modo en escritorio/móvil (mock). Después, canario real R0 en el Lenovo, test R2 sobre archivo/servicio de prueba y readback separado, permiso/RBAC, coste y uso de RAM. Hasta entonces `INSTALLED/LIVE/MATERIAL_VERIFIED=NO_VERIFICADO`.
