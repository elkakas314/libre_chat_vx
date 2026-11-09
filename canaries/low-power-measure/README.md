# Low Power Measure — benchmark host, no verificación de servicio LIVE

Gate: `LC-LOW-POWER-MEASURE` = **GATE_HUMAN**, no PASS/FAIL automático. Referencia `SPEC.json#/rendimiento`. Los valores de CPU, RAM, TTFT y latencia están declarados como `null` o pendientes en SOURCE; no se inventan umbrales ni se cierra ningún gate.

## Dependencias y seguridad

Linux con `/proc/stat`, `/proc/meminfo`, `/proc/net/dev`, Bash, Python 3 estándar, `jq` para el self-test; `top`, `free`, `df`, `iostat` opcionales. El muestreo primario usa procfs y statvfs como alternativas a iostat/top; se conservan snapshots privados cuando estén instalados. `systemctl`, `flock`, `curl` solo se requieren en sus escenarios. Sin instalaciones.

Directorio `LOWPOWER_OUTPUT_DIR` 700 y archivos 600, fuera de Git. No publicar tokens, cabeceras, prompts privados, conversaciones reales ni IDs de usuarios. No usar `set -x`. El benchmark tiene efectos transitorios de carga; nunca modificar configuraciones ni servicios ajenos.

## Variables de entorno

| Variable | Uso |
|---|---|
| `LOWPOWER_OUTPUT_DIR` | Directorio temporal privado del host; default `${XDG_RUNTIME_DIR:-/tmp}/lc-low-power-$(id -u)`. No es almacenamiento persistente. |
| `LOWPOWER_SAMPLE_SECONDS` | Ventana máxima de muestreo, default **60** (5–600). |
| `LOWPOWER_ALLOW_STARTUP` | Debe ser exactamente `YES` para arrancar una unidad inactiva en 02; de otro modo SKIP. |
| `LOWPOWER_LIBRECHAT_SERVICE` | Nombre explícito de la **unidad dedicada LibreChat**, por ejemplo `librechat-vx.service` (ficticio); no asumir el nombre ni controlar otros servicios. |
| `LOWPOWER_HEALTH_URL` | Health GET loopback LibreChat, default `http://127.0.0.1:3080/`; requiere HTTP 200, no garantiza disponibilidad completa. |
| `LOWPOWER_STARTUP_TIMEOUT_SECONDS` | Espera máxima health en 02 (default 90, máximo 600). |
| `LOWPOWER_CHAT_TOKEN` | Opcional, únicamente credencial **de prueba** para 03/04. Ausente = SKIP. Se entrega mediante fichero curl temporal 600, no en argumentos de proceso ni evidencias. |
| `LOWPOWER_CHAT_ENDPOINT` | Endpoint **ephemeral/test-only** local que acepta POST JSON `{prompt,stream:false,benchmark:true}` y devuelve `{"answer":"OK"}`; sin configuración = SKIP. No se presupone que sea endpoint nativo LibreChat. |
| `LOWPOWER_STREAM_ENDPOINT` | Endpoint **ephemeral/test-only** local que acepta POST JSON `{prompt,stream:true,benchmark:true}` y devuelve SSE `data: ...`; sin configuración = SKIP. |
| `LOWPOWER_EPHEMERAL_TEST_CONFIRMED` | Debe ser `YES` tras corroborar que 03/04 no guardan chats, consumen solo recursos de prueba y no provocan cargos de producción. De otro modo SKIP. |

Los endpoints test-only deben ser rutas explícitas `http://127.0.0.1:<puerto>/<ruta>`, sin parámetros de URL, credenciales embebidas ni redirecciones. El operador prepara antes un adaptador compatible y aislado. Si no existe, **SKIP**, sin simular un chat ni usar datos reales. Las peticiones 03/04 pueden consumir inferencia de prueba. No ejecutarlas en un backend de producción sin aislamiento verificable.

## Cómo se ejecuta (operador humano)

1. Copiar `canaries/low-power-measure/` al host **junto con SPEC.json** accesible desde un checkout del repositorio; no ejecutar los scripts contra MANOJOS3.
2. Con el host libre y sin otras cargas, `bash canaries/low-power-measure/01-baseline-idle.sh` — 60s idle por defecto, CPU/RAM/disco/red: promedio, mínimo, máximo; snapshots opcionales top/free/df/iostat.
3. Con servicio LibreChat **inactivo** y unidad dedicada identificada: `LOWPOWER_ALLOW_STARTUP=YES LOWPOWER_LIBRECHAT_SERVICE=librechat-vx.service bash canaries/low-power-measure/02-load-scenario-librechat-startup.sh`. Arranca una sola vez, mide health y devuelve la unidad al estado inactivo original; si estaba activa devuelve SKIP sin reiniciar.
4. Solo con credenciales y endpoints **sintéticos y efímeros**: ejecutar `03-load-scenario-single-chat.sh` y `04-load-scenario-streaming.sh`. En caso contrario se registrará SKIP. No enviar datos reales.
5. `bash canaries/low-power-measure/05-collect-report.sh` crea `report.md` y `low-power-proof.json`. `04` registra first-byte (no TTFT autenticado); `ttft_ms=null`.
6. Adjuntar al paquete de evidencia el `report.md` y JSON desensibilizados. Decidir **humanamente** si el host soporta LibreChat y documentar razones; ningún script emite aprobado/suspenso por consumo.

`00-source-sanity.sh` únicamente revisa SOURCE offline. `06-rollback.md` explica reversión y retención, sin ejecutarla.

## Criterios e interpretación

- CPU host es ocupación global entre dos lecturas `/proc/stat`, no CPU exclusiva de LibreChat.
- RAM es memoria global `MemTotal - MemAvailable`, no RSS de un proceso.
- Disco es ocupación del volumen raíz mediante statvfs; si existe iostat se conserva un snapshot auxiliar, no se atribuyen IOPS al servicio.
- Red son diferencias acumuladas de bytes de interfaces no loopback, no tráfico exclusivo de LibreChat.
- Un escenario chat con respuesta HTTP no prueba idoneidad del host; validación humana obligatoria.
- No hay decisión PASS/FAIL de servicio, umbrales automáticos ni cierre de gates LIVE. Nunca tocar MANOJOS3.
