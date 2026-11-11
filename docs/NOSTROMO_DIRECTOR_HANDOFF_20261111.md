# NOSTROMO — handoff técnico del Director
Fecha: 2026-11-11. Evidencia: SOURCE readback, sin instalación ni ejecución en Lenovo.
Base revisada: integration/nostromo-pr31-34-35-36-20261111 @ 38948eb5d91439b432f19c2ce3362a7b3e309e89.
Encargo E2: issue #37 (F1-L1), pendiente del hilo manual del usuario.

## Hallazgo operativo

Readback directo de deployment/nostromo-mcp/tools.mjs (fef3a20), policy.mjs (3833bd5), server.mjs (91bf8cd), agent.candidate.json (178b6d2), UPSTREAM.json y librechat-mcp.fragment.yaml:

- Agente: SOURCE_CANDIDATE_NOT_INSTALLED, enabled=false, model=null; creación mediante Agent Builder.
- MCP: un solo servidor stdio, desactivado con NOSTROMO_MCP_ENABLED=0. Toolset del fragmento selecciona preparación y el trío asíncrono; máximo 1 tarea y 120 s, estado no persistente. El modo async excluye CLI síncrono.
- Política: lectura R0 limitada a comandos enumerados; todo lo demás es R2, con aprobación física one-shot ligada al hash. spawn sin shell. Exit 0 no verifica efecto material.
- Root mismatch: YAML sólo permite /home/elkakas314/librechat/vx y /home/elkakas314/librechat/upstream; excluye librechat/nostromo, por lo que no habilita lectura de reports/handoffs/backups canónicos. Mantener cerrado hasta definir scope mínimo y ACL; no abrir todo sin revisión.
- LibreChat pin SOURCE: v0.8.8, commit f10b1d91f1eee3a2c82d5247bf620351486b7c1b; runtime no verificado. Node 24.16/npm 11.13 según la referencia fijada. El documento de integración cita verificaciones estáticas de a2acfbc, antiguas respecto de base 38948eb; no cuentan como pruebas de esa base.
- No se cambió LIVE ni se ejecutaron herramientas MANOJOS3. El acceso host no quedó acreditado.

## Ruta crítica y lotes E2

### N-B0 — preflight backend (sólo lectura, una tarea pesada máxima)
Primero resolver issue #37 sin repetir el inventario completo. En el Lenovo: HEAD/dirty de VX y upstream, servicios/procesos/puertos, Node/npm, recursos, CPU AVX, servicio Mongo actual, rutas de datos y manager de procesos. Leer estado de config redactado; nunca imprimir .env, credenciales o URI. Salida: clasificar SOURCE/INSTALLED/CONFIGURED/LIVE, identificar una sola ruta de backend/DB, datos persistentes, backup/rollback y NEXT_ACTION. Si no hay acceso local, dejar recibo tipado y continuar SOURCE.

### N-B1 — backend y base persistentes
Sólo tras N-B0. Reutilizar servicio sano; si falta DB, comparar recursos y compatibilidad antes de instalar una sola. La guía LibreChat actual indica que Compose predeterminado incluye MongoDB, Meilisearch, RAG API y vector DB; modo npm requiere servicios externos. No levantar opcionales por defecto. Validar AVX y SO: MongoDB 5+ requiere AVX en x86_64. Alinear instalación con LibreChat fijado. Aceptación: un backend, una DB, autenticación, conversación real, escritura/readback persistente tras reinicio, backup restaurable, puertos/servicios sin duplicados. Rollback desde backup comprobado, sin reset/clean.

### N-A1 — proveedor y agente
Tras N-B1, verificar binding OAuth real si existe; de lo contrario probar proveedor gratuito/local configurado. Crear agente nativo manualmente en Builder, asignar modelo real, autenticar y readback de conversación. API de pago no es requisito.

### N-M1 — MCP
Tras N-A1 y tests SOURCE del MCP: backup del YAML real; una entrada stdio; revisar namespace host/container, root scope mínimo, toolset y ACL. Canario R0 de archivo no sensible; operación R2 pequeña sólo con aprobación física exacta; verificación independiente. Documentar approval dir como excepción privada del SO. Verificar rollback YAML y backend sano.

### N-UI1 / N-MOB1
Después de B1/A1/M1: interfaz HUD con datos LIVE; luego PWA bajo HTTPS privado, autenticación, continuidad/reconexión y pruebas E2E móvil/escritorio con reinicio.

## Bloqueos

