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

## Modos

- `SOURCE_ONLY`: GitHub/Drive/source evidence. No runtime claims.
- `LIVE_BOUND`: además existe binding/readback fresco admitido.

El estado actual es `SOURCE_ONLY`.

## Primera lectura de un GPT

1. `operating/TARGET_CANON.json`
2. `operating/BOOTSTRAP_CURRENT.json`
3. `operating/HANDOFF_CURRENT.md`
4. `operating/GAPS_CURRENT.json`
5. sólo después los docs específicos señalados por el gap elegido.

No leer 50 conversaciones antes de empezar.
