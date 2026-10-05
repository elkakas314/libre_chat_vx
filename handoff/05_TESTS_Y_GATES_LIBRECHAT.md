# TESTS Y GATES LIBRECHAT CURRENT

Cada gate produce evidence/receipt local o del target. Un FAIL bloquea sólo su dependencia.

| Gate | Prueba | Readback esperado |
|---|---|---|
| G0 IDENTITY | HEAD/branch/status exactos | SHAs registrados, no drift oculto |
| G1 SOURCE_TESTS | `npm install && npm test` | test exit 0 sobre HEAD exacto |
| G2 UPSTREAM_PIN | `npm run verify:upstream` | PASS, commit f10b..., 4 blobs válidos |
| G3 OVERLAY_INSTALL | `overlay:install` | marker + FEATURE_FLAGGED_SHARED_PANEL + mutationEnabled=false |
| G4 UPSTREAM_BUILD | build/tests upstream aplicables | exit 0; sin anchors rotos |
| G5 SECRET_SCAN | repo/config/logs | 0 valores secretos persistidos |
| G6 LIBRECHAT_HEALTH | proceso/UI real | connection + readiness diferenciados |
| G7 LOCAL_VOICE | canary local | respuesta + latencia/RAM + truth fidelity |
| G8 M3_NETWORK | route container->MCP/LLM | endpoint exacto alcanzable; ACL válida |
| G9 M3_BOOTSTRAP_R0 | status/capabilities/skills | structured readback; authority=false |
| G10 M3_R0_OBJECTIVE | objetivo read-only real | final run + readback + verified receipt |
| G11 M3_LLM_ALIASES | canary aliases | alias servido exacto; no paid fallback |
| G12 CONVERSATION | chat simple/deep | misma identidad Nostromo; provenance visible |
| G13 HUD_TRUTH | estado target cambia | HUD refleja structured readback, no LLM guess |
| G14 INTERFLOW | objetivo soportado | domain/intent/interflow correcto; raw caps drill-down |
| G15 NATIVE_SURFACES | sidepanel/artifact/MCP/files/tools | prioridad y gates correctos |
| G16 AUTH_NEGATIVE | intento R2 sin gate | bloqueado por target, no por UI inventada |
| G17 FIRST_R2 | mutación mínima reversible M3 | authorization path + readback + verifier + receipt |
| G18 UNKNOWN_OUTCOME | timeout post-effect simulado/real controlado | no blind retry; reconcile primero |
| G19 BACKGROUND_FENCE | background/resume/offline | 0 replay material |
| G20 MOBILE_RECOVERY | desktop↔móvil/reconnect | misma historia; target work no se confunde con UI |
| G21 ORACULO | advisory path | consejo sin authority/receipt falso |
| G22 VX13_R0 | binding futuro | mismo shell, target/provenance separados |
| G23 LOW_POWER | idle/active | RAM/CPU/wakeups medidos |
| G24 ROLLBACK | overlay uninstall | upstream restaurado; marker/package bridge retirados |
| G25 BACKUP_RESTORE | config/state conversacional | restore probado sin secretos |
| G26 UPGRADE | nuevo upstream candidate | anchors/blobs/rebase + full gates; no auto-promote |

## Negative tests obligatorios
- `target_scope=AUTO|BOTH` + mutation => reject.
- ToolApproval native tratado como target authorization => reject.
- subagent tratado como worker/hija => reject.
- BackgroundTask tratado como TargetRun receipt => reject.
- SSE resume que intenta reemitir UiAction material => reject.
- evidence stale presentada como fresca => reject.
- provider/LLM output que intenta elevar authority => reject.
- HTTP 200 sin readback/receipt marcado PASS material => reject.
- M3 MCP transport assertion de authority => ignore.
- VX13/M3 receipts fusionados => reject.

## Gates de promoción
### P0 SOURCE_READY
G0-G5 PASS.

### P1 LIVE_READ_READY
G6-G10 PASS.

### P2 REASONING_READY
G11-G14 PASS.

### P3 UI_READY
G15 + G19 + G20 PASS.

### P4 MATERIAL_M3_READY
G16-G18 PASS.

### P5 OPERABLE
G21 + G23-G25 PASS.

### P6 VX13_PARITY
G22 PASS por separado.

## Regla final
No hay `LIBRECHAT_FULLY_FUNCTIONAL=PASS` hasta que P0-P5 hayan corrido en el mismo corte material o exista una cadena de proofs válida por dependency fingerprint. VX13 parity es una promoción adicional, no requisito para usar M3 first.

## Gates reconciliados Tentáculo HUD / Provider Mesh

| Gate | Prueba | Readback esperado |
|---|---|---|
| G27 HUD_STATE_LANES | variar conexión/readiness/work/evidence independientemente | ningún estado implica otro |
| G28 EVENT_RECOVERY | duplicate/out-of-order/gap/reconnect/snapshot | dedupe + STALE/GAP + resync sin replay material |
| G29 PROVIDER_FAILOVER | matar ruta local/remota/LiteLLM antes de efecto | fallback cognitivo sólo a ruta permitida paid=false |
| G30 TOOL_SEARCH_LAZY | inventario grande | descriptors primero; schemas sólo top candidatos |
| G31 CONTEXT_PROTECTION | compactación bajo presión | run/auth/evidence/receipt/UNKNOWN_OUTCOME sobreviven |
| G32 DUAL_APPROVAL | Tool Approval permitido + target auth no concedida | target sigue WAIT_AUTH/según grant_interface real |
| G33 HUD_TRUTH_CACHE | perder cache/read model | rebuild desde owners; 0 pérdida de verdad material |
| G34 M3_REAL_CONTRACT | MCP tool list + calls | usa tools publicadas; 0 API/tool paralelos inventados |

Promoción ajustada:
- P2 REASONING_READY añade G29.
- P3 UI_READY añade G27-G33.
- P4 MATERIAL_M3_READY exige además G34 y que la UX respete el `grant_interface` LIVE.

Negative tests adicionales:
- Redis/cache/read-model loss tratado como pérdida de material truth => reject.
- provider failover reenvía objective material => reject.
- UI fuerza aprobación humana cuando M3 live declara OPERATOR_MODE_AUTONOMOUS => reject.
- UI omite gate cuando M3 live declara LOCAL_CLI_AUTHORIZE_STEP_ONLY => reject.
- puerto/endpoint documental tratado como LIVE sin network readback => reject.

