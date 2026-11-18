# Informe Gemini Deep Research — recepción y preservación de hallazgos
**Fecha:** 2026-11-18. **Origen:** informe aportado por el usuario («NOSTROMO — GEMINI DEEP RESEARCH — AUDITORÍA Y SOLUCIONES», 172 líneas). **Calidad de evidencia:** EXTERNAL_RESEARCH_UNVERIFIED. Esta transcripción editorial recoge sus afirmaciones y su código sustanciales; no constituye un receipt ni un patch adoptado.

## A. P0 que Gemini describe
- Qwen3-4B-Instruct-2507 con `num_ctx=6144`, preflight de 11 herramientas MCP (8 diferidas, 3 directas); ~3152 tokens de instrucciones y ~5302 de definiciones. Informe atribuye ralentización (4–5 minutos), mensajes que no caben y presión CPU/swap a todos los schemas enviados inicialmente.
- Atribuye a `@librechat/agents@4.0.1` un defecto sistemático de poda diferida; **esta causalidad NO está demostrada** por el informe y contradice parcialmente el código upstream real. Separar medición y conjetura.
- Afirma problemas de turnos sin persistir (`unfinished=true`, `PARENT_NOT_READY`) ligados a PR #14118; **no adjunta logs sanitizados ni consultas de estado verificables**.
- Identifica correctamente el riesgo de desalineación GitHub SOURCE / Lenovo LIVE / documentación Drive.

## B. Capacidades y configuración que propone
Agent Builder, Artifacts/ArtifactDock, MCP stdio, Tool Approval, Skills/Subagents, Files/RAG, voz. Router perfiles `RAPIDO`, `NORMAL`, `PENSAR`, `INVESTIGAR`, `VISUALIZAR`, `CONTEXTO_LARGO`, `VISION` con rechazo de rutas de pago no autorizadas. Conserva el inventario 14 Skills físicas, stage 1 12 rutas, stage 2 10.

## C. Nombres de herramientas *tal como aparecieron* en el informe
El informe llama al MCP «nostromo-local» o «nostromo-autonomo» y propone `nostromo_estado`, `nostromo_catalogo`, `terminal_preparar`, `terminal_ejecutar`, `nostromo_directorio_listar`.
**No asumir que son nombres válidos.** La fuente del MCP usa `nostromo_herramientas`, `nostromo_terminal_preparar`, `nostromo_terminal_ejecutar` (además de estado/directorio), ver `deployment/nostromo-mcp/tools.mjs`. `nostromo_estado` informa del MCP, no por sí solo de todo el host.

## D. Parche sugerido por Gemini (NO ADOPTADO)
Ruta sugerida `packages/agents/src/tools/deferralFilter.ts` (no existe como parte del repo VX y `@librechat/agents` es una dependencia externa). El informe rotula `index 0000000..cdd0313`, que no establece una revisión commit.
Su función:
```ts
export function filterDeferredToolSchemas(tools: any[], maxDirect: number = 3): any[] {
  if (!Array.isArray(tools)) return [];
  const direct = tools.filter(t => !t.defer_loading);
  const deferred = tools.filter(t => t.defer_loading);
  const trimmedDirect = direct.slice(0, maxDirect);
  return [...trimmedDirect, ...deferred.map(t => ({
    name: t.name,
    description: `[Diferida] ${t.description || 'Herramienta bajo demanda'}. Use nostromo_catalogo para invocarla.`,
    parameters: { type: 'object', properties: {} }
  }))];
}
```
**Peligro:** recorta arbitrariamente herramientas directas, publicita schemas de parámetros vacíos y usa nombre inexistente. No se ha demostrado compatibilidad con tool_search/discovery/binding/context accounting. NO ejecutar ni instalar.

## E. Memoria, persistencia, GPU y router
- Memoria nativa LibreChat/Mongo; Gemini propone sliding-window summarization. La compactación conserva continuidad, pero NO resuelve por sí sola el exceso inicial de schemas/instrucciones. No crear SQLite nuevo: ya existe ledger async NOSTROMO, memoria/pruning/summary son nativos.
- Trabajos largos: recomienda estado `~/.local/state/nostromo/jobs` o SQLite WAL. Debe reconciliarse con `deployment/nostromo-mcp/async-jobs.mjs` antes de adoptar otra base de datos; no crear segundo sistema.
- Gemini propone Ollama `keep_alive: "5m"` para Qwen3 4B q4_K_M, reporta hardware CPU Intel y RAM/VRAM sin aportación física de `nvidia-smi`/`ollama ps`. Tratar como propuesta no medida; evaluar GPU física, prefill, swap, latencia y comportamiento keep-alive.
- Router Cloudflare AI Gateway o ChatGPT SIWC sólo si LIVE, permiso y cero coste demostrados. No confundir cuota ChatGPT con API billable.

## F. Módulos citados
Conversación/HUD, agente autónomo, MCP, Tentáculo Hub, VX13 y MANOJOS3 externos, iOS/voz. El informe etiqueta algunos como CONFIGURADOS/ACTIVOS sin readback: rebajar esas etiquetas a SOURCE o NO_VERIFICADO hasta host.

## G. Rutas propuestas
- `packages/agents/src/tools/deferralFilter.ts`: **rechazada**; ruta externa + rompe contrato.
- `config/nostromo-mcp.yaml`: **no presente**, ya existe `deployment/nostromo-mcp/librechat-mcp.fragment.yaml` y staging con backups; no duplicar.
- `src/extensions/extensionCreator.ts`: **ya existe**; no sobrescribir sin diff y prueba.
- Un supuesto hook `ExecStartPre` del servicio `vx-backend.service`: verificar existencia real; no afirmar instalado.
- Canario con `npm run nostromo:check`: es preflight R0; NO tres pruebas unitarias ni prueba del agente en Mongo.
- Consulta `mongosh librechat --eval 'db.messages.find({}).sort({_id:-1}).limit(1).pretty()'`: **NO USAR como evidencia publicable**, imprime contenido privado del chat. Sustituir por inspección de campos/estado y conteos saneados.
- Objetivo «<60s» sólo objetivo de latencia, no PASS inventado; tomar baseline y readback host real.

## H. Aceptación que sí interesa conservar
1. Backup y preflight no destructivos de repositorio real, servicio backend, Ollama/MCP, memoria y GPU.
2. Verificar si existe el parche de compatibilidad de v4.0.1, su preimagen, hashes y su efecto sobre schemas reales.
3. Canario «Hola» y canario `nostromo_estado` **desde el agente LibreChat**; observar respuesta final persistida, herramienta realmente invocada y reload.
4. Negativa R2 sin autorización, sin repeticiones de efectos materiales; medir TTFT/total, memoria/swap, frío/caliente, contexto efectivo.
5. Mantener source vs installed vs configured vs live vs verified y emitir receipts. Integración final con GH CLI/PAT fine-grained autorizados. Documentación complementaria: `docs/NOSTROMO_GEMINI_P0_SOURCE_AUDIT_20261118.md` y Work `docs/WORK_NOSTROMO_GEMINI_P0_EXECUTION_20261118.md`.

**Estado de esta recepción:** DOCUMENTED_SOURCE_INPUT, no patch adoptado ni host ejecutado.
