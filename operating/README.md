# LIBRECHAT_OPERATING_CANON

Entrada única de continuidad para un GPT nuevo.

## Objetivo

Evitar:

- reconstruir LibreChat desde conversaciones;
- repetir cambios ya aplicados;
- confundir source con runtime;
- tratar Handoff como autoridad;
- declarar PASS material por existencia de código;
- pisar trabajo concurrente;
- reabrir proofs válidos por cambios no relacionados.

## Flujo canónico

```text
TARGET_CANON ----------------------.
                                   |
EVIDENCE -> CURRENT ---------------+-> COMPARE -> DELTA
                                                   |
                         PROOFS + OWNERSHIP + GATES
                                                   |
                                                   v
                                            ELIGIBLE_GAPS
                                                   |
                                       existing route / adapter
                                                   |
                                    target-owned authority
                                                   |
                                     readback / verifier / receipt
                                                   |
                                            refresh CURRENT
```

`CURRENT` nunca modifica `TARGET_CANON` automáticamente.

## Read models

El canon no introduce otra base de datos ni otro ejecutor.

- `TARGET_CANON.json`: estado deseado, versionado y deliberado.
- `GAPS_CURRENT.json`: catálogo de gaps y dependencias.
- `PROOFS_CURRENT.json`: índice derivado de evidencia; no ledger soberano.
- `BOOTSTRAP_CURRENT.json`: read model compacto para continuidad.
- `HANDOFF_CURRENT.md`: explicación humana derivada; nunca autoridad.

`buildBootstrap()` deriva en una sola salida:

- Git/source observado;
- runtime disponible o `NO_VERIFICADO`;
- proofs válidos/stale/missing/unavailable;
- ownership observado;
- DELTA efectivo;
- LIVING_PLAN;
- siguiente gap elegible;
- closeout puro.

Un gap histórico `BLOCKED_DEPENDENCY` se reabre automáticamente cuando sus dependencias quedan `PASS`. No requiere editar el JSON a mano.

## Ownership

Un branch, worktree, archivo o conversación no implica ownership.

Sólo una claim/lease/run/scope observada puede producir `OWNED`.
Sin plano de coordinación visible: `UNOBSERVED`, nunca `FREE`.

`WAITING_INTERNAL` sólo aparece cuando todos los gaps dependency-ready y ejecutables en el modo actual están realmente poseídos. Si existe otro gap independiente, se continúa por él.

## Proofs

Un cambio global de HEAD no invalida todos los proofs.

Cada proof se revalida por `dependency_fingerprint` de sus dependencias relevantes:

```text
fingerprint igual    -> VALID
fingerprint distinto -> STALE_PROOF -> revalidar
STALE_PROOF          != avería
```

## Closeout

`closeout.check` es R0/puro:

- no ejecuta tests;
- no repara;
- no escribe;
- no convierte gates externos en PASS;
- enumera gaps y evidencia faltante.

`COMPLETE` sólo significa que todos los gaps del Target están `PASS`.
Los gates externos/humanos se informan aparte.

## Modos

- `SOURCE_ONLY`: GitHub/Drive/source evidence. No runtime claims.
- `LIVE_BOUND`: además existe binding/readback fresco admitido.

El estado actual continúa siendo `SOURCE_ONLY` hasta readback local.

## Primera lectura de un GPT

1. `operating/TARGET_CANON.json`
2. `operating/BOOTSTRAP_CURRENT.json`
3. `operating/HANDOFF_CURRENT.md`
4. `operating/GAPS_CURRENT.json`
5. sólo después los docs específicos señalados por el gap elegido.

No leer 50 conversaciones antes de empezar.
