# LibreChat VX / NOSTROMO — CHECKPOINT DE RELEVO 2026-10-08

**Propósito:** sustituir el hilo operador preservando estado, decisiones, pruebas y pendientes, SIN validar aún los últimos commits (solicitud explícita del usuario).
**Repositorio:** `elkakas314/libre_chat_vx` · **Rama:** `handoff_current_bootstrps`.
**HEAD leído antes de guardar:** `a873292556c7cde561237bfc41f713ce3d2e0756`. El commit de este checkpoint y otros posteriores cambian el HEAD: el sucesor DEBE leerlo de nuevo.
**Último CI exacto visto en estado SUCCESS antes del relevo:** `source-check` run `37709003357` sobre `60a6bbb974dae26e154d883121f22dd6bca560ce`. **No extrapolar ese PASS a commits posteriores.**
**Estado:** SOURCE preparado / LIVE_NO_VERIFICADO o NOT_DEPLOYED / MATERIAL_VERIFIED=false. No se hicieron pruebas finales de los últimos cambios por petición del usuario.

## 1. Primero leer — jerarquía de fuentes

1. Este checkpoint íntegro.
2. `CURRENT.json` y `HANDOFF_CURRENT.md` del root (snapshot y plan).
3. `operating/TARGET_CANON.json` v8; `operating/GAPS_CURRENT.json` v2; `operating/BOOTSTRAP_CURRENT.json`; `operating/CURRENT_SOURCE_SNAPSHOT.json`; `operating/PROOFS_CURRENT.json`; `operating/HANDOFF_CURRENT.md`; `operating/START_HERE_GPT.md`; `operating/DRIVE_REFS_CURRENT.json`.
4. `docs/BACKLOG_CRIBA_CURRENT.md`, `docs/SKILL_REDUNDANCY_AUDIT_CURRENT.md`, `docs/TRANSPORT_CANON_CURRENT.md`, `docs/LIBRECHAT_INSTALLATION_OPTIONS_CURRENT.md`, `docs/SKILLS_PLUGINS_RUNTIME_LAYOUT_CURRENT.md`, `docs/MOBILE_REMOTE_ACCESS_CURRENT.md`.
5. Cinco documentos vivos de Google Drive (IDs abajo), matriz de capacidades y tests.
6. Revisar la evidencia GitHub del HEAD actual antes de declarar cualquier cierre.

**Los docs son vivos.** 00 = entrada/continuidad, 10 = diseño/contratos, 20 = uso/procedimientos, 30 = backlog/cierres/handoff, 40 = mapa/cableado/cobertura. Matriz = detalle de 119 capacidades y 112 IDEA-LC trazadas. Evitar cinco copias de un mismo canon; una responsabilidad, una fuente.

## 2. Contexto funcional

NOSTROMO es la identidad conversacional estable de LibreChat VX. Hace: comprender lenguaje natural/referentes, consultar contexto y archivos, investigación web, explicar, visualizar árboles, timelines, flows, Artifacts, evidencia, y formular intents precisos para sistemas externos. **No es un programador especializado, Kernel, Policy, executor ni autoridad material.**

```text
USUARIO
  → LibreChat/NOSTROMO (conversación + Files/RAG + memoria/contexto)
      ├→ Intent Interpreter / CurrentFocus / Referential Continuity
      ├→ Research Policy / Presentation Planner / Tentáculo Companion
      ├→ StatusRail / DecisionInbox / Resource Tree / ArtifactDock
      ├→ NostromoInferenceGateway → Cloudflare AI Gateway → LLM admitido
      └→ NostromoTargetGateway in-process (authority=false)
           ├→ MANOJOS3 adapter → MCP gobernado (futuro binding R0)
           ├→ VX13 adapter → Tentáculo Link/frontdoor (futuro)
           └→ ORÁCULO advisory sin autoridad material
```

Comportamiento usuario heredado/adaptado de MANOJOS3: entrada = **objetivo natural**; no pedir technical slots/capability_id/target_scope si se puede inferir; sólo aclarar ambigüedad semántica real o pedir aprobación humana por riesgo; no volcar contratos técnicos por defecto. Una pregunta READ no hace submit. Semántica, LLM, UI, Skills y plugins NUNCA emiten grants, autorizaciones, verificadores ni receipts materiales.

