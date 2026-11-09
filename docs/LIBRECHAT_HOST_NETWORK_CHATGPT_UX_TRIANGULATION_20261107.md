# LibreChat VX — Auditoría triangular de instalación, cabina, redes y ChatGPT sin API
Fecha de corte: 2026-11-07. Clase: AUDIT_SOURCE_WITH_LIVE_HOST_READBACK / NO_INSTALL / NO_MERGE.

## Resumen de verificación
La fuente SOURCE más avanzada inspeccionada sigue en GitHub `elkakas314/libre_chat_vx`, rama UX `feat/nostromo-chat-first-ux-20261105@738a5bc12fa99e73e80b412f7ef930a6f780286b` (PR #15 DRAFT, sin merge), sobre `handoff_current_bootstrps@aff692fb9707a29e7e741a038fcdb1c2d03efeb8` y `main@ebbd17573d9f3f0e8599728a3540a3ce05ee72ca`.
CI de ese HEAD de código/documentación: source-check #42000046980 SUCCESS, visual-source-smoke #42000046965 SUCCESS, vx-native-visual-prerequisite #42000046993 SUCCESS. El último es Chromium sobre LibreChat original fijado y backend/modelo de pruebas; no el Lenovo.
El usuario NO ha aceptado el aspecto visto de la cabina: priorizar validación visual real, no dar aprobado el diseño por esos CI.

## Raíces Lenovo: SOURCE/INSTALLED no implica servidor LIVE
- `/home/elkakas314/librechat/vx`: clon VX con `main@94c632762f7afee7d9fa9d0f0c23c80d7494d2d2`, carpeta `src`, `contracts`, `tests`, `dist`, `node_modules`, overlay, docs. GitHub `main` está 18 commits por delante; `handoff` 314 commits por delante. No hay commits exclusivos locales en estas referencias. Árbol dirty/untracked = UNKNOWN.
- `/home/elkakas314/librechat/upstream`: upstream `f10b1d91f1eee3a2c82d5247bf620351486b7c1b`, `packages/librechat-vx` con build/dependencias, `client/src/components/VX/VXCockpitBridge.tsx` y marcador `.librechat-vx-overlay.json`. Puente antiguo de 387 caracteres que monta `SourceOnlyCockpit`; NO R4.
- `/home/elkakas314/upstream`: otra copia upstream `f10b1d91f1eee3a2c82d5247bf620351486b7c1b`, sin paquete `librechat-vx` en inventario de packages. Mantener como referencia intacta hasta inspeccionar Git dirty.
- `/home/elkakas314/librechat/config`, `data`, `logs` vacías en inventario R0. No existen raíces `/librechat/vx/skills` ni `/librechat/vx/plugins` en el snapshot local. Esto NO acredita Skill Sync instalado.
- Docker CLI allowlisted: un contenedor enumerado `openclaw-b-isolated-openclaw-gateway-1` con estado saludable; ningún contenedor LibreChat, Mongo, Meili o Redis. Procesos R0 incluyen LiteLLM, cloudflared, Tailscale, Redis, Caddy y Docker; el filtro no identificó un servidor Node/LibreChat. No hubo GET autenticado de `127.0.0.1:3080`: puerto/servicio = **NO_VERIFICADO**, no afirmar indiscriminadamente «no instalado».
- Playwright MCP devolvió `MCPProtocolError`, así que no hay captura local LIVE. Display X11 presente. No se activó navegador externo ni se alteró sesión.
- MANOJOS3 `LIVE/READY` es sistema aparte, y su self-knowledge: `librechat_configured=false`. El `cli.execute.registered` allowlist GIT sólo permite VERSION; no `git status`. No hacer shell/bypass ni sobrescribir trabajo no versionado.

## Integraciones y túneles, sin duplicados
R0 MANOJOS3 confirmó: `tailscale.status` backend Running y online; `tailscale.serve.status` configured=false; `tailscale.funnel.status` configured=false. `cloudflare.tunnel.metrics`: métricas accesibles con 4 conexiones HA; `cloudflare.edge.health` retorna MANOJOS3 v0.4.0 HTTP 200, no LibreChat. `cloudflare.wrangler.status`: Wrangler presente. `llm.litellm.status` healthy (200); `llm.router.status` default `litellm_if_healthy_else_openrouter_direct`, policy NO_PAID_ONLY: plano de MANOJOS3, no evidencia del router LibreChat.
LibreChat SOURCE vigente separa: (A) frontend local 127.0.0.1:3080; (B) Tailscale Serve privado opcional para PC/móvil; (C) Cloudflare Tunnel + Access público opcional bajo identidad; (D) **Cloudflare AI Gateway de inferencia saliente**, que NO es un túnel; (E) NostromoTargetGateway in-process, que NO es un proxy HTTP adicional. No migrar túneles ni LiteLLM de MANOJOS3 al proyecto.
Config `config/cloudflare_ai_gateway.current.json`, `config/parallel_transport.current.json`, `config/transport_registry.current.json`, `deployment/parallel-transport/*`: **SOURCE**, pero ruta/proveedor AI Gateway LibreChat LIVE no verificados. Nunca crear 2.º Cloudflare Tunnel ni segundo proxy por inercia.

## Skills, plugin y apariencia
En GitHub PR #15: 12 raíces físicas Skills = 10 activas + 2 alias (según `config/skills.current.json`), incluido `skills/nostromo-visualization/SKILL.md`. `plugins/vx-nostromo` = esqueleto Agent Plugin opcional. `deployment/skill-sync/README.md` fija despliegue en dos fases con canario autenticado, pero no hay una Skill Sync LIVE local demostrada.
Las capturas R0→R4 GitHub prueban que el panel diagnóstico dejó de abrir por defecto; no acreditan una estética aceptada. El usuario rechaza expresamente el último cockpit visto: mucho azul, cuadrículas y paneles técnicos. El diseño futuro debe preservar LibreChat nativo: conversación/voz central, foco inferido, Artifacts y ventanas sólo por relevancia, no dashboard persistente; barras de estado honestas y discretas.
El documento de conversaciones antiguas `Acceso a hilos proyecto.txt` presenta el patrón de cabina orgánica en un contexto VX11 histórico; **reutilizar el patrón de UX, NO asumir que arquitecturas VX11/VX13/MANOJOS3 son intercambiables**.
Se amplía la Skill `nostromo-visualization` existente, no se crea otro núcleo, pero la Skill no sustituye un rediseño JSX/CSS con screenshots reales.

## ChatGPT mediante cuenta, NO API (decisión de frontera)
1. ChatGPT por navegador/app oficial: experiencia independiente; abrir/enlazar desde NOSTROMO no equivale a usar la suscripción como motor OpenAI-compatible.
2. `Sign in with ChatGPT` oficial: sólo apps/sitios **participantes** ofrecen identidad; ciertos socios pueden pedir **por separado** permisos de uso de la asignación del plan. LibreChat VX **no está acreditado como socio** ni con dicho flujo. No simular OAuth genérico ni prometer cuota.
3. Codex CLI/IDE puede iniciar sesión con ChatGPT para tareas de desarrollo (factores de plan), no es gateway general de inferencia del chat LibreChat.
4. API Platform y sus créditos son independientes del plan ChatGPT; no activación de pago, no dependencia de claves de API OpenAI.
5. Prohibido usar cookies de ChatGPT, scraping programático de su web o proxy clandestino para suplantar API; la EEE prohíbe extracción automatizada de salida de servicios ChatGPT. Diseñar sólo enlaces oficiales, identidad autorizada o integración recíproca mediante Apps/MCP compatible si se publica y verifica separadamente.
Fuentes oficiales verificadas: https://help.openai.com/en/articles/20001410-sign-in-with-chatgpt ; https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan ; https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform ; https://openai.com/es-ES/policies/eu-terms-of-use/ .
*No implementar conexión ChatGPT no verificada en este corte.*

## Hilos históricos versus arquitectura vigente
- Antiguo NOSTROMO_HYBRID proponía voz/persona local ligera (1–2 GB) y LiteLLM MANOJOS3 para razonamiento. El diseño SOURCE actual fija identidad NOSTROMO estable, modelo local opcional y Cloudflare AI Gateway para inferencia LibreChat, sin fallback de pago. Retener el razonamiento histórico como evolución documentada; no reactivar camino antiguo por memoria.
- VX13 requiere Tentáculo Link/Madre cuando exista frontdoor real; MANOJOS3 mantiene MCP Policy/Kernel/Verifier y su propio LiteLLM; ORÁCULO sólo advisory. No convertir LibreChat en segundo ejecutor.

## Gates pendientes (orden seguro)
A. Confirmar sin mutación working tree/untracked y hashes de local VX + dos upstream; preservar local único antes de cualquier copia.
B. Verificar disponibilidad real del HTTP local `127.0.0.1:3080`, autenticación/estado frontend y backend antes de actualizar nada; determinar cómo arranca realmente.
C. Diseñar y probar en GitHub **nueva estética orgánica**, no retocar las tarjetas azules, con capturas de chat vacío, conversación, contexto, Artifacts/Subagents realmente activos, claro/oscuro, teclado y móvil. Aceptación humana requerida.
D. GitHub Skill Sync Stage1 12 → Stage2 10 únicamente con canario admin LIVE y rollback; no asumir por build.
E. Validar Cloudflare AI Gateway proveedor/rutas de coste cero y secreto autorizado; separado del Cloudflare Tunnel MANOJOS3.
F. Validar Tailscale Serve privado sólo cuando el servicio LibreChat local esté READY y se haya inspeccionado ACL; Tunnel+Access público queda opcional. Evitar duplicar.
G. MANOJOS3 R0 y VX13 Tentáculo Link sólo si sus fronteras específicas están CONFIGURED y LIVE; no replays tras reconexión.
H. Integrar PR #15 únicamente tras prueba visual y riesgos de Artifact/Subagent; promover release reproducible y después instalar con MANOJOS3. Ninguna operación host realizada en este corte.

## Evidencia y continuidad
R0 host: `run-d0089d0f-abfd-4a09-90b0-86f1e5f7d308` (red/LLM/serve), `run-abe9774e-d290-4b04-9732-bd1eee99702b` (Cloudflare/ventana/procesos), `run-3d4318b5-17e3-4e4f-99a0-95222331b191` (CLI inventory), `run-be821c5f-6f9e-4789-94e2-cf969f13fcb1` (Docker), `run-61354855-e970-43cb-894a-3f19ec325be1` (Playwright NO_PASS), `run-d86097b3-292b-4e8e-8520-225ca03ec6d7` (skills dir missing), `run-1e889f2e-e21b-40d2-bc94-59a362a6a2c1` (plugins/config/local directories). Estado previos noviembre: docs 00/10/20/30/40 actualizados y verificados por readback. Este corte requiere NUEVO delta sin sobrescribir la historia.
No claim de sincronización física de las tres superficies hasta pruebas de hashes y readback local. PR #15 sigue DRAFT. **No se modificaron MANOJOS3, VX13, ORÁCULO ni las carpetas Lenovo.**
