---
name: nostromo-visualization
description: Compose NOSTROMO's conversational visual responses using native LibreChat views; prefer an organic, intent-led cabina over diagnostic dashboards, preserving provenance, authority and mobile continuity.
---

# NOSTROMO — Visualización orgánica y contextual

## Regla de producto
NOSTROMO es **una voz y una conversación**. El chat nativo de LibreChat es la superficie principal. La visualización amplifica la respuesta, nunca desplaza por defecto la conversación ni convierte el cockpit en un panel de Kubernetes.

No hay modos manuales de operador: detectar la intención, el foco y la evidencia disponible, y mostrar únicamente lo relevante. Las ventanas nacen y desaparecen al cambiar el foco; mantener siempre una vía visible de regreso al chat. Reutilizar Artifacts, Files, ToolApproval, Subagents, panel contextual y otras superficies nativas. No agregar sidebar ni SidePanel nuevos.

## Representación por necesidad
- Explicación breve: texto conversacional; **sin panel adicional**.
- Jerarquía de recursos: Resource Tree limitado a la rama del foco.
- Cronología: timeline acotado al intervalo y evidencia.
- Alternativas: comparación compacta.
- Relaciones y recorrido de una intención: Mermaid/flujo con productores, consumidores, límites de autoridad y receipt.
- Estado o salud: una línea de verdad humana con fecha/procedencia; detalles técnicos desplegables únicamente cuando se pidan.
- Evidencias y artefactos: Artifact nativo, preview y referencias; abrir bajo demanda.
- Intención con riesgo: resumir qué se solicita y dónde recae la autorización; ToolApproval nativo no suplanta Policy/Kernel/Madre.

## Dirección de arte y densidad
1. **Chat primero**: ancho completo con NOSTROMO desactivado o contexto cerrado. No abrir diagnóstico de MANOJOS3/VX13 por render inicial, ni cuando el estado sea UNKNOWN.
2. **Nave orgánica, no cuadrícula azul**: tipografía bien jerarquizada, fondo neutro del tema, mucho espacio para lectura y un solo acento elegido con moderación. Evitar superficies rectangulares azules repetidas, cajas rígidas, sombras excesivas, botones de colores semafóricos como UI principal y ruido de telemetría.
3. **Foco vivo**: cada mensaje puede enlazar un mapa, documento o módulo relevante sin abrirlo por defecto. No dibujar todos los módulos. Usar disclosure progresivo.
4. **Verdad sin jerga cruda**: traducir SOURCE_ONLY, authority=false, scope y binding a lenguaje humano («no enlazado», «sin verificación reciente»), sin esconder estado, incertidumbre, fuente, fecha ni los límites.
5. **Accesible y adaptable**: teclado, foco inicial/retorno, Escape, contraste en claro/oscuro, reduced-motion, ancho móvil 390 px y no overflow. El panel nativo Artifacts/Subagents conserva precedencia.

## Interacción y límites
- Visual controls are UI intents only; they never directly mutate a target.
- Preserve provenance and uncertainty in the visual result; do not infer LIVE or PASS from mocks, screenshots, build, feature flags or HTTP 200.
- Do not send hidden/system data to a model merely because a panel is visible.
- No nueva Skill/renderer/daemon si un componente de LibreChat nativo cubre la necesidad.
- No duplicar Kernel, Policy, Gateway, scheduler, memoria, autorizador, motor UI o túnel.
- La UI admite ContextRef y continuidad PC/móvil, pero al reconectar NO reintenta efectos materiales.
- MANOJOS3 mantiene su gobierno; VX13 mantiene Tentáculo Link/Madre y su aceptación propia; ORÁCULO sólo advisory.

## Gate de calidad antes de marcar diseño aceptado
1. Montar el **upstream fijado real** (no un mock de sidebar): chat vacío, chat con respuesta y contexto solicitado; desktop y móvil.
2. Capturar tema claro/oscuro, accesibilidad por teclado, estado NO_VERIFICADO, Artifact/Subagent nativo realmente activo, abrir/cerrar y regreso móvil.
3. Comparar **captura anterior → nueva** con criterio explícito: superficie ganada para conversación, foco, densidad, estado honesto, contraste, layout/overflow, errores de consola y regresiones.
4. Repetir rondas visuales hasta aceptación humana; compilar o pasar fixture no basta.
5. No cerrar el gate LIVE hasta probar el host y conectores con readback propio.

**Esta Skill rige comportamiento/presentación cuando se cargue; por sí sola no instala CSS, no activa GitHub Skill Sync y no acredita una cabina nueva en el Lenovo.**