Restricciones: NO modificar repo/runtime/túneles MANOJOS3 o VX13; no construir segundo Kernel/Governor/Policy/ToolBus/executor/MCP/ledger, ni utilizar Remote Desktop. Coste externo mínimo/zero-cost verificado; bajo consumo CPU/RAM en Lenovo. No poner secretos en Git/Drive/frontend.

## 3. Transporte canónico de LibreChat — paralelo a MANOJOS3

**SOURCE diseñado, NO desplegado LIVE.**
- Local: `127.0.0.1:3080`.
- Acceso privado móvil/PC: 1 Tailscale Serve → LibreChat :3080, con identidad/ACL de tailnet.
- Público opcional: Cloudflare Access → 1 Tunnel dedicado `librechat-vx-web` → :3080; separar políticas de browser y machine Agent Events si se publica.
- Inferencia: 1 Cloudflare AI Gateway `librechat-vx-nostromo` → 7 Dynamic Routes; **AI Gateway no es Tunnel**.
- Cloudflare Workers requeridos **0**, a lo sumo 1 opcional `librechat-vx-event-normalizer` sólo si un emisor no puede hablar Agent Events (sin token administrativo, sin autorizar ni ejecutar).
- Cloudflare Tunnels obligatorios 0; público opcional 1. Tailscale Serve baseline 1; Tailscale Services baseline 0 (opcional por HA/multi-host), Funnel 0, Secure MCP Tunnel para LibreChat 0.
- Skills: GitHub Skill Sync por HTTPS outbound directamente al repo; sin túnel ni Worker.
- Entrada de avisos: `POST /api/agents/v1/events` con credencial propia del emisor → Tentáculo triage → usuario.
- Ruta target: TargetGateway → adapter; no public target proxy. No reutilizar Workers/hostnames/puertos/túneles MANOJOS3.
- Recovery fuera de banda: host service/systemd + Tailscale SSH privado, LIVE pendiente.

Rutas de inferencia: `dynamic/nostromo-{rapido,normal,pensar,investigar,visualizar,contexto-largo,vision}`. **No perfil CODIGO.**
Primeros proveedores a verificar LIVE: Cloudflare Workers AI, Groq, Google AI Studio/Gemini; reservas Mistral y OpenRouter Free. Exactos modelos/cuotas/coste quedan pendientes de readback por cuenta. Registry permite pool amplio y reserva; hasta 6 activos por perfil como meta, nunca rellenar con candidatos no verificados ni fallback de pago. Alta router: admisión coste/capabilities/privacy/quota → version → canary → deploy → readback → rollback. Router Steward automatizado sólo opcional posterior y no Worker público.

Configs: `config/parallel_transport.current.json` v2, `transport_registry.current.json`, `llm_bootstrap.current.json`, `cloudflare_ai_gateway.current.json`, `model_registry.current.json`, `provider_candidates.current.json`, `mobile_access.current.json`, `extension_registry.current.json`. Contratos JSON `contracts/{transport-resource,mobile-access,extension-package}.schema.json`. Scripts `scripts/validate-parallel-transport.mjs` y de overlay.

## 4. Móvil fuera de LAN

Una sola instancia/backend/historial; cambio de red no cambia identidad ni target. Ruta local → Tailscale Serve privado → Access+Tunnel público opcional. Mobile SOURCE ya incluye `src/mobile/{mobileContinuity,mobileRecovery,offlineDraft,pushRefresh,remoteAccess}.ts`, fences de mutación y pruebas. Offline = cached READ / draft local; NO cola de aprobaciones/efectos. Reconnect = renovar sesión, ACL, readiness/freshness y reanudar sólo stream cognitivo; **no replay material**. Posible efecto tras timeout = UNKNOWN_OUTCOME → readback. Push/evento es hint opaco, al abrir fetch fresco. Canary LIVE móvil (Wi-Fi↔datos, PC↔iPhone, stream, deny/revoke, offline, recovery) sigue pendiente.

## 5. Skills/plugins y criba

