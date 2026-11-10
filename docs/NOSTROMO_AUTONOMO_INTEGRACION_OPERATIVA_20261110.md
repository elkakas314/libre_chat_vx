# NOSTROMO Autónomo — integración operativa por fases (2026-11-10)

## Decisión de producto

Una identidad **NOSTROMO**, un agente nativo de LibreChat, **un único
MCP local stdio** `nostromo-autonomo` ampliable por catálogo tipado.
`Tentáculo Hub` es una vista opcional R0: no ejecuta, no es otro
router/kernel ni concede permisos. El LLM se selecciona detrás de un
Router; ChatGPT SIWC sólo si se vincula OAuth y se autoriza. El mock
de GPU 4 GB puede estar verificado **como simulación**, pero no
acredita VRAM real de hardware.

No montar MANOJOS3/VX13/ORÁCULO dentro del shell local. Son destinos
externos con políticas, estado y receipts propios. Un agente puede
invocar varios MCP **siempre que sean autoridades externas
separadas**, sin poner más motores locales por defecto.

## Capas y verdad

| Capa | Funciones | Fuente de verdad |
|---|---|---|
| Conversación | LibreChat Agent Builder + Skills | Agente realmente registrado |
| Inferencia | SIWC autorizado, Router LLM gratis, modelo local opcional | Modelo y cuotas LIVE, sin fallback pagado |
| Terminal | preparar R0/R2, ejecutar y devolver stdout/stderr/exit | MCP stdio con hash, política y receipt |
| Archivos/Git | lectura acotada, HEAD/status/diff de raíces permitidas | readback en el mismo proceso MCP |
| Métricas | loadavg, CPU lógico, RAM, disco | Node os/statfs, NO porcentaje CPU/VRAM |
| Tareas | LibreChat background tools / scheduled chats si realmente activos | task ID + estado + resultado, no mero UI |
| Graph | servidor Entra MCP externo y, después, adaptadores por alcance | OAuth delegado y Graph readback |
| Externos | MANOJOS3, VX13, ORÁCULO | Policy/Kernel/Verifier de cada dueño |
| Tentáculo Hub | intención → herramienta → permisos → estado → evidencia | catálogo y receipts auténticos |

## Orden operativo (no sustituir LIVE por SOURCE)

**Fase A — validada en Lenovo parcialmente**

- LibreChat VX `main@0831ff1` actualizado por ff-only.
- Backup de tres árboles:
  `/home/elkakas314/nostromo-backup.ceBhjB8V`.
- MCP Node 22 instalado, 14 tests anteriores PASS (usuario).
- `librechat/upstream` conserva 3 cambios y 82 untracked; overlay
  `VXCockpitBridge.tsx` y `VXCockpit.css` difieren.
- Puerto 3080 no responde. No dar por instalado el runtime LibreChat.

**Fase B — esta rama, SOURCE**

- Conservar el terminal MCP R0/R2 y cuatro herramientas anteriores.
- Añadir opcionalmente tres herramientas R0:
  `nostromo_archivo_leer`, `nostromo_git_inspeccionar`,
  `nostromo_metricas`.
- Sin activar por defecto. Control local del catálogo por
  `NOSTROMO_TOOL_SET`. Sin cambios MANOJOS3 y sin nuevo servidor.
- CI PR verifica unidad + ronda stdio real con raíces temporales.
  CI NO prueba host Lenovo ni autorizaciones Graph.

**Fase C — Lenovo, P0**

1. Auditar copia real, rutas y `librechat.yaml` activo. Confirmar
   memoria/disco, MongoDB/dependencias y método npm/Docker existente.
2. Guardar copia adicional del `librechat.yaml` real y el overlay,
   comprobar diferencias y reconciliar sólo los componentes VX propios.
   No ejecutar `scripts/install-as-workspace.mjs` sobre upstream dirty.
3. Recompilar el frontend sobre el upstream fijado, verificar que
   LibreChat normal funciona con overlay desactivado.
4. Configurar **una** entrada MCP stdio en YAML real, ruta de Node y
   rutas montadas reales. Instalar dependencias sólo en MCP si hace falta.
