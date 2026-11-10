# NOSTROMO — ChatGPT, voz, móvil y actualización simple (corte 2026-11-10)

## Decisión

Un producto visible **NOSTROMO**; un agente conversacional independiente del
proveedor de modelos; un **MCP local de terminal**. ChatGPT/Sign in with ChatGPT,
router LLM y modelo local son **rutas de inferencia**, no agentes distintos.
Tentáculo Hub es una vista opcional del inventario/estado, NO otro Kernel.

**Estado:** código SOURCE en GitHub; instalación, sesión OAuth, voz y cliente
nativo en Lenovo/iPhone **NO VERIFICADOS**. Nunca confundir CI con despliegue.

## Qué ocurrió realmente

- PR #22 (agente + MCP stdio + terminal + UI autónoma) y PR #23
  (Tentáculo Hub contextual) **MERGED** en repo
  `elkakas314/libre_chat_vx`. Son cambios GitHub REMOTO.
- CI = *integración continua*: GitHub instala dependencias en una máquina
  efímera, compila y ejecuta tests. Sus PASS prueban SOURCE, no instalan
  archivos automáticamente en `/home/elkakas314/`.
- `/home/elkakas314/librechat/vx` = código NOSTROMO/VX;
  `/home/elkakas314/librechat/upstream` = LibreChat original con overlay
  instalado; `/home/elkakas314/upstream` = otro checkout LibreChat
  independiente. No fusionarlos por carpetas ni borrar uno sin revisar Git y
  consumidores. Mantener el layout funcional ya elegido.
- NOSTROMO ya es el **nombre visible**. No renombrar repo remoto,
  directorios o remotes sólo por estética: rompería rutas de scripts,
  overlays y MCP. La migración física a una carpeta llamada
  `nostromo` necesita backup, actualización de rutas, pruebas y
  readback, y no es requisito para activar la aplicación.

## Un comando para inspeccionar ANTES de instalar (solo R0)

`cd /home/elkakas314/librechat/vx && npm run nostromo:check`

Requiere que el árbol local VX ya contenga el script nuevo. No hace fetch,
pull, npm install, kill, rename, limpieza ni escrituras. Devuelve en JSON
HEAD locales, estado dirty/untracked, referencias origin/main cacheadas,
existencia del overlay/MCP y puerto 3080. Una referencia cacheada **no**
sustituye comparar contra GitHub remoto actual.

**Secuencia segura de instalación**, aún NO ejecutada:
1. Guardar snapshot/backup fuera de ambos worktrees, incluyendo los
   `package-lock.json` sin seguimiento, las modificaciones del overlay
   y el `librechat.yaml` real, sin copiar secretos a Git/Drive.
2. Comparar la revisión GitHub `main` con el VX local; sólo usar
   fast-forward verificado, sin `reset --hard`, `clean` o force-push.
3. En `librechat/upstream`, comparar overlay actual con el overlay de
   revisión nueva: actualizar archivos VX propios y aplicar patch acotado;
   **NO** ejecutar `scripts/install-as-workspace.mjs` contra un
   upstream dirty (borra/reemplaza partes del árbol).
4. Construir y validar el cliente/web; instalación de MCP node 22+,
   `npm --prefix deployment/nostromo-mcp ci` sólo si lockfile existe
   y coincide; si no, usar método npm del README MCP y registrar árbol
   resultante (no instalar en sistema como root).
5. Agregar la entrada stdio **una vez** en el `librechat.yaml` real,
   preservando configuración previa y leyendo estado de agentes.
   Ejecutar diagnóstico R0 de terminal y comprobar salida real antes de
   activar permisos R2; un agente SOURCE no está instalado automáticamente.
6. Activar acceso móvil privado vía Tailscale Serve **sólo al :3080**
   autenticado, nunca exponer la terminal/MCP como servicio HTTP público.
7. Confirmar recepción de dictado, respuesta hablada, consulta de agente y
   canario de ejecución con recibos/rollback. Registrar consumo de RAM/CPU.

No ejecutar una actualización local si el estado es dirty sin preservar
cada archivo único. **El presente commit no modifica el Lenovo**.

## ChatGPT Plus: vía oficial REAL, límites y gates

- Guía: https://developers.openai.com/siwc/token-sharing-open-source
- Alta OAuth: https://developers.openai.com/siwc/token-sharing-open-source/sign-in
- Límites: https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations
- Condiciones: https://openai.com/policies/sign-in-with-chatgpt-terms/
- LibreChat SOURCE `src/llm/chatgptAuthorized.ts` + `siwcSession`,
  `siwcLoopback`, `siwcIdentity`, `siwcProtectedVault` y
  `siwcResponsesClient`: PKCE/OIDC, cifrado, tokens, modelo y stream.
