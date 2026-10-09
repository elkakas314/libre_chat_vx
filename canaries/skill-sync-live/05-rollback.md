# LC-SKILL-SYNC-LIVE — rollback / contención

1. Los scripts de `canaries/skill-sync-live/` son **GET y validación local**, sin `POST`, `PUT`, `DELETE`, cambios de YAML ni ACL. Un FAIL no concede autorización para reparar el runtime.
2. Guardar los resultados JSON privados, hora, sourceId/tenant, `git_commit_sha`, `git_blob_sha`, status, `finishedAt` y snapshot de la configuración previa; **nunca** guardar JWT ni token GitHub.
3. Ante resultado desconocido de una sincronización administrada externa, leer **el mismo** mirror y status antes de cualquier nuevo `POST`. Evitar duplicar efectos.
4. Si falló la etapa 1, conservar las 12 carpetas Git y la configuración preexistente; no aplicar etapa 2.
5. Si falló etapa 2, comparar con snapshot stage1 de 12 mirrors. La restauración del YAML anterior y una sincronización de recuperación **son materiales** y pertenecen al administrador LibreChat con autorización específica y rollback probado, fuera de este paquete.
6. Tras restauración autorizada, confirmar identidad y sourceId original, readbacks de 12 mirrors, hashes y ACL; no declarar PASS solo por HTTP 200.
7. Nunca borrar `skills/nostromo-intent-translation` ni `skills/nostromo-tool-budget` desde Git por un fallo del mirror. No inventar sourceId entre `librechat-vx-skills` y `nostromo-vx-skills`.

Si no hay snapshot verificado o falla la comprobación de tenant/permisos, mantener el gate **OPEN**.
