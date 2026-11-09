# LC-SKILL-SYNC-LIVE — canario SOURCE de observación

**Gate OPEN.** Se comprueba la distribución GitHub Skill Sync sin sincronizar, desplegar, alterar permisos ni tocar MANOJOS3. Pueden leerse datos privados en el **host autorizado**; nunca incorporarlos a Git o Drive. El PASS de un script prueba solo su condición, no LIVE_VERIFIED.

## SOURCE y dos etapas

- Canon: `SPEC.json#/backlog/active_live/1`, `#/meta/reglas_evidencia_runtime`; `config/skills.current.json#/catalog`, `#/legacy_compatibility`, `#/counts`.
- Config staged: `deployment/skill-sync/README.md` y sus dos YAML de ejemplo. Stage 1 descubre las 12 carpetas físicas mediante `paths=["skills"]`, depth 1; stage 2 selecciona 10 activas, depth 0, reteniendo en Git las dos heredadas.
- Upstream fijado: `f10b1d91f1eee3a2c82d5247bf620351486b7c1b`; el admin status devuelve `sources[].sourceId` (camelCase), normalizado a `source_id` en la evidencia.
- **Conflicto abierto:** ejemplo antiguo `librechat-vx-skills` y staged `nostromo-vx-skills`. Ningún ID se presume LIVE: leer admin `sourceId` y resolver el mirror preexistente sin renombrarlo.

## Dependencias y variables (solo entorno del host)

Bash, curl, jq, Git, SHA256, find y HTTPS. Gestor de secretos para todos los tokens; nunca usar `set -x`. No colocar valores en scripts ni en ejemplos de evidencia.

| Variable | Función |
|---|---|
| `LIBRECHAT_BASE_URL` | URL origin HTTPS exacta del servidor autorizado. |
| `LIBRECHAT_ADMIN_TOKEN` | JWT real de admin con lectura de Skill Sync y vista individual del mirror. |
| `SKILL_SYNC_SOURCE_ID` | Opcional si hay una sola fuente; con varias, identificador verificado en status. |
| `SKILLS_REPO_ROOT` | Opcional, checkout Git del repo SOURCE; por defecto raíz de este checkout. |
| `SKILLS_SOURCE_DIR` | Opcional, carpeta física `skills/` dentro del checkout. |
| `SKILLS_CATALOG_FILE` | Opcional, `config/skills.current.json` dentro del checkout. |
| `SKILL_SYNC_EVIDENCE_DIR` | Opcional, carpeta privada externa; default `${XDG_RUNTIME_DIR:-/tmp}/lc-skill-sync-$(id -u)`. |
| `SKILL_SYNC_STAGE` | `1` o `2`, configuración LIVE realmente aplicada. |
| `GITHUB_SKILLS_TOKEN` | Token GitHub read-only para comprobar ref remoto autenticado. |
| `SKILL_MIRROR_IDS_FILE` | JSON privado con IDs observados en el admin: `{schema:"libre-chat-vx.skill-sync-mirror-ids.v1",source_id:"...",skills:[{name:"...",id:"..."}]}`. |
| `LIBRECHAT_ALLOWED_ROLE_TOKEN` | JWT de una cuenta que debe poder leer los mirrors. |
| `LIBRECHAT_DENIED_ROLE_TOKEN` | JWT de una cuenta a la que se debe denegar lectura. |
| `LIBRECHAT_ALLOWED_ROLE` | Rol real esperado del primer testigo, verificado con GET `/api/user`. |
| `LIBRECHAT_DENIED_ROLE` | Rol real esperado del segundo testigo. |

Las respuestas completas (incluyendo identidad, tenant o contenido) se guardan en archivos chmod 600, carpeta chmod 700, **fuera del repo**. El script 01 exige `sourceId` y `paths`, además de HTTP 200. `source_id` en snake_case es el campo normalizado, no el campo original de LibreChat.

## Orden de ejecución futura

```bash
bash canaries/skill-sync-live/00-source-sanity.sh
bash canaries/skill-sync-live/01-authenticated-readback.sh
bash canaries/skill-sync-live/02-inventory-skills.sh
# Proporcionar las variables de stage, readback GitHub y archivo de IDs autenticados.
bash canaries/skill-sync-live/03-verify-sync-content.sh
# Proporcionar los dos tokens y roles de prueba autenticados.
bash canaries/skill-sync-live/04-permissions-and-visibility.sh
```

**Sin POST.** En el upstream fijado, incluso `GET /api/skills` puede disparar una sincronización por petición, por lo que **este canario NO llama a esa ruta de lista**. Para el mirror usa `GET /api/skills/:id` con IDs obtenidos previamente desde una fuente autorizada y lectura de GitHub ref; `GET /api/admin/skills/sync/status` no altera el mirror. No se ejecuta `POST /api/admin/skills/sync/run`.

## Qué considera cada PASS

1. **01:** endpoint admin autenticado HTTP 200 con sourceId/paths válidos y fuente seleccionada sin ambigüedad. Un 200 solo acredita lectura, no coherencia del mirror.
2. **02:** inventario físico de 12, catálogo de 10 activos y 2 heredados, sin cambiar archivos; registra JSON aunque haya discrepancia y acaba FAIL.
3. **03:** estado `succeeded`, paths de etapa correcta, 0 skipped, contadores de 12/10, HEAD checkout igual al GitHub ref autenticado; los 12/10 mirror IDs se obtienen de un readback externo privado. Para cada `SKILL.md`, `git_blob_sha` remoto y `sha256` del body del mirror deben coincidir. Un `sourceMetadata.commitSha` histórico debe ser antecesor del HEAD: no confundir git_commit_sha con git_blob_sha. Falla cerrado si falta acceso a `GET /api/skills/:id`.
4. **04:** dos cuentas de roles distintos (GET `/api/user`) prueban lectura 200 y denegación 403/404 del mismo Skill. Comprobar que no es público. Esto prueba **visibilidad efectiva de los dos testigos**, no un inventario exhaustivo de ACL internas.
5. **Gate LIVE:** además de los cuatro PASS, exigir confirmación de permisos y tenant, snapshot previo y posterior, auditoría de ACL completa cuando esté disponible, origen de los IDs, ausencia de aliases en el mirror stage 2, rollback readback y aceptación operativa. La fuente Source no prueba que la sincronización material haya ocurrido. Sin estas pruebas, **OPEN**.

## Rollback

`05-rollback.md`: no ejecuta rollback. En stage 2, conservar las 2 carpetas heredadas en Git aunque los mirrors se retiren mediante acción de admin separada y autorizada. Ante UNKNOWN_OUTCOME, readback del mismo estado/ejecución antes de reintentar materialmente.

## Notas de seguridad

Ningún token ni ID concreto está embebido. El endpoint de lectura individual `GET /api/skills/:id` usa IDs del archivo privado `SKILL_MIRROR_IDS_FILE` verificado por el operador. Un FAIL con 401/403 puede indicar permisos insuficientes, **no** ausencia de deployment. Estados runtime se mantienen `NO_DEPLOYMENT_EVIDENCE` salvo evidencia real autenticada.
