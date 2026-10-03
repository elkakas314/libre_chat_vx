# RECOVERY_PROTOCOL

## Trigger

Usar cuando:

- el turno anterior se cortó;
- no hubo respuesta final;
- hubo timeout;
- Git/Drive avanzaron sin que el Handoff se actualizara;
- aparece un commit o artefacto no explicado.

## Evidencia, en orden

En `SOURCE_ONLY`:

1. GitHub remote main.
2. commits y blobs relevantes.
3. Drive revisions/readback.
4. CURRENT/HANDOFF.
5. conversación sólo para provenance.

En `LIVE_BOUND`, insertar por delante:

1. runtime target observation;
2. runs/effects/receipts/claims/leases si existen;
3. verifier/readback;
4. después source/Drive.

## Algoritmo

Para cada acción presumida de la ejecución interrumpida:

1. localizar su scope;
2. localizar commit/blob/doc revision/run/receipt;
3. clasificar:
   - CONFIRMED_APPLIED
   - CONFIRMED_NOT_APPLIED
   - PARTIAL
   - RUNNING
   - UNKNOWN
4. para UNKNOWN: investigar; no retry;
5. reparar PARTIAL sólo si no existe ownership concurrente;
6. continuar desde el último efecto confirmado.

## Git divergence

`HEAD != expected` o remote avanzando no aborta bootstrap.

Produce `RECONCILE_REQUIRED` y calcula el delta.

## Drive divergence

Una revision nueva de un Doc no se sobrescribe.

Releer, identificar delta, preservar contenido no relacionado y reconciliar.

## Resultado de recuperación

Registrar:

- snapshot/evidence cutoff;
- punto confirmado;
- efectos recuperados;
- artefactos reutilizados;
- repairs;
- gaps restantes;
- gates;
- siguiente acción elegible.