- E2: EXTERNAL_BOUNDARY puntual. El usuario abrirá un hilo único y proporcionará el prompt completo; no crear otro.
- Lenovo desde este hilo: UNAVAILABLE_TOOL/CONFIG_GAP. No repetir esquemas fallidos; E2 descubre contratos admitidos y registra recibos.
- DeepSeek: no se obtuvo sesión web controlable ni readback en este turno; asesoría no consultada, no bloquea lotes.
- No mover /home/elkakas314/upstream ni borrar backups hasta comparación, referencias, plan reversible, readback y pruebas.
- Issue #37 permanece como contrato inicial. Al existir E2, compartir este handoff y asignar N-B0; no cerrar #37 por este análisis.

Referencias oficiales actuales: https://www.librechat.ai/docs/local ; https://www.librechat.ai/docs/local/docker ; https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/mcp_servers ; https://www.mongodb.com/docs/manual/administration/production-notes/ . Contrastar con la revisión v0.8.8 y hardware/OS reales.


## Avance SOURCE posterior y pruebas

En esta rama se reparó la cobertura del árbol canónico:
- scripts/nostromo-layout.mjs: LEAVES y nostromoLayout ahora incluyen worktrees, tools, backups, runtime, reports, handoffs, manifests, staging, cache, tmp y legacy. Los imports siguen sin crear rutas; ensureNostromoDir crea sólo la hoja solicitada con permisos privados.
- scripts/nostromo-layout-relocate.mjs: la migración reversible prepara el árbol completo sólo después de superar su preflight, conservando sus reglas de identidad, mismo filesystem y rollback.
- scripts/tests/nostromo-layout.test.mjs y scripts/tests/nostromo-layout-relocate.test.mjs: se añadieron aserciones de todas las rutas, permisos y creación completa en fixtures.

Commits de la cadena de rama: layout b8a155a881dfd868dc245946bf6260a096a7ef24; migración 20dff00fd5c176b9bbb2bd720aa67d2e01d8c698; tests layout d75d8ca0c4359d2acbd3070f72958e4ebd0dfda1; tests migración 89ff7c7e2c1842b130a75ad00a733ee4ec4d6f56.

Validación: se ejecutó Node test runner contra los cuatro archivos exactos leídos desde esta rama, en un fixture temporal aislado: 7 tests, 7 PASS, 0 FAIL (145 ms). No se ejecutó la suite completa ni el Lenovo. No equivale a migración real, limpieza de /home/upstream ni verificación LIVE. El entorno actual no tiene checkout local del repo; por eso esta prueba focalizada verificó el delta modificado y sus fixtures, no todos los comandos npm del repositorio.

HEAD de la rama al registrar este handoff: 89ff7c7e2c1842b130a75ad00a733ee4ec4d6f56. No se abrió PR ni se mezcló el cambio con integration/main. Próxima aceptación: E2 lee el diff/recibo, ejecuta el lote de árbol en el Lenovo sólo tras inventario y ejecuta el set QA SOURCE completo en su checkout.


## N-B0 SOURCE implementado (sin ejecución host)

Añadí scripts/nostromo-backend-preflight.mjs y el comando nostromo:backend:preflight. El script es de sólo lectura: recoge Node/npm, AVX (booleano), RAM/disco, presencia de rutas/config sin leer valores, unidades systemd de usuario filtradas por nombre y sondas TCP de loopback para 27017/3080. La salida declara expresamente que TCP no prueba protocolo Mongo, salud LibreChat, identidad ni autenticación; no arranca servicios y nunca abre .env ni YAML.

Añadí cuatro tests en scripts/tests/nostromo-backend-preflight.test.mjs y los enganché a nostromo:qa:diagnostics. Ejecuté el comando npm run nostromo:backend:preflight:test contra los archivos exactos leídos de esta rama: 4/4 PASS, 0 FAIL. No ejecuté N-B0 sobre Lenovo; las sondas reales del script aquí serían del contenedor de trabajo, no se presentan como host Lenovo.

Readback tras publicar: script blob 3e4415f25fef2a38d6d15a38009a46cd8ccfeefd; test blob fc8d438424100a012e8a5efb8accd6e08a0e5a86; package.json blob 23aa6f53cea9bcb3fa03c941c5def8053dcc399e. El diff total de la rama respecto de integration tiene 8 archivos, 10 commits ahead, 0 behind. HEAD actual: f57ee22193b5d7c33397ba1de398392f95ac85fa.

GAP: no hay prueba de backend, Mongo ni AVX del Lenovo y no hay script de instalación decidido. N-B0 debe ejecutarse allí primero; su resultado selecciona entre reutilizar el stack actual o preparar un único backend/DB con rollback.

NEXT_ACTION: entregar issue #37 + este handoff a E2; ejecutar N-B0 primero; aceptar recibo antes de N-B1. Raíz requerida: /home/elkakas314/librechat/.