5. Registrar `NOSTROMO · Autónomo` como **un** agente nativo,
   adjuntar el MCP y seleccionar modelo con tool-calling realmente
   funcional. Comprobar ACL/usuario y una llamada R0 independiente.
6. Activar las tres inspecciones opcionales con raíces mínimas,
   verificar catálogo LIVE, prueba archivos/Git/métricas y secreto
   bloqueado. R2 requiere permiso físico exacto, un uso y expiración.
7. Publicar NOSTROMO en `:3080` sólo tras pruebas de login y red
   privada; Tailscale Serve si se desea móvil. No publicar MCP/shell
   a Internet, ni montar socket Docker o carpetas SSH.

**Fase D — ChatGPT, Router, voz**

- SIWC: consentimiento personal, backend real y prueba de
  tool-calling/streaming. `enabled=false` hasta lectura de autorización.
- Router: mínimo un modelo gratuito con cuota y disponibilidad LIVE.
  Sin API de pago por defecto; modelo local opcional con memoria medida.
- Voz: STT/TTS navegador español o Piper/Whisper locales, según prueba
  del dispositivo; no confundir SIWC con audio.
- iPhone antiguo: no marcar app nativa instalada por crear un acceso
  web/PWA. Compatibilidad y firma nativa requieren proceso separado.

**Fase E — autonomía sostenible, sin inflación de infra**

- Prioridad 1: habilitar el *background tool calling* nativo (cuando
  LibreChat lo soporte y la capacidad del agente esté autorizada).
  Mostrar `task_id`, cancelar/consultar/recuperar. Validar que
  background de UI no equivale a continuidad durable.
- Prioridad 2: utilizar `scheduled chats` nativo sólo si beta
  habilitada y pruebas de scheduler/recuperación pasan.
- Si se requiere realmente ejecución durable independiente de sesión,
  construir **un** TaskLedger NOSTROMO (SQLite/local, idempotencia,
  lease/fencing, estado UNKNOWN y receipts) con su **único** worker
  opcional; no incorporar Redis ni `fastmcp-tasks` sin necesidad
  observada. No sustituir el Scheduler/Worker de MANOJOS3.
- Tool mutations: permisos por tipo de efecto, verificación material
  independiente y recuperación; R0 autónomo, R2 puntual, R3 exclusivo
  bajo política exacta.
- Graph Entra read-only **preview** es futuro opt-in:
  https://learn.microsoft.com/en-us/graph/mcp-server/overview .
  No concede Mail, Calendar, Planner ni To Do por defecto.
  Escritura futura a Graph requiere OAuth delegado/grant de tenant,
  método tipado con readback, auditoría e idempotencia.
  Jamás importar secretos de MANOJOS3 ni reutilizar token GitHub
  fine-grained como credencial Graph o SIWC.

## Aceptación final (ejecución material, no CI)

- `GET / 3080` + login + chat real + agente instalado.
- Tool `nostromo_estado` + catálogo efectivo + tres lecturas
  R0 sobre Lenovo con evidencia y derechos mínimos.
- Terminal R2 bloqueada sin permiso y con hash/expiración/consumo,
  canario permitido verificado después por readback.
- Intento leer `.env` o raíz no autorizada = DENIED.
- 1 modelo real con tool calls y una tarea larga/cancelación probadas;
  reconexión tras reinicio sin repetir efectos desconocidos.
- Tentáculo Hub visible pero sin inventar estados LIVE externos.
- CPU/RAM/disco host medidos, VRAM mock separada de VRAM física.
- Graph/SIWC sólo si hay consentimiento y canario LIVE; móvil nativo
  sólo si realmente se instala y prueba en iPhone.

## Continuidad y rollback

- No renombrar, borrar, resetear o unir las carpetas físicas antes de
  revisar cambios únicos.
- GitHub: PR estrecha sobre main, CI exact-head y merge sólo si pasa.
- Lenovo: volver al frontend/fragmentos guardados si el overlay nuevo
  falla, preservando `package-lock.json` y `.env`.
- `CURRENT` de GitHub es SOURCE; instalado y LIVE exigen receipts
  host-local posteriores.
