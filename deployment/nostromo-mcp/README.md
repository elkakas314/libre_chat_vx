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

## Cuatro modos y Tentáculo Hub (PR #24)

- **NOSTROMO Autónomo:** agente independiente del modelo; único servidor MCP local `nostromo-autonomo`, herramientas de terminal y recibos. El selector de la cabina es sólo una **vista**: para ejecutar, el agente nativo LibreChat y el MCP deben estar instalados, autorizados y activos.
- **MANOJOS, VX13, ORÁCULO:** modos externos con sus propias autoridades y transportes. No reciben el MCP local NOSTROMO por el hecho de seleccionar una pestaña.
- Tentáculo Hub reutiliza la proyección `projectTentaculoHud` y `createTentaculoHubTree`; sin backend autenticado no muestra estados LIVE ni instala capacidades automáticamente.
- **Gestión de herramientas de un solo MCP:** `nostromo_herramientas` devuelve el catálogo efectivo. El administrador puede elegir en `NOSTROMO_TOOL_SET` una lista separada por comas de `nostromo_terminal_preparar`, `nostromo_terminal_ejecutar` (o ambas); `nostromo_estado` y `nostromo_herramientas` siempre quedan disponibles. Cambiar la variable exige reiniciar **sólo el proceso MCP**; el agente no puede otorgarse herramientas nuevas. Para añadir un ejecutor real se incorpora un módulo de código con test y nueva revisión, no se evalúa código arbitrario enviado por el LLM.
- GitHub y Google Drive serán adaptadores del mismo MCP, con autorización propia y SecretRefs existentes por ámbito, **sin copiar secretos desde MANOJOS** ni montar sus bóvedas en LibreChat.
- Los comandos de modificación usan la vía R2 ya implementada; nunca prometer autorización material por un selector de UI o por una respuesta del modelo.

**Gates pendientes:** ChatGPT SIWC OAuth LIVE, modelo gratuito/local realmente admisible, LibreChat Agent Builder instalado, MCP en Lenovo, UI de recurso desde catálogos autenticados y verificación E2E. SOURCE/CI no equivalen a instalación.

## Extensión opcional R0: archivos, Git y métricas (sin otro MCP)

Las 14 pruebas previas del MCP terminal no instalan el agente nativo ni los
bindings LIVE. Desde esta rama se ofrecen **tres herramientas nuevas,
opt-in**, en el *mismo* proceso stdio:

- `nostromo_archivo_leer`: texto hasta 16 KiB por respuesta, extensión
  permitida, alcance canónico dentro de `NOSTROMO_ALLOWED_ROOTS`, bloqueo
  de `.env`/claves y patrones de secretos reconocibles. **No garantiza DLP
  absoluto**: el administrador debe usar directorios sin credenciales.
- `nostromo_git_inspeccionar`: HEAD, rama, `status --short` y
  `diff --stat` con el ejecutor R0 actual, sin fetch/pull/push.
- `nostromo_metricas`: hilos lógicos, carga del sistema, RAM y
  disco por ruta autorizada. No confunde carga con porcentaje CPU, ni
  el mock de 4 GB con GPU/VRAM físicas.

Para habilitar estas herramientas con la terminal ya existente, configurar
la variable **del proceso MCP** (no en un chat del modelo):

```sh
NOSTROMO_TOOL_SET=nostromo_terminal_preparar,nostromo_terminal_ejecutar,nostromo_archivo_leer,nostromo_git_inspeccionar,nostromo_metricas
```

`nostromo_estado` y `nostromo_herramientas` siempre están presentes. Sin
`NOSTROMO_TOOL_SET` se conserva **exactamente el catálogo anterior de
cuatro herramientas**, por compatibilidad. Reiniciar únicamente el
proceso MCP y volver a leer el catálogo para verificar las nuevas.

`NOSTROMO_MCP_ENABLED=0` continúa bloqueando todo efecto de terminal
y nuevas lecturas. No se deben activar en una instancia multiusuario sin
aislamiento de usuario, ACL y directorios permitidos estrictos.

### Tareas largas y temporizadas

**No se instala FastMCP, Redis, otro servidor ni un Worker propio por
este cambio.** Aprovechar primero los *background tool calls* y
*scheduled chats* que ofrece el LibreChat upstream fijado, sólo tras
verificar permisos, persistencia y límites en la instalación real.
Para tareas materiales duraderas con reinicio, leases y receipts no
equiparar background UI a ejecución verificada. MANOJOS3 seguirá
externo, con su propio Scheduler/Worker si se elige esa vía.

### Microsoft Graph

`https://mcp.svc.cloud.microsoft/enterprise` es un **MCP externo
opcional**, en preview, centrado en Entra. Requiere tenant/cliente y
consentimiento OAuth; no configura correo, Planner o To Do por
escribir la URL. Puede añadirse como servidor externo separado en
LibreChat **sólo** con identidad/permisos reales y pruebas de lectura.
Para correo/calendario/tareas con escritura usar adaptadores de Graph
con consentimiento delegado y política propia; nunca tokens de
MANOJOS3 copiados al MCP de terminal.

Para el plan completo, ver
`docs/NOSTROMO_AUTONOMO_INTEGRACION_OPERATIVA_20261110.md`.
