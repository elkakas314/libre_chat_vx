# NOSTROMO · Iteraciones UX y evidencias del upstream real
Fecha: 2026-11-05
Ámbito: GitHub SOURCE, con LibreChat upstream f10b1d91 fijado y backend E2E temporal. No host Lenovo ni targets LIVE.
Rama: feat/nostromo-chat-first-ux-20261105; PR #15 DRAFT.

## R0 — Prerrequisito real
LibreChat original: run 41992479507, artefacto 13399315301.
Overlay diagnóstico anterior: run 41993519994, artefacto 13398864705.
Comprobado: chat 920 px sin panel versus ~460 px con VX abierto automáticamente; flag OFF aún reserva columna vacía. En móvil el panel VX ocupa la vista y no dispone de retorno claro.
El run global R0 rojo se debió al selector de modelo móvil OFF después de capturar la pantalla; la rama ON desktop/móvil completó. No falsear PASS global.

## R1 — Chat primero
Commit UX inicial de la PR #15, canary E2E run 41996052069 SUCCESS y artefacto 13401060201.
Sin solicitud: VX ON tiene el chat completo 920 px en 1280 escritorio y 390 px en 390 móvil, launcher discreto, contextCount=0. Tras abrir: contextCount=1, mainWidth 459.5 en desktop; móvil muestra contexto y botón volver. Tras cerrar: contextCount=0, mainWidth vuelve a 920/390. documentWidth=viewport, browser page errors=[].
SOURCE run 41996051882 y visual-source-smoke 41996051875 ambos SUCCESS.
Mejora: elimina abertura automática y columna vacía.
No mejora todavía: panel muy estático, escasa jerarquía/relación con conversación, foco no verificado.

## R2 — Jerarquía, datos comprensibles y temas
Commit 6b08da613b3ed488229f19c12d76e9a0e5563a43.
E2E run 41997042471 SUCCESS; artefacto 13400663124.
Capturas exactas: overlay-enabled/vx-on-desktop-context-open.png, vx-on-mobile-context-open.png, vx-on-desktop-context-light.png, vx-on-desktop-technical-details.png, vx-on-mobile-technical-details.png.
Métricas: documento no desborda 1280 o 390; chat cerrado 920/390; abierto 459.5/390; errors=[].
Mejora: estados en lenguaje humano, detalles ocultos por defecto, contraste observable en claro/oscuro, cabecera y cards contextualizadas.
No mejora todavía: accesibilidad automática completa y flujo teclado/Escape/foco; no hay conexion material a targets.

## R3 — Teclado / foco / recarga
Commit 2db3b65e7b21b777efa77288854214bea6082641. E2E nativo run 41998066383 SUCCESS, artefacto 13401611221; source-check run 41998066414 SUCCESS y visual-source-smoke run 41998066436 SUCCESS.
Al abrir contexto el foco inicial está en Volver. Escape cierra, foco regresa a Contexto; Enter reabre; cierre normal devuelve foco; tras recarga panel cerrado; no overflow. Browser page errors [].
Capturas: overlay-enabled/vx-on-desktop-escape-return.png, vx-on-desktop-reloaded-chat.png, vx-on-mobile-escape-return.png, vx-on-mobile-reloaded-chat.png, vx-on-mobile-context-open.png.
MainWidth desktop cerrado/reload 920 y abierto 459.5; móvil 390 en todos los casos. No fallos de CI.
Mejora: navegación por teclado y continuidad de conversación; sin acciones materiales.
Límites: aún falta revisión humana y E2E real de Artifacts/Subagents activos, además de todos los gates LIVE.

## R4 — Verdad del enlace y precedencia nativa
Commit de código a5e5bad71a2b4f21e9058de5bb2aded2675dc9d3. SOURCE run 41999106330 SUCCESS, visual-source-smoke 41999106461 SUCCESS y E2E nativo 41999106407 SUCCESS, artefacto 13402026570.
MANOJOS3 se etiqueta «No enlazado» para no afirmar que el runtime independiente esté OFFLINE; VX13 sigue «En diseño». El texto explica que estos estados pertenecen al enlace desde NOSTROMO.
Si un Artifact o Subagent está activo, el botón Contexto queda deshabilitado y NOSTROMO no reclama el panel; la solicitud se cierra cuando el panel nativo toma prioridad. No se ha creado otro panel ni modificado contratos.
En el E2E con modelo simulado, desktop 1280/1280 y móvil 390/390 no desbordan; chat cerrado = 920 px en escritorio y 390 en móvil; contexto abierto 459.5/390, cerrado vuelve a 920/390; pageErrors=[]. Teclado, Escape, Enter, foco y recarga PASS.
Capturas: artefacto 13402026570, overlay-enabled/vx-on-desktop-context-open.png, vx-on-mobile-context-open.png, vx-on-desktop-reloaded-chat.png, vx-on-mobile-reloaded-chat.png.
Limitación: R4 verifica el comportamiento sin Artifact/Subagent activo, y la precedencia se contrasta por lógica fuente y compilación; el E2E de Artifacts/Subagents ACTIVOS sigue pendiente, no se marca PASS.


## Reglas de promoción
No mezclar el source UX con los gates LIVE. Ninguna captura acredita implementación de Tentáculo Link VX13 (aún diseño), MANOJOS3 target binding, Cloudflare AI Gateway ni medición Lenovo. Bloque1/2 arquitectura, contratos y canarios intactos; NO merge de PR #15 sin revisión de la interfaz y pruebas de convivencia con Artifacts/Subagents.
Preservar autoridad: MANOJOS3 Policy/Kernel y VX13 Madre bajo Tentáculo Link; NOSTROMO sólo UI, inferencia y proyección. Itinerancia con un backend/historial, autenticación renovada y sin replay material.
