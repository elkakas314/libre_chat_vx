# LibreChat VX — Triad Sync (fine-grained PAT + GitHub + Google Drive + Lenovo)
2026-11-07 · Estado SOURCE/PREPARED, RUNNING AUTO-SYNC=NO.

## ÚNICA FUENTE Y PLANOS
- SOURCE de código: rama de desarrollo de elkakas314/libre_chat_vx, diffs acotados, sin sobrescribir ramas ni forzar pushes. No usar Drive como fuente de ejecutables.
- LOCAL `/home/elkakas314/librechat/vx`: clon de la capa VX; `/home/elkakas314/librechat/upstream`: LibreChat upstream con overlay anterior; `/home/elkakas314/upstream`: upstream de referencia. Ninguna ruta local se modifica hasta verificar `git status`/untracked, hashes, backups y rollback por canal autorizado.
- DRIVE: documentación 00/10/20/30/40. Mantener baseline histórica y añadir solo deltas con HEAD, EvidenceRef y estados, usando documentos.batchUpdate con requiredRevisionId, después volver a leer.
- GITHUB: fine-grained PAT SecretRef `github:main` de MANOJOS3, verificado con `github.token.status` y `github.repo.snapshot.verify` en run `run-ce7248ec-85e8-4c68-b0e1-11414f70fbbb`: repo `elkakas314/libre_chat_vx` pull/push confirmados, sin revelar secreto. No crear otro token ni enviarlo a la UI, Drive o Git.

## Arquitectura mínima (sin orquestador nuevo)
Solicitud/avance -> MANOJOS3 Policy/Kernel/Verifier/receipt -> github.repo.snapshot.verify -> candidato en rama aislada -> GitHub PAT write o conector GitHub autenticado -> CI exact-head -> Docs requiredRevisionId + readback -> Local preflight dirty/untracked y backup -> promoción local versionada sólo con autorización y verificación -> Handoff final.
`src/operating/triadSync.ts` SOLO evalúa admisión de partes independientes y verificación de tres recibos; NO ejecuta trabajos ni scheduler, no guarda credenciales, no pretende ser un Kernel.

## Flujo de cambio
1. R0: leer ramas/HEAD/base/diff y permisos del token; comprobar la propiedad del componente, no duplicar capacidades y no actuar si OWNER/CLAIM desconocido.
2. Determinar `BASE_HEAD`, `EXPECTED_HEAD`, nombre de rama, `writeset` exacto; pin `f10b1d91f1eee3a2c82d5247bf620351486b7c1b` y conflictos de paths. El preflight usa CAS: si HEAD cambia, RECONCILE; no force.
3. Un único escritor prepara blob+tree+commit y actualiza la rama con `expected_sha`; si usa MANOJOS3 `github.repo.file.put` (R2), proteger contenido/HEAD con readback previo porque su contrato verifica la ruta pero NO hace CAS de branch global.
4. GitHub Actions build/tsc/tests, canarios y E2E upstream; usar el run del SHA exacto. Tests simulados = SOURCE, nunca efecto LIVE.
5. Actualización Drive sólo después del readback del commit y decisión de scope: comparar `revisionId`, aplicar solo delta con `write_control.requiredRevisionId`, comprobar nueva revisión y texto. Si un documento cambia en paralelo, no repetir el batch; releer y reconciliar.
6. Local: proteger cambios untracked/dirty con snapshot/manifest, verificar branch/worktree/diff, instalar SOLO overlay sobre copia apropiada, ejecutar tests y probe de 127.0.0.1:3080; capturas desktop/móvil, reabrir y rollback. No tocar `/home/elkakas314/upstream` por un avance VX.
7. Publicar receipt final por superficie: `SOURCE_SHA`, `CI_RUNS`, `DRIVE_REVISIONS`, `LOCAL_HASHES`, servicio/health y `OPEN_GATES`; nunca declarar conjunto sincronizado mientras un ámbito tenga UNKNOWN.
8. En sucesivos avances ejecutar mismo flujo, pero sin watcher permanente ni PAT en frontend. Activación programada solo cuando lectura de cambios y límites de Policy estén realmente verificados.

## Gates que siguen abiertos
LOCAL dirty/untracked UNKNOWN: la CLI registrada GIT sólo autoriza VERSION, no `git status`; no forzar a través de shell/Remote Desktop no configurado. La inspección de carpetas no prueba árbol limpio.
LibreChat web :3080, Skill Sync, Cloudflare AI Gateway, Tailscale Serve, UX orgánica definitiva y acceso a targets aún requieren canarios LIVE específicos.
VX13 canon A88: permanece en Drive y no FZ; el nuevo consumidor LibreChat debe ir al buzón VX13 con matriz producer→consumer→contract→test y propietario, sin escribir en `elkakas314/vx13/main` sin aprobación FZ.
ORÁCULO: entrada advisory mTLS LIVE propia; nunca permitir que el sync de LibreChat publique ni instale ORÁCULO/MANOJOS/VX13 indirectamente.

## Criterio PASS verificable
Github branch CAS + readback SHA + CI verde; Docs revision CAS + texto readback; LOCAL hash/dirty control + backout/health/overlay verificado. La herramienta `evaluateTriadSync` refleja gates por dominio y `verifyTriadWrite` exige pruebas exactas de las tres superficies. Todo sin efectos hasta que los propietarios y Policy autoricen.