- **No hay conexión LIVE**: `config/chatgpt_authorized.current.json`
  dice `enabled=false`, `provider_binding=UNCONFIGURED`; falta conectar
  al backend autenticado LibreChat y consentimiento personal. No reutilizar
  token fine-grained de GitHub para OAuth.
- Sign in (identidad) y `chatgpt.tokens.use.direct` (uso del plan) son
  autorizaciones distintas. Plus elegible sujeto a autorización y límites,
  sin compartir claves personales, conversaciones o memoria.
- Ruta Responses SIWC: `store:false`, `stream:true`, historial completo,
  function/custom tools vía herramientas locales del cliente; NO
  `hosted MCP`, `native computer use`, `tool_search`,
  `Code Interpreter`, audio/video ni API de transcripción en esta ruta.
  El MCP de NOSTROMO se ejecuta por LibreChat; no por OpenAI hosted MCP.
- El plan no se puede revender, repartir a otros usuarios, saltar cuotas
  ni utilizar como proxy API genérico. Automatización legítima sólo con
  consentimiento expreso según términos de SIWC. No asumir cuota ilimitada
  ni compatibilidad de todos los modelos/funciones.

## Voz sin cuota/API de pago por defecto

LibreChat oficial admite dictado STT y lectura TTS de navegador, o
Whisper/Piper locales como alternativos. Configurar una sola sección
`speech:` del `librechat.yaml` real, usando
`config/nostromo-voice.fragment.yaml` y conservando otros ajustes.
Predefinido: conversación de voz, idioma español, STT/TTS navegador
sin coste de API, TTS automático; `autoSendText:-1` para no ejecutar
órdenes por error al dictar. No confundir con la ruta SIWC; SIWC no paga
ni habilita transcripción/audio. En Safari iOS antiguo la Web Speech API
puede ser limitada: probar en dispositivo y degradar a dictado nativo
o motor Whisper/Piper local si hace falta (consumo CPU/RAM por medir).

Referencia: https://www.librechat.ai/docs/configuration/stt_tts

## iPhone: aplicación NATIVA, no prometer una PWA como equivalente

Existe cliente nativo tercero, **Switchboard LibreChat Mobile**:
https://github.com/garfiec/Librechat-Mobile
Distribución iOS TestFlight o IPA. **Requiere iOS 16 o posterior**;
compatibilidad del backend personal se debe comprobar, no suponer
que contiene paneles VX/Tentáculo Hub personalizados.
**Un iPhone SE primera generación llega a iOS 15;
un iPhone 6 llega a iOS 12**. Ambos NO pueden usar esa aplicación.
Un iPhone SE segunda generación sí puede superar iOS 16.

Para hardware iOS 12/15, una aplicación nativa NUEVA compatible,
firmada y probada necesita implementación y proceso de firma en
dispositivo; **no está construida ni instalada en este corte**.
No presentar icono de Safari/PWA como app nativa. No comprar servicios
ni prometer instalación sin iPhone/firmado. El usuario deberá confirmar
modelo/iOS real desde Ajustes > General > Información para seleccionar
ruta compatible. No exponer MCP/terminal sin sesión segura desde el móvil.

## MCP, autonomía, y MANOJOS: fronteras reales

El servidor MCP NOSTROMO puede albergar herramientas de terminal, archivos,
Git, Microsoft Graph, correo, tareas y otras integraciones mediante
adaptadores autenticados. **MCP es un protocolo de herramientas**, NO por
sí mismo un planificador, scheduler, ledger de ejecuciones, política de
gobierno, recurso/carga, rollback, recibos y autorrecuperación.
Para sustituir MANOJOS materialmente se necesita implementar y verificar
esas funciones en la capa del agente/runtime; añadir nombres de herramientas
al MCP no garantiza autonomía ni pruebas.

Tentáculo Hub actualmente muestra árbol SOURCE local NOSTROMO
(agente/MCP/modelos) y conexiones futuras MANOJOS/VX13/ORÁCULO.
Puede EVOLUCIONAR a catálogo semántico `intención → herramienta → permisos
→ estado → evidencia`, activación/desactivación controlada por admin,
dependencias y seguimiento. No marca LIVE sin readback ni ejecuta
operaciones al seleccionar una tarjeta. La PR #25 en paralelo desarrolla
catálogo MCP; evitar duplicar trabajo/servicios.

## Gates pendientes, sin falso cierre

`GITHUB_SOURCE` (CI exact HEAD) distinto de `LENOVO_INSTALLED`,
`OAUTH_CONSENTED`, `MOBILE_NATIVE_INSTALLED`, `MCP_LIVE`,
`VOICE_VERIFIED` y `MATERIAL_VERIFIED`.
Los últimos seis **NO_VERIFICADOS** en este corte. El próximo gate
material es preflight y backup de los worktrees reales, con readback
y actualización reversible, sin re-clonar ni tirar trabajo único.
