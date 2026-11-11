# NOSTROMO — E2 handoff M1 / N-B1 (2026-11-11)

**Propietario:** E2, hilo ChatGPT del proyecto Libre chat. **Director:** aceptación externa.
**BASE_HEAD:** `director/nostromo-critical-path-20261111@c11af334ccfce8b7dd4b5be8dece44768b9999d2`.
**Repositorio:** `elkakas314/libre_chat_vx`. **Rama E2:** `e2/nostromo-m1-m2-safe-gates-20261111`.
**Issue compartido:** #37. **Alcance:** exclusivamente NOSTROMO / LibreChat VX; no cambiar MANOJOS3.

## M1 — diferencia y consumidores, SOURCE

Se añade `scripts/review-third-upstream-move-gate-r0.py`, que consume únicamente
el JSON validado de `extract-third-upstream-differences-r0.py`. Relee como máximo
tres rutas y ocho referencias VX, con límite de bytes, lstat, rechazo de symlinks,
sin volcar contenido ni secretos. Compara relaciones vigentes contra el snapshot,
pero **no puede demostrar identidad histórica con sólo tamaño/relación**.
No recorre los 5.516 archivos ni toca `.env`. Todas las decisiones de traslado
quedan `migrationAllowed=false` hasta revisión de consumidores, datos, backups
y rollback. La clasificación por nombre no acredita un consumidor activo.

```bash
cd /home/elkakas314/librechat/nostromo/worktrees/<E2_CHECKOUT_VERIFICADO>
npm run nostromo:third-upstream:gate:test
npm run nostromo:third-upstream:gate
```

El segundo comando enlaza extractor → gate de sólo lectura. Se requiere tener
actualizada la rama E2, informe privado original en la ubicación canónica y
permisos locales gobernados. Redirigir salida a `nostromo/reports` sólo si
está permitido y se necesita persistir un receipt. No publicar los informes privados
en GitHub.

## N-B1 — decisión mínima de backend, SOURCE

`scripts/nostromo-backend-decision-r0.mjs` consume por stdin la salida JSON
actual de `scripts/nostromo-backend-preflight.mjs`; no inicia ni instala nada.
Comprueba schema, flags, frescura ≤24 h, Node 24.16.0, npm 11.13.0,
arquitectura/AVX, checkout, presencia de `.env` (sin leer sus valores),
memoria disponible ≥1,5 GiB, disco ≥2 GiB, listener TCP y unidades
systemd de usuario. Estos umbrales son *guards de staging*, no requisitos
universales de LibreChat. Identidad, protocolo, autenticación y persistencia
de Mongo/backend permanecen sin verificar; ningún TCP concede autorización.

```bash
npm run nostromo:backend:decision:test
npm run nostromo:backend:decision
```

`installAllowed=false` en cualquier resultado de N-B1. No se prepara
Compose completo, Redis, RAG, vectordb ni otro servicio como supuesto.
Decisión de instalación posterior condicionada al readback N-B0 LIVE.

## Pruebas y readback

- M1: 6/6 PASS en fixtures temporales del entorno de trabajo, **no Lenovo**.
- N-B1: 5/5 PASS en fixtures temporales del entorno de trabajo, **no Lenovo**.
- Los cuatro blobs publicados de código/tests coinciden exactamente con los
  blobs Git de los archivos probados localmente. Los comandos npm nuevos
  figuran en `package.json` y en `nostromo:qa:diagnostics`.
- No se ha ejecutado todavía `npm run nostromo:qa:diagnostics` completo en
  un checkout del proyecto; no hay aceptación LIVE de NOSTROMO.
- Intento de host con MANOJOS5 (R0): objetivo enrutado erróneamente a
  `repo.intent.plan` sobre el root predeterminado de MANOJOS3;
  `construction.repo.inspect` devolvió `ADAPTER_EXCEPTION` y `FAIL`.
  Plan `plan-a3523b26-cdff-4ef6-8774-aa93b6e92b53`. No se reintenta
  con la misma entrada ni se atribuye lectura del host.
  Clasificación: `CONFIG_GAP / EXECUTION_ROUTING_MISMATCH`.

