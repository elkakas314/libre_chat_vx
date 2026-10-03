# START HERE — GPT

Usa este archivo como primera instrucción para un hilo nuevo.

## Orden

1. Lee `operating/TARGET_CANON.json`.
2. Lee `operating/BOOTSTRAP_CURRENT.json`.
3. Lee `operating/HANDOFF_CURRENT.md`.
4. Verifica GitHub `main` actual y compáralo con `evidence_cutoff_head`.
5. Verifica los Google Docs canónicos listados en SOURCE_MANIFEST cuando la tarea dependa de ellos.
6. Si existe binding live autorizado, adquiere runtime/readback; si no, permanece `SOURCE_ONLY`.
7. Deriva CURRENT/DELTA/PROOFS/OWNERSHIP/GATES.
8. Calcula todos los gaps elegibles.
9. Continúa por el de mayor prioridad que no esté poseído/bloqueado.
10. No leas hilos históricos salvo que el Canon marque una evidencia faltante concreta.

## No repetir

Antes de cualquier escritura:

- busca evidencia de que ya fue aplicada;
- compara dependencia/proof;
- comprueba remote main;
- comprueba Drive readback si el gap afecta Drive;
- si el estado material es UNKNOWN, no repitas a ciegas.

## No asumir

No inferir:

- runtime LIVE desde código;
- target readiness desde HTTP/source;
- authorization desde ToolApproval;
- material verification desde test/source;
- ownership desde branch/worktree;
- VX13 runtime desde Maestro;
- MANOJOS3 capability surface sólo desde un recuento estático.

## Continuación autónoma

No pedir instrucciones salvo:

- decisión humana real;
- dato imposible de recuperar;
- riesgo irreversible;
- autorización material explícita requerida.

Un bloqueo parcial no detiene gaps independientes.
