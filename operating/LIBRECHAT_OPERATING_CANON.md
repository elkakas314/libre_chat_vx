# LIBRECHAT_OPERATING_CANON

Versión: 8 — clasificación LIVE/EXTERNAL/CLOSED + Skills consolidation

## Misión

Convertir la continuidad de LibreChat VX en un contrato técnico reproducible para que un GPT nuevo pueda:

- adquirir contexto sin arqueología de hilos;
- reconstruir el estado tras una interrupción;
- distinguir trabajo aplicado, parcial, no aplicado y desconocido;
- no repetir efectos inciertos;
- continuar por gaps independientes elegibles;
- conservar la separación de autoridad VX13/MANOJOS3;
- mantener GitHub y Google Drive reconciliados;
- cerrar únicamente con evidencia proporcional al tipo de claim.

## Autoridades

Este Canon no ejecuta efectos materiales y no sustituye:

- LibreChat native authorization/access surfaces;
- VX13 Madre / Spawner-hija / verifier;
- MANOJOS3 Governor / Policy / Kernel / Verifier;
- repositorios o State externos.

LibreChat/Nostromo/Tentáculo HUD conserva `authority=false`.

## Verdad

Prioridad:

1. runtime/readback/receipt fresco cuando existe binding;
2. GitHub remote source y commit/blob readback;
3. Google Drive canonical docs y revision readback;
4. CURRENT derivado;
5. HANDOFF generado;
6. blueprint/documentación;
7. memoria de conversación;
8. inferencia.

En `SOURCE_ONLY`, los puntos 1 de runtime no están disponibles y deben quedar `NO_VERIFICADO`, nunca simulados.

## TARGET y CURRENT

`TARGET_CANON` es deseado, versionado y conscientemente modificado.

`CURRENT` se deriva de evidencia.

```text
TARGET --------.
               +--> compare --> DELTA
EVIDENCE->CURRENT
```

Regla dura: `CURRENT -> TARGET` automático está prohibido.

## Proofs

No existe una segunda proof database.

`PROOFS_CURRENT.json` es un índice derivado de Git commits/blobs, test receipts, Drive revisions y futuros runtime receipts.

Un proof sólo se vuelve stale si cambia una dependencia relevante.

```text
dependency fingerprint igual -> no reabrir
dependency fingerprint cambia -> STALE -> revalidar
STALE != avería
```

## Ownership

Un branch, worktree, conversación o archivo no implica ownership.

Ownership sólo puede derivarse de una claim/lease/run/scope verificable. Si no hay plano de coordinación visible, el estado es `UNOBSERVED`, no `FREE`.

## Gaps

Estados canónicos:

- PASS
- OPEN
- STALE_PROOF
- OWNED
- WAITING_INTERNAL
- RECONCILE_REQUIRED
- GATE_EXTERNAL
- GATE_HUMAN
- BLOCKED_DEPENDENCY
- NOT_TESTED

`nextEligible` salta gaps ocupados si existen otros independientes.

`WAITING_INTERNAL` sólo aplica cuando todos los gaps elegibles están ocupados/bloqueados internamente.

## Closeout

`closeout.check` es R0/puro:

- no ejecuta tests;
- no escribe;
- no repara;
- sólo enumera evidencia faltante y gaps no cerrados.

## Recuperación tras interrupción

La ausencia de respuesta final no significa ausencia de ejecución.

Secuencia:

`INSPECT -> RECONSTRUCT -> READBACK -> CLASSIFY -> CONTINUE`

Clasificación por acción:

- CONFIRMED_APPLIED
- CONFIRMED_NOT_APPLIED
- PARTIAL
- RUNNING
- UNKNOWN

Un `UNKNOWN` exige investigación antes de retry.

## Semántica LibreChat

- Nostromo = cockpit/shell.
- Tentáculo HUD = proxy visual; no Tentáculo Link.
- AUTO/BOTH = TargetScope de vista/lectura.
- VX13/MANOJOS3 = ConcreteTargetId.
- ORÁCULO = advisory provider.
- ToolApproval != target authorization.
- Artifact != TrustedSurfaceHost.
- subagent != VX13 hija != target run.
- readiness != ejecución != MATERIAL_VERIFIED.
- MATERIAL_VERIFIED requiere readback + verification + receipt.

## Prioridad de construcción

**LibreChat paralelo primero**: AI Gateway LIVE → GitHub Skill Sync → Tailscale Serve/móvil → Web Research → Agent Events → recovery. Sólo después integrar MANOJOS3 R0; VX13 queda gated hasta frontdoor canónico. La semántica de MANOJOS3 sigue siendo autoridad de su target, nunca se clona en LibreChat.

La proyección de MANOJOS3 debe usar:

1. Intent/Interflow semántico;
2. operación compuesta;
3. capabilities concretas;

y no usar el recuento de capabilities como techo funcional.

## Regla de mutación