**10 Skills activas en `config/skills.current.json`**:
`nostromo-core`, `nostromo-visualization`, `nostromo-research`, `nostromo-event-triage`, `nostromo-evidence-first`, `nostromo-resource-navigation`, `manojos3-nostromo`, `vx13-nostromo`, `cross-target-read`, `nostromo-extension-review`.
`nostromo-intent-translation` y `nostromo-tool-budget` se absorbieron en `nostromo-core`, pero sus **dos directorios alias heredados siguen presentes físicamente** hasta probar LIVE Skill Sync; por tanto puede haber 12 directorios `skills/<nombre>/SKILL.md`.

`nostromo-extension-review` es una Skill de revisión anti-monstruo: Native LibreChat → config → Skill existente → MCP/Action → Agent Plugin → adapter fino → custom source. No ejecuta. Lo importante (ACL, autorización, no replay, idempotencia, receipts, transporte) queda como contrato/código, NO sólo Skill.

Source plugin `plugins/vx-nostromo/` experimental. Runtime: `DEPLOYMENT_SKILLS_DIR=./skill`, `DEPLOYMENT_PLUGINS_DIR=./plugin`, `DEPLOYMENT_PLUGIN_DATA_DIR=./data/plugins`; hooks deshabilitados. GitHub Sync preferido.

## 6. Nueva idea del usuario — prioridad HIGH, NO desarrollada

`LC-NOSTROMO-SEMANTIC-BRIDGE` está en `docs/BACKLOG_CRIBA_CURRENT.md`, `operating/GAPS_CURRENT.json:design_review_queue` y Drive 30. Objetivo: semántica propia de capacidades/funciones de NOSTROMO con posible compatibilidad con MANOJOS3 Intent Flows/Interflows/drivers/capabilities.

**No afirmar que LibreChat carece de semántica**: ya hay `src/intent/intentInterpreter.ts`, `tests/intent-presentation-events.test.ts`, `tests/semantic-contract.test.ts` y proyecciones de MANOJOS3. Próximo estudio compara:
1. Native LibreChat/Skills + Intent Interpreter + vocabulario mínimo (primera opción).
2. Crosswalk tipado authority=false en TargetGateway/adapters hacia semántica target-owned (hipótesis preferida).
3. Registry declarativo read-only sólo si se demuestra gap.
4. Motor semántico duplicado: RECHAZAR por defecto.

Demostrar con tests: lenguaje coloquial, «eso», contextos, capabilities propias, target ambiguous, READ ≠ submit, semantic match ≠ autorización. Sólo proponer desarrollo SOURCE tras probar cobertura faltante; no tocar MANOJOS3.

## 7. Operating Canon y backlog

`operating/TARGET_CANON.json` versión 8 (no perfil CODIGO). `operating/GAPS_CURRENT.json` esquema v2 y campos `gapId/summary/state/priority/scope/requiresLive/dependencies`; `PROOFS_CURRENT.json` usa `proofId/proofClass/dependencyFingerprint/evidenceRefs`. Se añadió `tests/operating-current-data.test.ts` para proteger el contrato `buildBootstrap()`. Read models `BOOTSTRAP/CURRENT_SOURCE_SNAPSHOT/PROOFS/HANDOFF/START_HERE/DRIVE_REFS` reconciliados en SOURCE, pero SU CONJUNTO debe validarse contra HEAD actual y builder real.

Clases:
- `gaps[]` = ACTIVE_LIVE: Cloudflare AI Gateway+LLMs+rollback → Skill Sync → Tailscale Serve móvil → Web Research → Agent Events → recovery → benchmark Lenovo.
- `target_later` = MANOJOS3 R0, ORÁCULO advisory, VX13 frontdoor, primer material canary.
- `deferred_external` = documentación/transporte/LiteLLM internos MANOJOS3 y migración futura MANOJOS3 (NO TOCAR).
- `optional_reentry` = SearXNG, Firecrawl, Router Steward, LocalAI, llama.cpp, Whisper, Tailscale Services, CF Public Access, notifier secundario, etc.
- `closed_source_archive` = históricos/infra SOURCE ya cerrados; no son trabajo activo.
- `design_review_queue` = nueva semántica LC-NOSTROMO-SEMANTIC-BRIDGE.

Cuidado: pruebas viejas siguen como historia y no equivalen a HEAD actual. Matriz conocida: 119 capacidades, 112 IDEA-LC trazadas, 0 FALTA_DESARROLLAR (anterior al nuevo review).

## 8. Instalación y árbol

