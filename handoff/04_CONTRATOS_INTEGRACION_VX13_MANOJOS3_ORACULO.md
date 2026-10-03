# CONTRATOS DE INTEGRACIÓN — LIBRECHAT / MANOJOS3 / VX13 / ORÁCULO

Regla: compartir conversación o vocabulario no comparte autoridad.

| Contrato | Propósito | Estado |
|---|---|---|
| TargetCapabilityProjection | proyectar capacidades del target sin convertirlas en acciones UI implícitas | SOURCE/DOCUMENTED |
| CrossTargetTruthEnvelope | verdad por target con provenance/freshness, sin fusionar receipts | SOURCE/DOCUMENTED |
| SkillMirrorManifest | mirror descriptivo de skills/Interflow; no registry paralelo | SOURCE/DOCUMENTED |
| LibreChatReadinessTruth | separar connection/readiness/work/evidence | SOURCE/DOCUMENTED |
| DashboardFocusEvent | foco/ventanas/riesgo/evidencia; no autoridad | SOURCE/DOCUMENTED |
| UiAction | intención UI tipada que debe volver al owner de autoridad | SOURCE/DOCUMENTED |
| EvidenceRef | referencia a evidencia, no copia autoritativa | SOURCE/DOCUMENTED |
| ReceiptRef | referencia al receipt emitido por target | SOURCE/DOCUMENTED |
| AuthorizationProjection | visualiza gate/decisión; no acuña autorización | SOURCE/DOCUMENTED |
| BackgroundMutationFence | impide que background/resume reejecute mutaciones | SOURCE/DOCUMENTED |
| RecoveryEnvelope | reconexión/snapshot/resync sin replay material | SOURCE/DOCUMENTED |
| TrustedSurfaceIntent | controles confiables con schema/provenance/allowlist | SOURCE/DOCUMENTED |

## TargetCapabilityProjection
Campos mínimos:
`target_id, target_scope, domain, intent_family, interflow, operation, capability_id?, availability, risk, freshness, provenance`.
Las capabilities raw son drill-down; la UX primaria usa domain/intent/interflow.

## CrossTargetTruthEnvelope
```text
conversation_id
observed_at
targets[
  target_id
  connection
  readiness
  work[]
  authorizations[]
  evidence[]
  receipts[]
  freshness
  source_ref
]
```
Prohibido colapsar MANOJOS3 y VX13 en un único estado material.

## SkillMirrorManifest
Es proyección read-only:
`target, skill_id, version/hash, description, domain, freshness`.
No define drivers, no crea capabilities y no ejecuta.

## LibreChatReadinessTruth
Carriles separados:
- CONNECTION: transporte accesible.
- READINESS: target declara listo.
- WORK: runs/tareas en curso.
- EVIDENCE: readback/receipts frescos.

HTTP 200 sólo satisface conexión, no finalización material.

## DashboardFocusEvent
```json
{
  "conversation_id": "...",
  "message_id": "...",
  "focus": "switch|files|audio|build|browser|...",
  "active_windows": [],
  "target_scope": "AUTO|BOTH|MANOJOS3|VX13",
  "concrete_target": null,
  "risk": "GREEN|YELLOW|RED",
  "recommended_action": "explain|prepare|submit",
  "evidence_fresh": false
}
```
Focus no cambia primary target ni grants.

## UiAction
Debe contener como mínimo:
`action_id, conversation_id, intent, concrete_target, risk, preconditions, expected_effect, provenance`.
`AUTO/BOTH` con efecto material => reject.

## AuthorizationProjection
Sólo refleja:
`target, authorization_id, state, scope, expiry/freshness, source_ref`.
ToolApproval nativo puede recoger gesto del usuario, pero Policy/Madre decide según target.

## EvidenceRef / ReceiptRef
Nunca inventar datos:
`target, run/execution_id, kind, uri/id/hash, observed_at, freshness, verifier_state`.
ReceiptRef no es un receipt nuevo de LibreChat.

## BackgroundMutationFence
Invariantes:
- background task != run material;
- resumable SSE != replay;
- offline draft != outbox;
- ambiguous timeout => UNKNOWN_OUTCOME;
- retry sólo después de readback/reconcile.

## RecoveryEnvelope
`conversation/session identity + target + last cursor/snapshot + freshness + nonReplayFence`.
Tras reconnect, nueva mutación exige ACL, target, preimage/revision y autorización frescos.

# MANOJOS3

Current source observado: `a7b2647...`.
Adapter LibreChat current:
- thread.read R0;
- message.send R2;
- fail-closed UNCONFIGURED hasta binding real.

MCP contract:
`status/self/capabilities/skills -> optional attach -> objective submit -> run/auth -> readback -> receipt`.
MCP `authority=false`.
`manojos3.ingress.v1` recibe objetivo natural.

Estado LibreChat↔M3:
- semántica: ALINEADO_SOURCE;
- adapter: INSTALLED_FAIL_CLOSED;
- MCP binding desde LibreChat: PREPARED_UNCONFIGURED;
- R0 E2E desde LibreChat: NO_VERIFICADO;
- material: NO_VERIFICADO.

# VX13

CURRENT Drive A-50:
- LibreChat external first-class Conversation/UI Plane;
- Tentáculo Link frontdoor;
- Madre policy/verificación;
- Spawner/hija ejecución;
- AUTO/BOTH proyección only;
- same Nostromo shell, distinct authority.

Estado:
- diseño/paridad: ALINEADO;
- repo/runtime VX13 modificado por este trabajo: NO;
- binding LibreChat↔VX13: UNCONFIGURED;
- E2E: NO_VERIFICADO.

# ORÁCULO

Contrato: advisory/provider, `authority=false`.
Puede diagnosticar/razonar; no autoriza, no ejecuta por sí mismo y no prueba un efecto.
Preferir mediación por target gobernado cuando el consejo vaya a desembocar en acción.

Estado:
- rol: ALINEADO_SOURCE/DOCUMENTED;
- binding LibreChat directo: NO_VERIFICADO;
- material authority: FORBIDDEN.

# Estados permitidos
`DOCUMENTED | SOURCE | INSTALLED | CONFIGURED | LIVE | VERIFIED | NO_VERIFICADO | BLOCKED_DEPENDENCY | GATE_EXTERNAL`.
Nunca elevar estado por nombres de archivos, HTTP 200 o tests históricos.
