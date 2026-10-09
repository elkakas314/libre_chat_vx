# LC-SKILL-SYNC-LIVE — canarios SOURCE de solo lectura

**Gate OPEN; runtime NO_DEPLOYMENT_EVIDENCE.** Scripts preparados, no ejecutados en host. No despliegan, sincronizan ni eliminan nada: todas las peticiones externas son **GET**. LibreChat VX/NOSTROMO authority=false.

## Fuentes exactas

- `SPEC.json#/backlog/active_live/1`, `#/meta/reglas_evidencia_runtime`, `#/configuracion/librechat_yaml/skill_sync_id_canonicalizacion`.
- `config/skills.current.json#/counts`, `#/catalog`, `#/legacy_compatibility`.
- `deployment/skill-sync/README.md` y `librechat.skill-sync-stage{1,2}.example.yaml`.
- LibreChat upstream fijado `f10b1d91f1eee3a2c82d5247bf620351486b7c1b`: `api/server/routes/admin/skills.js`, `packages/api/src/admin/skills.ts`, `packages/api/src/skills/sync/github.ts`, `packages/data-schemas/src/types/skillSync.ts`.

**Conflicto REAL por resolver:** `SPEC.json#/configuracion/librechat_yaml/skill_sync_id_canonicalizacion` registra `librechat-vx-skills` (ejemplo antiguo, `runOnStartup:true`, depth 2) frente a `nostromo-vx-skills` (staged, `runOnStartup:false`, depth 1/0). **Ningún sourceId LIVE está confirmado**. Resolver identidad y tenant mediante lectura autenticada del servidor **antes** de cualquier activación. No duplicar IDs ni reemplazar una configuración desconocida.

## Requisitos y variables de entorno

Host autorizado: Bash, curl, jq, base64, date, HTTPS, JWT de administrador LibreChat capaz de ver credenciales/metadatos Skill Sync y token **read-only** GitHub para el repositorio privado. Ningún valor real se consigna en Git, Drive o chat. No usar `set -x`.

| Variable | Uso |
|---|---|
| `GITHUB_SKILLS_TOKEN` | Solo lectura GitHub Contents/Metadata; verificar alcance fuera del script. |
| `LC_SKILL_SOURCE_REF` | Opcional; `handoff_current_bootstrps` por defecto. |
| `LC_SKILL_EVIDENCE_DIR` | Opcional; evidencia privada `${XDG_RUNTIME_DIR:-/tmp}/lc-skill-sync-$(id -u)`. |
| `LC_BASE_URL` | Base HTTPS de LibreChat real; sin path/query. |
| `LC_ADMIN_JWT` | JWT admin con lectura de status, no se guarda en evidencia. |
| `LC_SKILL_SOURCE_ID` | Exacto, descubierto en status/admin; no usar valor supuesto. |
| `LC_EXPECTED_TENANT_ID` | Tenant exacto; omitir solo para instancia sin tenant. |
| `LC_SKILL_STAGE` | `1` (12 físicas) o `2` (10 activas). |
| `LC_SKILL_MIRROR_PROOF_FILE` | Evidencia privada de mirrors/ACL por Skill (plantilla en `expected-outputs/`). |
| `LC_SKILL_MAX_AGE_SECONDS` | TTL máximo de lecturas admin; default 900 segundos. |

Los readbacks se almacenan con permisos 600 en un directorio 700 **fuera del repositorio**. Puede haber datos privados de tenencia/ACL, por lo que no se versionan ni exportan.

## Ejecución en el host, no en este hilo

```bash
bash canaries/skill-sync-live/00-source-sanity.sh
bash canaries/skill-sync-live/01-authenticated-source-readback.sh
bash canaries/skill-sync-live/02-inventory-12-skills.sh

# Resolver sourceId y tenant a partir del GET autenticado /api/admin/skills/sync/status
# y realizar cualquier sincronización necesaria por procedimiento administrado EXTERNO.
export LC_SKILL_STAGE=1
export LC_SKILL_SOURCE_ID='VALOR_VERIFICADO_EN_ADMIN'
export LC_BASE_URL='https://URL_REAL_LIBRECHAT'
bash canaries/skill-sync-live/03-admin-sync-status.sh
export LC_SKILL_MIRROR_PROOF_FILE='/ruta/privada/mirror-proof.json'
bash canaries/skill-sync-live/04-permissions-and-visibility.sh
```

Para etapa 2, ejecutar los dos últimos scripts con `LC_SKILL_STAGE=2` **solo tras** stage 1 aceptada por humano, snapshot de rollback y aplicación separada, autorizada, del YAML de etapa 2 **al mismo sourceId**. El paquete no hace `POST /api/admin/skills/sync/run`: esa llamada escribe en el mirror. Prohibido iniciarla automáticamente. No borrar los dos alias en Git.

## Aceptación acumulativa

1. GitHub: lectura autenticada de ref y tree no truncado, `git_commit_sha` y `git_tree_sha` estables. Hashes de `config/skills.current.json` y `SKILL.md` declarados **git_blob_sha**.
2. Fuente: exactamente 12 directorios físicos `skills/*/SKILL.md`, 10 nombres activos y los alias `nostromo-intent-translation`, `nostromo-tool-budget`. Ninguna carpeta eliminada.
3. Admin: `GET /api/admin/skills/sync/status` autenticado, sourceId/tenant resueltos; `enabled=true`, `runOnStartup=false`, `status=succeeded`, contadores exactos (12/0 borrados etapa 1, 10/2 borrados etapa 2), sin skipped/partial, rutas stage1 `["skills"]` o 10 explícitas stage2. `finishedAt` fresco.
4. Mirror: por cada Skill se exige evidencia autenticada de `sourceMetadata.commitSha`, `sourceMetadata.skillBlobSha`, ámbito, visibilidad positiva y negativa con actores apropiados, no regresión y snapshot rollback. El endpoint admin de status **no aporta hashes por Skill**; por eso el `04` valida referencias separadas y exige corroboración manual. Un JSON autodeclarado no prueba autenticidad.
5. La transición etapa 1 → etapa 2 es **material**; requiere permiso admin propio y rollback operable. Verificar 2 alias fuera del mirror y aún presentes en Git. Si falta algo, **gate sigue OPEN**.

Todos los scripts finalizan con PASS/FAIL; PASS significa **únicamente** prueba indicada, no `LIVE_VERIFIED`. Un HTTP 200 aislado sigue siendo `DEPLOYED_UNVERIFIED`. Sin host/credenciales, `NO_DEPLOYMENT_EVIDENCE` y nunca `NOT_DEPLOYED`. Ante `UNKNOWN_OUTCOME`, obtener readback del mismo sync antes de reintentar.

## Contención y rollback

Ver `05-rollback.md`. No hay mutadores en este paquete. El `runOnStartup:true` del ejemplo histórico no debe mezclarse con los fragmentos staged, y el sourceId previo debe conservarse si un mirror real lo utiliza.