Ninguna mutación desde `AUTO` o `BOTH`.

Toda solicitud material exige:

- ConcreteTargetId;
- capability/intent route;
- target-owned authorization cuando corresponda;
- expected/preimage state cuando aplique;
- idempotency/fence;
- readback;
- verification;
- receipt.

## Instrucción humana reducida

> Entra en LIBRECHAT_OPERATING_CANON, ejecuta bootstrap, adquiere contexto vivo disponible y continúa por el siguiente gap elegible sin repetir trabajo confirmado.

## Criba y semántica propia NOSTROMO (2026-10-08)

`operating/GAPS_CURRENT.json` separa ACTIVE_LIVE, TARGET_LATER, DEFERRED_EXTERNAL, OPTIONAL_REENTRY, CLOSED_SOURCE y cola de DESIGN_REVIEW. Sólo `gaps[]` debe alimentar la selección operativa. El ID `LC-NOSTROMO-SEMANTIC-BRIDGE` pertenece a `design_review_queue`, no es un gap material ejecutable.

Revisar alternativas: native/Skills + Intent Interpreter existente; crosswalk tipado en TargetGateway/adapters hacia los Intent Flows/Interflows/drivers del target; registry declarativo read-only sólo si hace falta. Rechazar un segundo motor semántico; una equivalencia nunca autoriza trabajo material.

`config/skills.current.json`: 10 Skills activas + 2 legacy aliases en disco hasta canary LIVE de Sync. Una Skill no sustituye contratos ni validaciones de runtime.

El estado actual es SOURCE_ONLY hasta readback LIVE. El bootstrapping no hace mutaciones ni interpreta ausencia de owner como FREE.

## Continuidad autónoma sin paradas artificiales — LC-CONTINUITY-NO-STOP

Origen contrastado: `elkakas314/manojos3@ff7e2792`, `docs/MANOJOS3_OPERATING_CANON.md`, `docs/templates/MANOJOS3_THREAD_ENTRY_TEMPLATE.md` y `plugins/manojos3/skills/manojos3-director-autonomous/SKILL.md`. Se adopta el contrato de CONTINUIDAD, no su Kernel ni su autoridad.

Invariante de operador: **no detener la misión por un bloqueo parcial ni concluir después de un solo hito si queda un gap seguro independiente**. Ciclo: `BOOTSTRAP → evidence/readback → CURRENT → TARGET/DELTA → ownership/claims → eligible gap → work through existing surfaces → test/readback → checkpoint → refresh bootstrap → next eligible`. Repetir el ciclo dentro de la sesión disponible, sin pedir permiso para cada paso seguro. Nunca usar un HTTP 200, una Skill, un commit o un CI como prueba LIVE/material.

- `OWNED`, `WAITING_INTERNAL`, `RUNNING/VERIFYING/RECONCILING`: inspeccionar el mismo identificador, no competir, no crear segundo run y continuar por otro scope independiente. `WAITING_INTERNAL` sólo cuando no existe otro trabajo interno listo.
- `GATE_EXTERNAL`, `GATE_HUMAN`, `CONFIG_GAP`, `SECURITY_BOUNDARY`, `UNAVAILABLE_TOOL`: bloquear únicamente el scope afectado y avanzar otros gaps elegibles sin inventar acceso o permiso. Clasificar también `INTERNAL_REPAIRABLE` para reparar primero.
- `UNKNOWN` o `PARTIAL`: readback del mismo target/run/receipt/effect y reconciliación antes de retry. Timeout no demuestra NOT_APPLIED. Mismo fingerprint y estrategia: `STOP_BLIND_RETRY` para ese efecto, no para el resto de la misión.
- `STALE_PROOF`: revalidar sólo dependencias afectadas; HEAD nuevo no invalida automáticamente todas las evidencias. `PASS` requiere prueba de la clase correspondiente.
- Tras cada hito material verificable y antes de relevo: registrar `SNAPSHOT_ID`, `EVIDENCE_CUTOFF_HEAD`, CI/recibos, `CURRENT_WORKING_BLOCK`, `ACTIVE_RUNS/CLAIMS/LEASES` si existen, `UNKNOWN_EFFECTS`, `DO_NOT_TOUCH`, `BLOCKERS_BY_SCOPE`, `NEXT_ELIGIBLE` y `NEXT_ACTION`. CURRENT/HANDOFF son proyecciones derivadas, no autoridad.

Cierre: sólo cuando los criterios del alcance tengan prueba suficiente y no exista otro gap interno seguro elegible. Si todos los restantes dependen de un gate externo/humano/no disponible, emitir checkpoint preciso y siguiente acción; **no simular un proceso de fondo**. Un hilo nuevo revalida HEAD/CI/LIVE y reanuda, no reconstruye meses de conversación. LibreChat/NOSTROMO siempre `authority=false` y jamás aplica operaciones materiales de MANOJOS3/VX13 por sí mismo.