## OPEN GAPS

1. Falta extraer las **tres rutas reales y las ocho referencias** del informe
   privado ya existente en Lenovo. No sustituirlas con fixtures.
2. Falta leer N-B0 en Lenovo: AVX, Node/npm efectivos, RAM, disco,
   Mongo/protocolo/auth, procesos, datos y respaldos.
3. Falta evaluar consumidores externos/servicios del antiguo `~/upstream`,
   decidir migración con rollback y readback; el tercero permanece intacto.
4. Faltan backend+Mongo LIVE, agente+modelo, MCP stdio, integración UI,
   PWA móvil, reinicio/restore, pruebas E2E y limpieza final.

## NEXT_ACTION

Primero resolver canal de ejecución local gobernado con scope exclusivo
`/home/elkakas314/librechat`, ejecutar extractor+gate y N-B0→N-B1.
Si sigue indisponible, avanzar SOURCE por GitHub a instalador mínimo
idempotente/rollback, sin afirmar instalación. Coordinar con Director mediante
issue #37 y PR; nunca sobrescribir su rama ni el trabajo dirty de host.

**LOT_ID:** `E2-NOSTROMO-M1-NB1-20261111`
**ROLLBACK:** revertir los commits E2 de la rama o cerrar PR; ningún
archivo de Lenovo ha sido movido o eliminado por este lote.
**ESTADO:** `SOURCE_TESTED / GITHUB_READBACK_VERIFIED / HOST_UNVERIFIED`.


## Revisión Director #6802226607 — corrección M1 aceptable para nueva revisión

- `root_state(root, expected)`: exige igualdad exacta con `home/upstream`,
  `home/librechat/upstream` o `home/librechat/vx`; ejecuta
  `os.lstat` sobre todos los ancestros desde `/`, bloqueando enlaces
  simbólicos, ancestros no-directory y rutas fuera del scope.
- `review(...,home=...)`: `home` es inyectable sólo por tests; CLI mantiene
  los tres defaults de `Path.home()` y no acepta cambio de home.
- Prueba padre `librechat/` symlink a árbol externo: dos raíces
  `ROOT_SYMLINK_BLOCKED`, `ROOTS_BLOCKED`, `migrationAllowed=false`,
  mock `checked_bytes.assert_not_called()` y bytes de archivo externo sin cambios.
- Prueba de scope externo, traversal y ancestro fichero; `migrationAllowed=false`.
- **Pruebas nuevas reproducidas a partir de bytes cuyos blob SHA coinciden con GitHub:**
  M1 **8/8 PASS**, N-B1 **5/5 PASS**; total **13/13**, entorno temporal aislado
  fuera del Lenovo. Python `unittest` y Node test runner.
- Blob Git M1 `acc9340451f144dab31192eb4d1f5f9ac65d8a15`;
  test M1 `9fb7e30f48c001972dbfa6cd43a2b9148ad9aba6`.
  Blobs N-B1 no modificados:
  código `b6138d41402faf53108d55e76bff309617334d7c`,
  test `48db6c943eb0bf9cbaa7f7b04dbfeb37d58b8dad`.
- **Límite conocido:** `lstat` de ancestros y apertura posterior son operaciones
  separadas; esta compuerta bloquea symlinks estáticos, pero **no demuestra**
  inmunidad a una sustitución simultánea de ancestros maliciosa (TOCTOU).
  Seguir `migrationAllowed=false`; para límites de host con escritores no fiables
  exigir apertura dirfd `O_NOFOLLOW` de todos los componentes.
- Host `CONFIG_GAP / EXECUTION_ROUTING_MISMATCH` sin cambios; no existe
  readback NOSTROMO LIVE. PR #38 permanece draft hasta revisión Director.
