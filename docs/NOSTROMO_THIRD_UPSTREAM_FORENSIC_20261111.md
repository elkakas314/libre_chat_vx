# NOSTROMO — auditoría forense profunda del tercer checkout (2026-11-11)

## Identidad y motivo

El usuario identifica un tercer árbol separado: `/home/elkakas314/upstream`,
fuera de `/home/elkakas314/librechat`, con contenido relevante de **API,
pruebas E2E, scripts, skills y Redis**. No sustituirlo con el upstream integrado
sin inventario y reconciliación. Los tres árboles deben conservar fronteras:
`~/librechat/vx` (NOSTROMO SOURCE), `~/librechat/upstream` (LibreChat
integrado, frontend:ci PASS), `~/upstream` (checkout tercero distinto).

Últimos hechos LIVE aportados por el usuario:
- `~/upstream` y `~/librechat/upstream` tenían el mismo HEAD
  `f10b1d91f1eee3a2c82d5247bf620351486b7c1b`, pero no los mismos
  bytes ni el mismo estado del árbol de trabajo.
- `~/upstream/.env` estaba presente, sin revelar valores; su
  `package-lock.json` estaba ausente/deleted en Git; el integrated
  `~/librechat/upstream/.env` estaba ausente, pero el lockfile presente.
- Había diferencias de `client/package.json`,
  `client/src/components/Chat/Presentation.tsx` y bridge VX; las rutas
  y contratos requieren contrastarse con HEAD/estado vivo, no suposiciones.
- Las cuatro copias de seguridad históricas + npm 11 se reubicaron y
  verificaron en `~/librechat/nostromo/{backups,tools}`; el worktree de
  integración se trasladó a `~/librechat/nostromo/worktrees/integration-20261111`.
- El frontend PWA compiló; backend, Mongo, Agent Builder, MCP live,
  móvil autenticado y acceso remoto no están verificados.

## Nueva auditoría R0 — SOURCE, pendiente de ejecución en Lenovo

`scripts/audit-nostromo-third-upstream-r0.py`

Un proceso local, read-only, sin red y con cuotas de archivos, bytes y
profundidad. Obtiene:
1. `git HEAD`, branch, conteos de cambios tracked/untracked y muestra
   de rutas (sin ejecutar git reset, checkout ni fetch).
2. Top-level del tercero y del integrado, archivos y subárboles por categoría.
3. API/backend, tests/E2E, scripts/CLI, skills/plugins, Redis/colas, DB,
   agentes/MCP, seguridad, móvil/PWA y despliegue.
4. Dependencias y **nombres** de scripts en package.json, sin valores de .env.
5. Comparación SHA-256 acotada por ruta: ONLY_IN_THIRD, DIFFERENT_CONTENT,
   IDENTICAL y UNKNOWN (por presupuesto, race, symlink o lectura).
6. Detección de menciones en código fuente: Redis, API HTTP, E2E,
   skills, MCP, PWA y contenedores.
7. Conteo de referencias hardcodeadas a `~/upstream`,
   `/home/elkakas314/upstream`, `/home/elkakas314/librechat/upstream`.
8. Flags de migración y veredicto *NO MOVER/NO BORRAR SIN RECONCILIAR*.

Protecciones: NO lee `.env`, contraseñas, credenciales ni claves; no
sigue symlinks; no entra en `node_modules`, `.git`, `dist` o
cachés; stdout JSON; ninguna escritura salvo archivos de informes
creados por redirección explícita del operador bajo `~/librechat/nostromo/reports`.
Los scripts de pruebas sólo modifican fixtures temporales.

**Limitación:** no realiza un E2E material ni comprueba que Redis/Mongo
estén arrancados. Un archivo SOURCE `redis` o un paquete `bullmq`
no prueba servicio instalado/activo. Un hash idéntico no garantiza que
el archivo sea descartable. La clasificación está basada en rutas y
menciones; debe revisarse semánticamente cada hallazgo relevante.

## Uso local protegido

```bash
cd ~/librechat/nostromo/worktrees/integration-20261111
npm run nostromo:third-upstream:test
# R0: salida por pantalla, sin archivos.
npm run nostromo:third-upstream:audit
# Auditoría extensa (stdout → fichero privado en carpeta correcta):
umask 077
python3 -B scripts/audit-nostromo-third-upstream-r0.py \
  --detail=full --hash-budget-mib=128 --reference-budget-mib=32 \
  > ~/librechat/nostromo/reports/third-upstream-forensic-20261111.json
```

## Siguiente fase tras readback

1. Resumen por categoría y matriz de discrepancias, priorizar exclusivos
   de `~/upstream` (API/E2E/scripts/skills/Redis), antes de mover carpetas.
2. Leer sólo los contratos/configs no secretos relevantes y ejecutar
   pruebas E2E de forma aislada; no confundir fuente con LIVE.
3. Analizar referencias absolutas, servicios, mounts Docker/Tailscale,
   Redis y `.env` sin copiar valores secretos a Git, chat o informes.
4. Seleccionar una ubicación canónica segura bajo `~/librechat`,
   preservar el checkout original íntegro y actualizar consumidores
   con pruebas/reversión antes de decidir si se puede retirar el viejo path.
5. Implantar un único NOSTROMO con acceso móvil privado verificado,
   evitando instalar servidores duplicados por cada árbol.

Estado actual: **AUDITOR SOURCE COMMITTED / LENOVO FORENSIC PENDING**.

## Cobertura adicional y límites
- La auditoría incluye `workspacePackages` (API, cliente, data-provider, agents, MCP, E2E, Redis) y `sourceSignals` por nombre de archivo, sin devolver contenido de código.
- `crossTreePathReferences` inspecciona también referencias absolutas a `/home/elkakas314/upstream` en el upstream integrado y en VX, para evitar romper consumidores al mover el tercero. No interpreta esas menciones como usos LIVE.
- Se excluyen archivos cuyo **nombre** parece contener secretos y no se imprimen valores de los archivos fuente. No puede garantizarse que un archivo fuente de nombre inocuo carezca de secretos incrustados: el informe permanece privado y jamás se sube automáticamente a Git.
- La herramienta tiene pruebas unitarias aisladas para categorías, Redis, rutas absolutas, diferencias de hash, `.env` y symlinks. Estado SOURCE hasta ejecutar esas pruebas en Lenovo.
