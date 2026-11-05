# NOSTROMO — UX conversacional, itinerancia y enlaces con MANOJOS3/VX13
Estado: DESIGN_DELTA / NO_UI_CHANGE / NO_LIVE, 2026-11-05.

## Procedencia y alcance
- LibreChat VX, \`elkakas314/libre_chat_vx\`, rama \`handoff_current_bootstrps\`: \`docs/LIBRECHAT_ARCHITECTURE_CURRENT.md\`, \`docs/TARGET_PARITY_VX13_MANOJOS3_CURRENT.md\`, \`docs/MOBILE_REMOTE_ACCESS_CURRENT.md\`, \`src/targets/targetGateway.ts\`, \`src/mobile/*\`, \`src/librechat/panelArbiter.ts\`.
- Fuente VX13 viva en Google Drive: "VX13 — Maestro · Blueprint arquitectónico y contractual auditado v0.9.33" (documento 1vqdo1WnIOx1tAN543eYrIM0QYU77TeCQ1Q_dk5PDMLg) y A-54 03/UI (1TmbGgWZdFUygSwtDLDqEPgMFuSq16w-80fhj9fszEaY) + A-54 06/Link (1eo2UNmF7729CVND85sUUUO4kYomzTQKWFC39v7b9xwk), revisados 2026-11-05. A-54 = DISEÑO, NO_FZ, NO_IMPLEMENTED, NO_LIVE. VX13 repo main = 9ee9d63582832f6bad5a72b4bccf30846c85fabf (diseño, no backend LIVE acreditado).
- El presente documento es propuesta estrecha de aceptación de la cabina y del cableado futuro. No promueve AP/IDEA de VX13 a canon ni modifica C01–C12; no modifica Bloc 1/2 de LibreChat, contratos, canarios, código ni autoridad. Los vínculos con target exigen compatibilidad con su canon propio.

## Decisión UX
El producto visible es un solo chat LibreChat con voz/archivos/historial/proyectos. NOSTROMO añade identidad conversacional, foco y resultados en las superficies NATIVAS ya disponibles (compositor, Artifacts, panel compartido, ToolApproval, Files, MCP UI). No añade un panel técnico predeterminado ni otra pantalla de navegación.

Cinco principios:
1. Chat-first: al iniciar, el centro es conversación y la propia barra lateral nativa; cero diagnósticos automáticos.
2. Progresive disclosure: componente técnico sólo cuando el usuario pide "detalles", una autorización pendiente o una incidencia real.
3. Un único contexto visible: los Artifacts/Subagents nativos mantienen prioridad; NOSTROMO nunca reclama la ranura si el panel no se pidió.
4. Verdad sin ruido: chip de disponibilidad con estado y fecha real; UNKNOWN/NO_VERIFICADO visible sin convertirlo en terminal de métricas.
5. Itinerancia por sesión, no por copia: PC y móvil comparten backend, historial, foco efímero y estado remoto contrastado; nunca reintentan efectos materiales.

Pantallas para revisión visual, sólo DESPUÉS del prerrequisito de 4 capturas sobre upstream REAL:
A. Chat vacío: shell nativo, nombre NOSTROMO discreto, composer y rutas nativas.
B. Chat con respuesta: mensaje enriquecido + enlaces de evidencia, navegación normal y cero dashboard superpuesto.
C. Panel contextual solicitado: una sola tarjeta/recurso relevante, cerrar/regresar conserva conversación; móvil ocupa vista contextual con botón volver y sin overlay persistente.

Tres rondas obligatorias, cada una con desktop 1280×900, móvil 390×844, captura y análisis de mejoras/regresiones:
R1: eliminar duplicaciones y panel técnico inicial.
R2: jerarquía, accesibilidad/teclado/contraste, tamaños y móvil.
R3: contexto real, aprobaciones/errores/UNKNOWN, chat+Artifacts+Subagents, cambios de red/reconexión.
Aceptación sólo con test browser + capturas nuevas + inspección humana: "compila" no basta.

## Cables y dueños

\`\`\`text
PC / móvil — una sesión LibreChat y mismo historial
              │
        LibreChat / NOSTROMO
        ├── Chat, Files/RAG, Artifacts, ToolApproval nativos
        ├── Identity/Inference Gateway → Cloudflare AI Gateway (cognición, NO gobierno)
        ├── CurrentFocus/ContextRef, HUD discreto (authority=false)
        └── NostromoTargetGateway (fachada IN-PROCESS, authority=false)
             ├── Manojos3McpAdapter → MANOJOS3 MCP →
             │    Governor → Policy → Kernel → Readback → Verifier → Receipt
             └── VX13TargetAdapter (NO INSTALLED) → Tentáculo Link único →
                  Switch → Madre → [Manifestator] → Spawner/hija →
                  Readback → Madre/Verifier → Receipt
              ORÁCULO: sólo advisory, jamás autoridad
\`\`\`

MANOJOS3 conserva su runtime y puertos; VX13 su Madre/Link. No mezclar repositorios ni transportar estado de ejecución entre ellos. Las decisiones técnicas se entregan en contratos acotados en el destino, no "copiando todo" a LibreChat.

### Admisión de cada destino
* SOURCE: contrato conocido ≠ runtime listo.
* CONFIGURED: endpoint/identidad/roles validados; secretos nunca en repositorio.
* LIVE_READ: R0 autenticado + snapshot fresco + capability_revision + owner + ACL + evidencia; UI permite explicar/visualizar.
* LIVE_GOVERNED: además autorización destino vinculada a actor/target/operación/TTL/preimagen, fence idempotente, receipt y verifier; UX no emite un PASS.
* Si falta Link VX13 o revoca permisos: UNAVAILABLE/GATED; no simulación de "READY".

Para VX13 no usar MCP inventado ni endpoint de MANOJOS3 como sustituto de Tentáculo Link. Ramas sugeridas de contrato para un futuro módulo VX13: RequestEnvelope, ContextRef con TTL/ACL/provenance, UiCapabilityProjection, UiAction/ControlDraft, Snapshot+cursor opaco, EventResume/ResyncRequired, AuthorizationChallenge, ExecutionReceipt. Campos y nombres definitivos se obtienen del canon VX13 aprobado, no se dan por implementados por este documento.

### Itinerancia y estados
1. Acceso LOCAL cuando se esté en el mismo host.
2. Móvil remoto: Tailscale Serve con identidad/ACL como base; opcional Cloudflare Tunnel + Access, nunca exponer MCP/host-control/DB.
3. Una instancia LibreChat: mismos hilos/historial, native resumable streams. Salida/reentrada autentica, refresca ACL, estados de target y ContextRef; el foco de UI nunca es autorización.
4. Sin red: snapshot READONLY si disponible, borradores locales. No almacenar token de target/credenciales en caché ni en capturas. No crear cola de mutaciones ni confirmaciones.
5. Wi-Fi↔datos, pestañas, PC↔móvil, backend down, revocación y cambio de perfil de inferencia: reanudar sólo flujo cognitivo autorizado; UNKNOWN_OUTCOME en efecto posible requiere readback exacto antes de permitir nueva solicitud.
6. Push/Agent Events sólo notifican; al abrir, consulta autenticada fresca. Evitar streaming energético de 60 FPS. Medir CPU/RAM en Lenovo DESPUÉS, por MANOJOS3.

## Reutilización SOURCE real y gates de ejecución
Ya diseñados en LibreChat VX: mobileContinuity, mobileRecovery, remoteAccess, resumable boundary, NostromoTargetGateway, Manojos3McpAdapter, panelArbiter, CurrentFocus. No reimplementar ni renombrar estos módulos por estética.

Pruebas GitHub-first:
- E2E real sobre LibreChat upstream f10b1d91 con mock LLM y feature flag OFF/ON, capturas chat vacío/chat respuesta/contextual en desktop+móvil.
- Aserciones: sin segunda sidebar; no robo de Artifact/Subagent; panel NOSTROMO no presente sin solicitud; abrir/cerrar reversible; no overflow; no error de consola; teclado y lector; no acción RED con target AUTO/BOTH.
- Cobertura específica de itinerancia SOURCE: LOCAL/TAILSCALE/UNAVAILABLE, resume stream cognitivo, revocación ACL, zero material replay, UNKNOWN_OUTCOME y reconexión.
- Conectores LIVE para MANOJOS3 y VX13 NO se ejecutan ni se marcan PASS desde CI. VX13 permanece DESIGN_GATED mientras no haya frontdoor material acreditado.
- Evidencia de cada gate: revisión/source SHA, screenshots, browser logs, JSON, test/run IDs, riesgo y rollback.
- Instalación final con MANOJOS3: posterior a UX aceptada, artefacto reproducible, versión fijada y medición de bajo consumo.

## Bloqueos explícitos
- Prerrequisito estricto de usuario: ninguna edición de UI hasta ver capturas de UPSTREAM REAL con flag OFF y ON.
- Prohibido nuevos SidePanels, motores semánticos, gateways, servidores, proxies, ledgers o autorizadores.
- Prohibido marcar LIVE/VERIFIED por maqueta, documentación, CI, screenshot o HTTP 200.
- Este documento es un delta de criterios, no una modificación de arquitectura Bloque 1/2 ni un handoff de ejecución al target.
