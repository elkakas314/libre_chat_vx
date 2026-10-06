# BUILD PACK — HANDOFF CURRENT BOOTSTRPS

Objetivo: dejar LibreChat VX listo para ser construido y validado por MANOJOS3 sin duplicar arquitectura ni saltar gates.

## Base
- branch de pack: `handoff_current_bootstrps`
- base source candidate: `657e00dcf1c2111f722ca3a8a333fb9efda5abb5`
- upstream pin: `f10b1d91f1eee3a2c82d5247bf620351486b7c1b`
- current runtime truth: `NO_VERIFICADO`

## Fase A — identidad y source
```bash
git status --short
git rev-parse HEAD
git rev-parse origin/main
node --version
npm --version
npm install
npm test
```
PASS sólo si `npm test` pasa sobre el HEAD exacto que se pretende promover.

## Fase B — upstream pin
Preparar LibreChat upstream como sibling `../upstream`, limpio y exactamente en el pin. No hacer reset destructivo sobre trabajo ajeno.

```bash
git -C ../upstream rev-parse HEAD
git -C ../upstream status --short
npm run verify:upstream
```

`verify-upstream.mjs` exige commit exacto y cuatro blobs conocidos. Un mismatch es gate, no permiso para parchear a ciegas.

## Fase C — overlay reversible
```bash
npm run overlay:install
cat ../upstream/.librechat-vx-overlay.json
```
Readback esperado:
- `status=OVERLAY_INSTALLED`
- `upstreamCommit=f10b...`
- `uiPatch=FEATURE_FLAGGED_SHARED_PANEL`
- `mutationEnabled=false`

Después ejecutar los tests/build oficiales del upstream necesarios para probar que el patch compila y arranca. No declararlos PASS hasta ejecución real.

Rollback:
```bash
npm run overlay:uninstall
git -C ../upstream status --short
```
Readback esperado: `OVERLAY_REMOVED`; verificar working tree.

## Fase D — networking/config
No copiar `127.0.0.1` a ciegas desde host a container.

Contratos:
- `MANOJOS3_MCP_URL`: endpoint real alcanzable por LibreChat para MCP.
- `MANOJOS3_LLM_BASE_URL`: endpoint OpenAI-compatible de LiteLLM M3.
- secrets: referencias/secret store, nunca repo.

Primero probar red y ACL; después modelo/herramientas.

## Fase E — bootstrap MANOJOS3 R0
Orden:
1. migration profile/status/self;
2. capabilities;
3. skills;
4. optional attach;
5. no submit sólo para “adquirir contexto”.

Luego un objetivo R0 mínimo gobernado; aceptar éxito sólo con run final + readback + verified receipt.

## Fase F — modelo/voz local OPCIONAL
No existe modelo local canónico ni requisito de instalar uno.
Si el deployment habilita ruta local, ejecutar benchmark:
- memoria residente idle/active;
- cold/warm latency;
- español/referencias cortas;
- fidelidad al truth envelope;
- unload/reload;
- CPU sostenida.
Comparar runtime sólo cuando se vaya a activar local. `OFF/UNINSTALLED` es un estado válido y no bloquea LibreChat si existe una ruta remota zero-cost admitida.

## Fase G — LiteLLM
Verificar aliases servidos realmente:
- manojos-general-free
- manojos-reasoning-free
- manojos-coding-free
- manojos-fast-free
- manojos-long-context-free

Confirmar la política real de no pago: `llm_router.no_paid_only=true`, fallbacks únicamente hacia aliases/deployments zero-cost admitidos y prueba negativa de que una ruta de pago no puede seleccionarse. No depender de un flag documental `paid_fallback=false`. Source config no prueba servicio LIVE.

## Fase H — conversación/HUD
Canary:
- chat local;
- deep reasoning delegado;
- TargetRun/HUD read-only;
- Interflow/Capability lenses;
- ArtifactDock;
- DecisionInbox;
- Files/Browser/Audio/Build panels;
- native ToolApproval/MCP UI;
- mobile/reconnect;
- no offline replay.

## Fase I — primer R2
Sólo después de A-H.
Target concreto MANOJOS3.
Una mutación mínima y reversible.
Cadena: submit -> Governor/Policy -> Kernel -> driver -> readback -> Verifier -> Receipt.
Timeout ambiguo: STOP_BLIND_RETRY, readback/reconcile.

## Fase J — VX13
No tocar repo VX13.
Primero binding R0 con misma shell, slots paritarios y `DISTINCT_TARGET_AUTHORITY`.
R2 VX13 sólo por Link/Madre/Spawner y gates propios.

## Fase K — ORÁCULO
Advisory only. Puede aportar diagnóstico/reasoning, nunca autoridad ni receipt material.

