# NOSTROMO · Wireframes y aceptación visual (R0)
Fecha: 2026-11-05
Estado: WIREFRAME_ONLY. **ANTES del cambio de componentes**.
Fuente: capturas reales del upstream LibreChat f10b1d91 con overlay OFF/ON en Actions 41993519994; no mock de sidebar. Limitación del run: mobile OFF falló en selección de modelo, después de guardar captura; desktop OFF y desktop/mobile ON tienen capturas. No confundir con LIVE del Lenovo.

## 0. Problema demostrado
- Con VX ON, el shell de conversación pierde ~media anchura sin interacción.
- Con VX OFF, se ve una columna vacía: ReactElement no-nulo obliga a SidePanelGroup a reservar panel aunque el hijo retorne null.
- Con VX ON en móvil, el panel toma la pantalla entera, ocultando la conversación sin retorno claro.
- Se muestran scopes, connection UNKNOWN y authority:false como texto crudo.
- La prioridad original Artifacts > Subagent debe permanecer intacta.

## 1. Cinco reglas de UX
1. La conversación es el producto: nunca encoger el chat por estados UNKNOWN o paneles por defecto.
2. Un solo espacio nativo de contexto, abierto por voluntad del usuario o una tarea activa que lo justifique.
3. Tentáculo/NOSTROMO es identidad y foco discreto; diagnósticos sólo en revelación progresiva.
4. Verdad humana: "No conectado / Pendiente de configurar" con fuente y última observación cuando exista; nunca READY inventado.
5. Móvil y escritorio comparten conversación y pueden cerrar el contexto sin pérdida de hilo, permisos ni reproducción de efectos.

## 2. Wireframe A — chat vacío / primer acceso

ESCRITORIO (~1280 px)
┌── Sidebar LibreChat ───┬──────────────────────────────────────────────────────────┐
│ Proyectos             │ Modelo / NOSTROMO                    [ Contexto · ✦ ] │
│ Conversaciones        │                                                          │
│ Historial             │             ¿En qué puedo ayudarte?                     │
│                       │                                                          │
│                       │ [ Escribe un mensaje…                                ↵ ] │
└───────────────────────┴──────────────────────────────────────────────────────────┘
El botón "Contexto" es una única acción, no abre nada por defecto. La sidebar y el compositor nativos no cambian.

MÓVIL (~390 px)
┌──────────────────────────────────┐
│ [☰] NOSTROMO        [Contexto]   │
│                                  │
│      ¿En qué puedo ayudarte?     │
│                                  │
│                                  │
│ [Mensaje…                      ] │
└──────────────────────────────────┘

## 3. Wireframe B — respuesta / evidencia contextual
┌─ Sidebar ───────────┬──────────────────────────────────────────────────────────┐
│ Conversaciones     │ [Contexto ✦]                                             │
│                    │ Tu: Estado de MANOJOS3                                   │
│                    │ NOSTROMO: Todavía no hay conexión verificada.             │
│                    │ [Consultar estado] [Ver detalles]                         │
│                    │                                                          │
│                    │ [Mensaje…                                              ] │
└────────────────────┴──────────────────────────────────────────────────────────┘
NOSTROMO explica en conversación. No se inyectan comandos ni datos técnicos falsos. No se llama al target en el wireframe.

## 4. Wireframe C — panel contextual solicitado
┌─ Sidebar ───────────┬──────── Conversación ──────────┬── Contexto ─────────────┐
│ Historial          │ Tu: ¿Qué sistemas hay?         │ NOSTROMO     [Cerrar]  │
│                    │ NOSTROMO: ...                   │                         │
│                    │                                │ MANOJOS3               │
│                    │                                │ Pendiente de conectar  │
│                    │                                │                         │
│                    │                                │ VX13                   │
│                    │                                │ Diseño / no disponible │
│                    │                                │                         │
│                    │                                │ [Detalles técnicos ▾]  │
│                    │ [Mensaje…]                     │                         │
└────────────────────┴────────────────────────────────┴─────────────────────────┘
Una sola ranura contextual NATIVA: conserva prioridad Artifacts/Subagents. El launcher sólo controla solicitud, nunca autoridad.

MÓVIL al solicitar contexto
┌──────────────────────────────────┐
│ [← Volver al chat]    NOSTROMO   │
│                                  │
│ Contexto                         │
│ MANOJOS3 · Pendiente             │
│ VX13 · En diseño                 │
│                                  │
│ [Detalles técnicos ▾]            │
└──────────────────────────────────┘
En móvil el panel ocupa una vista, pero **sólo bajo solicitud** y con acción visible para volver. No se apilan listas largas.

## 5. Rondas de diseño y criterios
R1 · Rescatar conversación: chat nativo 100% disponible con panel cerrado; OFF no roba anchura; botón accesible; contextual abierto sólo por clic; cerrar devuelve el chat. Evidencia desktop/mobile, ancho del main, screenshot y browser errors.
R2 · Presentación: un único bloque compacto con dos destinos distinguibles, sin "scope", "binding" o "authority:false" en pantalla normal; detalles técnicos en disclosure, sin perder verdad; contraste y teclado.
R3 · Integración: caso con respuesta y panel abierto, prioridad Artifacts/Subagents, retorno móvil, cierre por Escape, contenido quepa en 390 px, deshabilitación completa con feature flag OFF. Captura final upstream real y pruebas automatizadas.

Rechazar Rn si: aparece columna vacía, se oculta chat sin posibilidad de cierre, UI finge conexión o botón que parece ejecutar efectos sin autorización. Mantener 0/7 gates LIVE. No tocar runtime MANOJOS3, VX13, ORÁCULO, Cloudflare ni Tailscale.