Upstream fijado: `LibreChat-AI/LibreChat@f10b1d91f1eee3a2c82d5247bf620351486b7c1b`, overlay reversible.
LibreChat native a reutilizar: Agents, Skills, Agent Plugins, MCP/MCP UI, Actions/OpenAPI, Files/RAG, Artifacts, Web Search, Speech, resumable streams, ACL/Admin, SidePanel, Model Specs, Remote Agents/Events. Docker Compose opción reproducible principal; npm opción de menor carga a medir en Lenovo; Helm no baseline. Redis sólo justificable multi-replica.

Árbol: `config/` políticas/config; `contracts/` schemas; `skills/` catálogo; `plugins/vx-nostromo/`; `src/{intent,presentation,research,events,tentacle,llm,targets,adapters,resources,cockpit,ui,mobile,recovery,security,session,notifications}/`; `overlay/`; `scripts/`; `tests/`; `operating/`; `docs/`; `handoff/`.
Scripts: `verify-upstream.mjs`, `install-as-workspace.mjs`, `uninstall-overlay.mjs`, `validate-parallel-transport.mjs`. CI `source-check` contiene build-test y overlay-smoke. No reconstruir partes nativas ya instaladas.

## 9. Docs vivos de Google Drive (NO mezclar con carpeta MANOJOS3)

- 00 Entrada/CURRENT/Bootstrap: `11e70lpwe5U3k9FMZWd7h-N0eNaidgaINJP9Pwz1bGx8`.
- 10 Diseño: `1fndkYM-UBmSfacQcbu_oewcDe4JzEClw-qd7K7J9pGg`.
- 20 Uso: `1py0BlozuMOjmo4lUEqxuqCmLaN2O3_6wYwXrTwfVcuY`.
- 30 Cierre/Pendientes/Handoff: `19_Bm72_3aaxT6gggEAmfkZG0y0N1hXK6tMQrYLR4sDI`.
- 40 Mapa/Cableado: `1UD9LnU0eaKdEHrLUkMJyPp-II_6rZPtlD7uzn_sqWCc`.
- Matriz: `1Xg712HfFHts11pZrl2JHjIt4v-b452Ye`.

Propiedad: 00 acceso/snapshot, 10 decisiones, 20 procedimientos, 30 gates/backlog/pruebas/handoff, 40 relaciones, matriz cobertura. No repetir canon íntegro en todos. `operating/DRIVE_REFS_CURRENT.json` enlaza IDs. Documentos antiguos y Maestro VX13/buzón son procedencia, nunca permiso para mutar VX13.

## 10. Próximo hilo: orden obligatorio

A) Lee este checkpoint íntegro, verifica HEAD y sus diff/commits posteriores al último CI confirmado; revisa `source-check` exact-head, jobs build-test/overlay-smoke y logs. El usuario ha pedido DEJAR VALIDACIÓN AL SUCESOR, por eso no figura un nuevo PASS aquí.

B) Corrige sólo regresiones probadas. Comprueba `tests/operating-current-data.test.ts`, `buildBootstrap()`, `GAPS` y `PROOFS` tipados, `CURRENT_SOURCE_SNAPSHOT`, `BOOTSTRAP`, skills config vs carpetas y `DRIVE_REFS_CURRENT`. El estado manual JSON no es necesariamente lectura LIVE.

C) Lee y reconcilia las cinco plantillas de Drive con repo/CI; anota drift, cierra SOURCE/documentación sólo tras prueba. Mantén LIVE NO_VERIFICADO y material_verified=false.

D) Estudia sin implementar de inmediato `LC-NOSTROMO-SEMANTIC-BRIDGE` y elige opción de menor duplicación. No mezclarlo con agenda ACTIVE_LIVE hasta decisión.

E) Sigue por gates ACTIVE_LIVE por orden; primero Cloudflare AI Gateway/account/provider readback, después Skill Sync, Tailscale móvil, Web Research, Agent Events, recovery; sólo después MANOJOS3 R0 y canary gobernado. No crear Workers/túneles innecesarios ni pagar fallback.

Controles: sin Remote Desktop, sin secretos, sin MANOJOS3/VX13 mutaciones, sin doble autoridad, sin prometer ejecución diferida, sin declarar PASS ni LIVE por memoria o por documentación. Guardar cada cambio con evidencia y checkpoint para próximos hilos.