## Criterios de aceptación
Ver `05_TESTS_Y_GATES_LIBRECHAT.md`. El orden de promoción es:
`SOURCE_TESTS -> UPSTREAM_OVERLAY -> M3_R0 -> MODEL_LIVE -> UX_E2E -> FIRST_R2 -> VX13_BINDING`.

## No construir
- otro Kernel/Governor/Policy;
- segundo executor;
- segundo MCP para M3;
- segundo frontend;
- router paralelo a Intent/Interflow;
- ledger propio de verdad material;
- paid LLM fallback;
- offline mutation replay.

## Fase 0 — contratos reconciliados antes de UI

Antes de añadir UI nueva:
1. congelar/versionar contratos de projection, evidence, receipt, recovery, provider health y target capability;
2. añadir invariantes tests: AUTO/BOTH no mutan, model/focus no cambia authority, Tool Approval no crea target grant, trace no crea receipt, UNKNOWN_OUTCOME no reintenta;
3. auditar que cada feature “nativa” reclamada existe realmente en el upstream pin elegido.

## Networking MANOJOS3 source-backed

No usar los puertos hipotéticos de la revisión externa.

Source MANOJOS3 actual observado:
- plugin/MCP default: `127.0.0.1:8790/mcp`;
- control plane default usado por gateway: `127.0.0.1:8787`;
- LiteLLM managed: `127.0.0.1:4000/v1`.

En deployment containerizado, `MANOJOS3_MCP_URL` y `MANOJOS3_LLM_BASE_URL` deben resolverse a nombres/addresses realmente alcanzables; 127.0.0.1 sólo vale dentro del mismo namespace.

No conectar LibreChat directamente a host-control ni al control plane interno como contrato de aplicación.

## Tentáculo HUD build order

Después de source/overlay:
1. TargetCapabilityProjection descriptor-first.
2. ProviderHealth/ProviderRoute.
3. event envelope + cursor/dedupe/gap/snapshot.
4. derived read models.
5. CORE_MINIMUM.
6. Decision Inbox.
7. Evidence/Receipt.
8. Context/Tools/Skills/Trace lazy panels.
9. RecoveryEnvelope desktop↔móvil.
10. UNKNOWN_OUTCOME/reconcile fence.
11. first material M3 canary.

No añadir Redis/HUD DB como nueva dependencia salvo que el baseline ya lo use o un benchmark demuestre necesidad.



## Fase G2 — Provider admission / Gemini opcional

Gemini se trata como deployment, no alias UX nuevo.

Antes de añadirlo:
1. discovery de modelos actuales;
2. validar soporte en la versión LiteLLM desplegada;
3. SecretRef/env para `GEMINI_API_KEY`, nunca valor en repo;
4. comprobar que la cuenta/ruta usada no puede generar gasto inesperado;
5. canary de text/vision/audio/structured output/context según perfil;
6. añadirlo detrás de un alias semántico existente;
7. probar failover cognitivo sin tocar TargetRun;
8. mostrar provider/model sólo en detalle avanzado del HUD.

La identidad Nostromo se configura en LibreChat/Model Specs, no mediante prompt global compartido en LiteLLM.


## Fase G3 — Cloudflare AI Gateway

Objetivo: desacoplar la conversación de LibreChat del LiteLLM interno de MANOJOS3.

Pasos:
1. crear/configurar gateway autenticado;
2. definir rutas semánticas versionadas;
3. usar BYOK/SecretRef, nunca secretos en repo;
4. habilitar sólo providers/models zero-cost verificados para perfiles por defecto;
5. no habilitar Unified Billing como requisito;
6. probar streaming LibreChat -> Cloudflare;
7. probar rate/budget fail-closed;
8. probar fallback sólo entre rutas zero-cost admitidas;
9. confirmar identidad Nostromo estable entre providers;
10. mantener LiteLLM M3 sin cambios hasta canary de desacoplamiento;
11. verificar no loops ni doble routing;
12. rollback = volver LibreChat a la ruta de inferencia anterior sin tocar la autoridad M3.


## Fase G4 — Transport binding MANOJOS3

1. leer LIVE `edge.cli.status`, Cloudflare tunnel metrics y Tailscale status/netcheck/serve/funnel;
2. confirmar estado del OpenAI Secure MCP Tunnel por su servicio/perfil;
3. elegir perfil A/B/C según ubicación real del backend LibreChat;
4. si A: probar initialize/tools/list/status directo a `:8790`;
5. si B: habilitar sólo private Serve/authenticated MCP; no Funnel público baseline;
6. si C: desplegar primero `manojos3-mcp-canary` con `MANOJOS3_VPC` y validar 401 sin auth + initialize/tools/list/status con auth;
7. sólo después promover un edge MCP LibreChat dedicado;
8. confirmar que legacy Action Proxy sigue funcionando sin convertirse en dependencia LibreChat;
9. confirmar host-control no es alcanzable por la ruta normal;
10. rollback restaura binding anterior sin tocar Governor/Policy/Kernel.
